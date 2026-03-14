"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";

import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { NotificationListItem } from "@/types/communications";

function normalizeActionUrl(actionUrl: string | null) {
  if (!actionUrl) {
    return null;
  }

  if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
    try {
      const url = new URL(actionUrl);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return actionUrl;
    }
  }

  return actionUrl;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadNotifications() {
      const [listResult, unreadResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("id, title, body, action_url, resource_type, resource_id, created_at, read_at, sent_via, type")
          .eq("recipient_id", userId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .is("deleted_at", null)
          .is("read_at", null),
      ]);

      setNotifications((listResult.data ?? []) as NotificationListItem[]);
      setUnreadCount(unreadResult.count ?? 0);
    }

    void loadNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-error-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-96 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Recent updates across your loans.</p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-primary-700 disabled:text-gray-400"
              disabled={!unreadCount || isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await markAllNotificationsRead();
                  if (!result.error) {
                    setNotifications((current) =>
                      current.map((notification) => ({
                        ...notification,
                        read_at: notification.read_at ?? new Date().toISOString(),
                      })),
                    );
                    setUnreadCount(0);
                  }
                })
              }
            >
              Mark all read
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {notifications.length ? (
              notifications.map((notification) => {
                const href = normalizeActionUrl(notification.action_url) ?? "#";

                return (
                  <Link
                    key={notification.id}
                    href={href}
                    onClick={() => {
                      setIsOpen(false);
                      if (!notification.read_at) {
                        startTransition(async () => {
                          const result = await markNotificationRead(notification.id);
                          if (!result.error) {
                            setNotifications((current) =>
                              current.map((item) =>
                                item.id === notification.id
                                  ? { ...item, read_at: new Date().toISOString() }
                                  : item,
                              ),
                            );
                            setUnreadCount((current) => Math.max(0, current - 1));
                          }
                        });
                      }
                    }}
                    className={cn(
                      "block rounded-xl border px-3 py-3 transition-colors",
                      notification.read_at
                        ? "border-gray-200 bg-white hover:border-gray-300"
                        : "border-primary-200 bg-primary-25 hover:border-primary-300",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                        {notification.body ? (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.body}</p>
                        ) : null}
                      </div>
                      {!notification.read_at ? (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-600" aria-hidden="true" />
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                      <span>{notification.type.replaceAll("_", " ")}</span>
                      <span>{formatDate(notification.created_at, "MMM d, h:mm a")}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
