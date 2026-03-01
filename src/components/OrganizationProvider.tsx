import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Organization {
  id: string;
  name: string;
  slug: string;
  base_url?: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  selectOrg: (org: Organization) => void;
  refreshOrgs: () => Promise<void>;
  createOrg: (name: string, slug: string) => Promise<Organization | null>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Get Supabase credentials from environment (works in Vite/Astro build)
const SUPABASE_URL = 'PUBLIC_SUPABASE_URL' in import.meta.env ? import.meta.env.PUBLIC_SUPABASE_URL : '';
const SUPABASE_ANON_KEY = 'PUBLIC_SUPABASE_ANON_KEY' in import.meta.env ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY : '';

// Helper to load cached orgs from localStorage
function loadCachedOrgs(): { organizations: Organization[]; selectedOrg: Organization | null } {
  try {
    const cachedOrgs = localStorage.getItem('cached_organizations');
    const cachedSelectedId = localStorage.getItem('selected_org_id');

    if (cachedOrgs) {
      const orgs: Organization[] = JSON.parse(cachedOrgs);
      const selected = cachedSelectedId ? orgs.find(o => o.id === cachedSelectedId) || null : null;
      return { organizations: orgs, selectedOrg: selected };
    }
  } catch (e) {
    console.error('Error loading cached orgs:', e);
  }
  return { organizations: [], selectedOrg: null };
}

// Helper to cache orgs to localStorage
function cacheOrgs(orgs: Organization[]) {
  try {
    localStorage.setItem('cached_organizations', JSON.stringify(orgs));
  } catch (e) {
    console.error('Error caching orgs:', e);
  }
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  // Load cached data immediately to avoid showing loading state
  const cached = loadCachedOrgs();
  const [organizations, setOrganizations] = useState<Organization[]>(cached.organizations);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(cached.selectedOrg);
  const [loading, setLoading] = useState(cached.organizations.length === 0);
  const [initialLoadDone, setInitialLoadDone] = useState(cached.organizations.length > 0);

  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_ANON_KEY;

  const refreshOrgs = async () => {
    const stored = localStorage.getItem('sb_session');
    if (!stored) {
      setLoading(false);
      setInitialLoadDone(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed.access_token) {
        setLoading(false);
        setInitialLoadDone(true);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${parsed.access_token}` }
        }
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setInitialLoadDone(true);
        return;
      }

      // Fetch organizations via the junction table
      const { data: userOrgs, error } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          organizations!inner(id, name, slug, base_url)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching organizations:', error);
        // Fallback: try direct organizations table (backward compatibility)
        const { data: directOrgs } = await supabase
          .from('organizations')
          .select('id, name, slug, base_url')
          .limit(1);

        if (directOrgs && directOrgs.length > 0) {
          setOrganizations(directOrgs);
          cacheOrgs(directOrgs);
          // Check localStorage for previously selected org
          const savedOrgId = localStorage.getItem('selected_org_id');
          const savedOrg = directOrgs.find(o => o.id === savedOrgId);
          setSelectedOrg(savedOrg || directOrgs[0]);
        }
        setLoading(false);
        setInitialLoadDone(true);
        return;
      }

      if (userOrgs && userOrgs.length > 0) {
        // Flatten the nested organization data
        const orgs = userOrgs.map((uo: any) => ({
          id: uo.organizations.id,
          name: uo.organizations.name,
          slug: uo.organizations.slug,
          base_url: uo.organizations.base_url
        }));

        setOrganizations(orgs);
        cacheOrgs(orgs);

        // Check localStorage for previously selected org
        const savedOrgId = localStorage.getItem('selected_org_id');
        const savedOrg = orgs.find(o => o.id === savedOrgId);
        setSelectedOrg(savedOrg || orgs[0]);
      }
      setLoading(false);
      setInitialLoadDone(true);
    } catch (e) {
      console.error('Error in org provider:', e);
    }

    setLoading(false);
  };

  const selectOrg = (org: Organization) => {
    setSelectedOrg(org);
    localStorage.setItem('selected_org_id', org.id);
    // Also update the cached orgs to ensure the selected org is in the list
    setOrganizations(prev => {
      if (!prev.find(o => o.id === org.id)) {
        const newOrgs = [...prev, org];
        cacheOrgs(newOrgs);
        return newOrgs;
      }
      return prev;
    });
  };

  const createOrg = async (name: string, slug: string): Promise<Organization | null> => {
    const stored = localStorage.getItem('sb_session');
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      if (!parsed.access_token) return null;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { Authorization: `Bearer ${parsed.access_token}` }
        }
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, slug: slug.toLowerCase() })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add the user to the organization with owner role
      await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'owner'
        });

      // Create default widget settings
      await supabase.from('widget_settings').insert({
        organization_id: org.id,
        accent_color: '#6366f1',
        position: 'bottom_right',
        enabled: true
      });

      // Refresh the org list
      await refreshOrgs();

      // Select the newly created org
      setSelectedOrg(org);
      localStorage.setItem('selected_org_id', org.id);

      return org;
    } catch (e) {
      console.error('Error creating organization:', e);
      return null;
    }
  };

  useEffect(() => {
    refreshOrgs();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organizations, selectedOrg, loading, selectOrg, refreshOrgs, createOrg }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
