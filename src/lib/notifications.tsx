"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  errandId: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastNotificationRef = useRef<Set<string>>(new Set());

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  }, [user]);

  const markAsRead = useCallback(async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {}
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, [user]);

  const showNotificationToast = useCallback((notification: Notification) => {
    // Deduplicate — don't toast the same notification twice
    if (lastNotificationRef.current.has(notification.id)) return;
    lastNotificationRef.current.add(notification.id);

    // Cap the dedup set at 200 entries
    if (lastNotificationRef.current.size > 200) {
      const arr = Array.from(lastNotificationRef.current);
      lastNotificationRef.current = new Set(arr.slice(-100));
    }

    const url = notification.errandId ? `/errands/${notification.errandId}` : undefined;

    toast(notification.title, {
      description: notification.message,
      action: url
        ? {
            label: "View",
            onClick: () => { window.location.href = url; },
          }
        : undefined,
      duration: 8000,
    });
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refreshNotifications();
  }, [user, refreshNotifications]);

  // SSE connection for real-time notifications
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NOTIFICATION") {
          setNotifications((prev) => [data.notification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
          showNotificationToast(data.notification);
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Reconnect after 5s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, showNotificationToast]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
