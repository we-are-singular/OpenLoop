interface OrgNavProps {
  org: string;
  currentPage: 'feedback' | 'roadmap' | 'announcements';
  orgName?: string;
}

import { useState } from 'react';

export default function OrgNav({ org, currentPage, orgName }: OrgNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: `/~/${org}/feedback`, label: 'Feedback', page: 'feedback' },
    { href: `/~/${org}/roadmap`, label: 'Roadmap', page: 'roadmap' },
    { href: `/~/${org}/announcements`, label: 'Updates', page: 'announcements' }
  ];

  return (
    <nav className="bg-white border-b mb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Mobile menu button */}
        <div className="flex items-center justify-between md:hidden">
          <a
            href="/"
            className="px-3 py-3 text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            {orgName || org}
          </a>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-2">
            {links.map(link => (
              <a
                key={link.page}
                href={link.href}
                className={`block px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPage === link.page
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1 -mb-px">
          {/* Home/Logo link */}
          <a
            href="/"
            className="px-4 py-3 text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            {orgName || org}
          </a>
          <span className="text-gray-300">|</span>
          {links.map(link => (
            <a
              key={link.page}
              href={link.href}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                currentPage === link.page
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
