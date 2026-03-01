import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe HTML output
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true // Convert \n to <br>
});

// Check if we're in a browser environment with DOM
const isBrowser = typeof window !== 'undefined';

// Create a DOMPurify instance only in browser, or use a no-op for server
const getPurify = () => {
  if (!isBrowser) {
    return {
      sanitize: (html: string) => html
    };
  }
  return DOMPurify(window.document);
};

/**
 * Parse markdown content and return sanitized HTML
 * Uses marked library with GitHub Flavored Markdown support
 * and DOMPurify to prevent XSS attacks
 */
export function parseMarkdown(content: string | null | undefined): string {
  if (!content) return '';

  try {
    const html = marked.parse(content) as string;

    // Sanitize HTML to prevent XSS attacks
    const purify = getPurify();
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
                      'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                      'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
      ALLOW_DATA_ATTR: false
    });
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback to simple line-break conversion with basic HTML escaping
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Convert newlines to paragraphs
    return escaped
      .split('\n\n')
      .map(line => `<p>${line.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }
}

/**
 * Strip markdown formatting and return plain text
 * Useful for previews and truncations
 */
export function stripMarkdown(content: string | null | undefined): string {
  if (!content) return '';

  return content
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    .replace(/^\*\*\*+$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Convert newlines to spaces for single-line display
    .replace(/\n+/g, ' ')
    .trim();
}
