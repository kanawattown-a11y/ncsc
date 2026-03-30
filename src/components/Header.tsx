"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell, Menu, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const username = (session?.user as any)?.username;
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUrgent, setHasUrgent] = useState(false);

  const fetchUnread = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        const unread = data.filter(n => !n.isRead);
        setUnreadCount(unread.length);
        setHasUrgent(unread.some(n => n.priority === "URGENT"));
      }
    } catch (err) {
      console.error("Poll error", err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [session, pathname]); // Re-fetch on page change too

  return (
    <header className="h-14 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-3 sm:px-6 z-10 sticky top-0 backdrop-blur-md bg-opacity-90 shrink-0">
      {/* Left side: menu toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors"
          aria-label="قائمة التنقل"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="NCSC"
            className="w-7 h-7 object-contain"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/public/logo.png'; }}
          />
          <span className="text-gray-300 font-bold tracking-wide uppercase text-xs sm:text-sm hidden xs:block">نظام NCSC</span>
        </div>
      </div>

      {/* Right side: actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Username badge - hide on very small screens */}
        {username && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-[#1F2937] px-2.5 py-1 rounded-full border border-[#374151]">
            <Shield className="w-3 h-3 text-blue-500" />
            {username}
          </span>
        )}

        <Link href="/dashboard/notifications" className="relative group">
          <div className={`text-gray-400 group-hover:text-[#2563EB] transition-colors rounded-lg p-2 group-hover:bg-[#1F2937] ${hasUrgent && unreadCount > 0 ? "animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]" : ""}`}>
            <Bell className={`w-5 h-5 ${hasUrgent && unreadCount > 0 ? "text-red-500" : ""}`} />
            {unreadCount > 0 && (
              <span className={`absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[8px] font-bold text-white rounded-full ring-1 ring-[#111827] ${hasUrgent ? "bg-red-600" : "bg-blue-600"}`}>
                {unreadCount > 9 ? "+9" : unreadCount}
              </span>
            )}
          </div>
        </Link>

        <div className="w-px h-5 bg-[#1F2937] hidden sm:block"></div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#EF4444] transition-colors group p-2 rounded-lg hover:bg-[#EF4444]/10"
        >
          <span className="text-xs sm:text-sm font-medium hidden sm:block">خروج</span>
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </header>
  );
}
