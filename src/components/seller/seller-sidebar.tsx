'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sellerNavItems } from './navigation-items';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
      <Card className="p-2.5 space-y-1">
        {sellerNavItems.map(item => {
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-3 transition-colors',
                'hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <span className={cn('rounded-lg border p-2', isActive ? 'border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground' : 'border-transparent bg-muted text-muted-foreground')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className={cn('text-xs leading-5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/80')}>
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </Card>
      <div className="mt-4">
        <Button asChild className="w-full" variant="secondary">
          <Link href="/seller/create">
            <Plus className="mr-2 h-4 w-4" />
            Create new listing
          </Link>
        </Button>
      </div>
    </aside>
  );
}
