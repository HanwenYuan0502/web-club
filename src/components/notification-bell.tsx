'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { notifications as notifApi, type Notification } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, ExternalLink } from 'lucide-react';

export function NotificationBell() {
  const { getToken, isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await notifApi.list(token);
      setNotifs(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [getToken]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, load]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      await notifApi.markAllRead(token);
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleClick = (n: Notification) => {
    if (n.linkUrl) {
      router.push(n.linkUrl);
      setOpen(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" />Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifs.slice(0, 20).map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {n.linkUrl && <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
