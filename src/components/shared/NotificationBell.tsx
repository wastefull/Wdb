import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import * as api from "../../utils/api";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type:
    | "submission_approved"
    | "feedback_received"
    | "new_review_item"
    | "article_published"
    | "content_flagged";
  content_id: string;
  content_type: "material" | "article" | "submission";
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
  isAdmin: boolean;
}

export function NotificationBell({ userId, isAdmin }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, isAdmin]);

  // Reload notifications when popover is opened
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Admin gets both their notifications and admin notifications
      const userNotifications = await api.getNotifications(userId);
      let allNotifications = userNotifications;

      if (isAdmin) {
        const adminNotifications = await api.getNotifications("admin");
        allNotifications = [...userNotifications, ...adminNotifications];
        // Remove duplicates
        allNotifications = allNotifications.filter(
          (n, i, arr) => arr.findIndex((t) => t.id === n.id) === i
        );
      }

      // Sort by date (newest first)
      allNotifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error) {
      // Silently fail - notifications are non-critical
      // Don't log or propagate errors to prevent session expiry triggers
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead(userId);
      if (isAdmin) {
        await api.markAllNotificationsAsRead("admin");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "submission_approved":
        return "✅";
      case "feedback_received":
        return "💬";
      case "new_review_item":
        return "📝";
      case "article_published":
        return "🎉";
      case "content_flagged":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-1 hover:opacity-70 transition-opacity"
          aria-label={`Notifications ${
            unreadCount > 0 ? `(${unreadCount} unread)` : ""
          }`}
        >
          <Bell size={14} className="text-black/60 dark:text-white/60" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 flex items-center justify-center bg-[#e6beb5] text-black text-[8px] rounded-full font-['Sniglet:Regular',_sans-serif]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-[1.5px] border-[#211f1c] dark:border-white/20 bg-white dark:bg-[#2a2825]"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c]/20 dark:border-white/20">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-['Sniglet:Regular',_sans-serif] text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#211f1c] dark:border-white"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell
                size={32}
                className="mx-auto mb-3 text-black/30 dark:text-white/30"
              />
              <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/60 dark:text-white/60">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#211f1c]/10 dark:divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-[#e5e4dc] dark:hover:bg-[#3a3835] transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-1">
                        {notification.message}
                      </p>
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black/50 dark:text-white/50">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
