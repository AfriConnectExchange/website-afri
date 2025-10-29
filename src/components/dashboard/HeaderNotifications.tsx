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
      const q = query(coll, where('recipientId', '==', user.id), orderBy('created_at', 'desc'), limit(5));
      const unsub = onSnapshot(q, (snap) => {
        const data: NotificationItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
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

      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-medium">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No recent notifications</div>
        ) : (
          items.map(item => (
            <Link key={item.id} href={item.link || '/notifications'}>
              <DropdownMenuItem className="flex flex-col text-sm">
                <span className="font-medium truncate">{item.title}</span>
                {item.body && <span className="text-xs text-muted-foreground truncate">{item.body}</span>}
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
