import { OrganizationProvider, useOrganization } from './OrganizationProvider';
import type { ReactNode } from 'react';
import { useState } from 'react';
import OrgSwitcher from './OrgSwitcher';

interface AdminLayoutProps {
  children?: ReactNode;
}

function CreateOrgModal({ onClose }: { onClose: () => void }) {
  const { createOrg, organizations } = useOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxOrgs = 5;
  const canCreate = organizations.length < maxOrgs;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;

    setLoading(true);
    setError('');

    try {
      const org = await createOrg(name, slug);
      if (org) {
        onClose();
      } else {
        setError('Failed to create organization');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    }
    setLoading(false);
  }

  if (!canCreate) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Organization Limit Reached</h2>
          <p className="text-gray-600 mb-4">
            You have reached the maximum of {maxOrgs} organizations. Please upgrade your plan to create more.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Organization</h2>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Acme Inc."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="acme"
              required
            />
            <p className="text-gray-500 text-sm mt-1">This will be used in your public URL: /acme</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: { children?: ReactNode }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="flex">
        <aside id="sidebar" className="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 min-h-screen transform -translate-x-full lg:translate-x-0 transition-transform duration-200">
          <div className="p-6">
            <a href="/admin" className="text-xl font-bold text-gray-900">OpenLoop</a>
          </div>

          <div className="px-4 mb-4">
            <OrgSwitcher onCreateNew={() => setShowCreateModal(true)} />
          </div>

          <nav className="px-4 space-y-1">
            <a href="/admin" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Dashboard</a>
            <a href="/admin/posts" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Feedback</a>
            <a href="/admin/announcements" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Announcements</a>
            <a href="/admin/settings" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Settings</a>
          </nav>
          <div className="absolute bottom-6 px-4 w-64">
            <button id="signout-btn" className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg">
              Sign Out
            </button>
          </div>
        </aside>

        <div id="sidebar-overlay" className="fixed inset-0 bg-black/50 z-30 hidden lg:hidden"></div>

        <main className="flex-1 p-4 lg:p-8 lg:ml-0 ml-0">
          {children}
        </main>
      </div>

      {showCreateModal && <CreateOrgModal onClose={() => setShowCreateModal(false)} />}
    </>
  );
}

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  return (
    <OrganizationProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </OrganizationProvider>
  );
}
