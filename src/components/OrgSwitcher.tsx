import { useState, useRef, useEffect } from 'react';
import { useOrganization } from './OrganizationProvider';

interface OrgSwitcherProps {
  onCreateNew?: () => void;
}

export default function OrgSwitcher({ onCreateNew }: OrgSwitcherProps) {
  const { organizations, selectedOrg, selectOrg, loading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (organizations.length === 0) {
   // return null;
  }

  // If there's only one org and user can create new, show "Create New" option
  const showCreateNew = organizations.length < 1 || onCreateNew;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="truncate flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate">{selectedOrg?.name || 'Select Organization'}</span>
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                selectOrg(org);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                selectedOrg?.id === org.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
              }`}
            >
              <span className="truncate">{org.name}</span>
              {selectedOrg?.id === org.id && (
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          {showCreateNew && (
            <div className="border-t my-1"></div>
          )}

          {showCreateNew && (
            <button
              onClick={() => {
                setIsOpen(false);
                if (onCreateNew) {
                  onCreateNew();
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Organization
            </button>
          )}
        </div>
      )}
    </div>
  );
}
