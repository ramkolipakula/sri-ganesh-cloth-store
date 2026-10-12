import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Clock, ShoppingBag, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { useNotifications } from "@/components/site/NotificationBell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Sri Ganesh Cloth Centre" },
      {
        name: "description",
        content: "View updates regarding your orders and payments at Sri Ganesh Cloth Centre.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const { user, isAdmin, loading } = useAuth();
  const { data: notifications, isLoading } = useNotifications(50);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* ignore */
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update notifications";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        Loading notifications…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Bell className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Please sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to view notifications regarding your orders and status updates.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/notifications" }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Notifications</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {unreadCount > 0
              ? `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
              : "You are all caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="self-start text-xs font-semibold"
          >
            <CheckCheck className="mr-1.5 size-3.5" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border bg-muted/40" />
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Bell className="mx-auto size-10 text-muted-foreground/60" />
            <h2 className="mt-3 font-display text-lg font-bold">No notifications yet</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              You will receive updates here when you place orders or payments are verified.
            </p>
            <Link
              to="/shop"
              search={{}}
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          notifications.map((notif) => {
            const isRead = notif.is_read;
            const targetUrl = isAdmin ? "/admin" : notif.order_id ? "/account" : "/shop";

            return (
              <div
                key={notif.id}
                onClick={() => !isRead && markAsRead(notif.id)}
                className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition ${
                  isRead
                    ? "bg-card text-foreground opacity-80"
                    : "border-primary/40 bg-primary/5 text-foreground shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                      isRead
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <Bell className="size-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold">{notif.title}</h2>
                      {!isRead && (
                        <span className="size-2 rounded-full bg-primary" aria-label="Unread" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {fmtDate(notif.created_at)}
                      </span>
                      {notif.order_id && (
                        <Link to={targetUrl} className="font-semibold text-primary hover:underline">
                          View Order →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notif.id);
                    }}
                    className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
