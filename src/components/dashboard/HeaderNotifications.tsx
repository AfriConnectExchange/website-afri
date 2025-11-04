"use client";

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  link?: string;
  created_at?: string;
  read?: boolean;
}

export default function HeaderNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    try {
      const coll = collection(db, 'notifications');
      // The server APIs and writers use `user_id` as the recipient field. Use
      // the same field name here so the header dropdown and notifications
      // page return the same results.
      const q = query(coll, where('user_id', '==', user.id), orderBy('created_at', 'desc'), limit(5));
      const unsub = onSnapshot(q, (snap) => {
        const data: NotificationItem[] = snap.docs.map(d => {
          const raw = d.data() as any;
          return {
            id: d.id,
            title: raw.title || raw.message || 'Notification',
            body: raw.body || raw.message || null,
            link: raw.link || raw.url || null,
            created_at: raw.created_at || raw.timestamp || null,
            read: !!raw.read,
          };
        });
        setItems(data);
      });
      return () => unsub();
    } catch (err) {
      // If the collection doesn't exist or permissions prevent reading, fall back to empty list
      console.warn('Notifications listener failed', err);
      setItems([]);
    }
  }, [user]);

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Notifications" className="relative h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-muted/50">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

    {/* Increased width and allow scrolling for long notification lists/content so
      the header dropdown displays nicely in previews. */}
    <DropdownMenuContent className="w-96 max-h-80 overflow-y-auto" align="end" side="bottom" sideOffset={8} forceMount>
        <DropdownMenuLabel className="font-medium">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No recent notifications</div>
        ) : (
          items.map(item => (
            <Link key={item.id} href={item.link || '/notifications'} className="block">
              <DropdownMenuItem className="flex flex-col items-start justify-center text-sm py-3 px-4 gap-1.5 min-h-[60px]">
                <span className="font-medium leading-normal break-words w-full">{item.title}</span>
                {item.body && <span className="text-xs text-muted-foreground leading-relaxed break-words w-full">{item.body}</span>}
              </DropdownMenuItem>
            </Link>
          ))
        )}
        <DropdownMenuSeparator />
        <Link href="/notifications"><DropdownMenuItem className="text-sm">View all notifications</DropdownMenuItem></Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
