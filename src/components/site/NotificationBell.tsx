import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", user?.id, limit],
    enabled: !!user,
    refetchInterval: 60_000, // fallback if realtime disconnects
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);
  return q;
}

export function NotificationBell() {
  const { data } = useNotifications();
  const unread = data?.filter((n) => !n.is_read).length ?? 0;
  return (
    <Link to="/notifications" className="relative rounded-md p-2 hover:bg-muted" aria-label={`Notifications, ${unread} unread`}>
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
