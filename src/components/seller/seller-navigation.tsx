'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { sellerNavItems } from './navigation-items';

export function SellerNavigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-20 z-20 mb-4 sm:mb-6 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex overflow-x-auto gap-2 sm:gap-3 px-4 py-2 sm:px-0">
        {sellerNavItems.map(item => {
          const isActive = item.href === '/seller'
            ? pathname === '/seller'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all border',
                'hover:border-primary/40 hover:text-primary',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow'
                  : 'bg-white/70 text-muted-foreground border-transparent shadow-sm'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
