import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('org');

  if (!slug) {
    return new Response('Missing org parameter', { status: 400 });
  }

  // Get org
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single();

  if (!organization) {
    return new Response(`Organization not found: ${slug}`, { status: 404 });
  }

  // Get published announcements
  const { data: allAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, content, published_at, created_at')
    .eq('organization_id', organization.id)
    .order('published_at', { ascending: false });

  const announcements = allAnnouncements?.filter(a => a.published_at !== null) || [];

  const siteUrl = url.origin;
  const feedUrl = `${siteUrl}/~/${slug}`;

  // Build RSS XML
  const rssItems = announcements.map((announcement: any) => {
    const announcementUrl = `${siteUrl}/~/${slug}/announcements#announcement-${announcement.id}`;
    const pubDate = announcement.published_at
      ? new Date(announcement.published_at).toUTCString()
      : new Date(announcement.created_at).toUTCString();

    const description = announcement.content
      .replace(/[#*_`~\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .slice(0, 300);

    return `
    <item>
      <title><![CDATA[${announcement.title}]]></title>
      <link>${announcementUrl}</link>
      <guid isPermaLink="true">${announcementUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}...]]></description>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${organization.name} - Announcements]]></title>
    <link>${feedUrl}/announcements</link>
    <description><![CDATA[${organization.description || `Latest announcements from ${organization.name}`}]]></description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
