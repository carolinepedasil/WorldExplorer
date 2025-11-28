'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/countries', label: 'Explore Countries' },
  { href: '/events/search', label: 'Search Events' },
  { href: '/itinerary', label: 'My Itinerary' },
  { href: '/manage-links', label: 'Manage Shared Links' },
];

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/dashboard' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-blue-600 dark:text-blue-400"
        >
          World Explorer
        </Link>

        <nav className="flex flex-wrap gap-2 md:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
