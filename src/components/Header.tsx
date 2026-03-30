"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell, Menu } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-6 z-10 sticky top-0 backdrop-blur-md bg-opacity-90">
      <div className="flex items-center space-x-4 space-x-reverse">
        <button className="lg:hidden text-gray-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-2 space-x-reverse">
          <img
            src="/logo.png"
            alt="NCSC"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/public/logo.png';
            }}
          />
          <span className="text-gray-300 font-bold tracking-wide uppercase text-sm">نظام التصريح الأمني</span>
        </div>
      </div>

      <div className="flex items-center space-x-6 space-x-reverse">
        <button className="relative text-gray-400 hover:text-[#2563EB] transition-colors rounded-full p-2 hover:bg-[#1F2937]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-[#111827]"></span>
        </button>

        <div className="w-px h-6 bg-[#1F2937]"></div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-[#EF4444] transition-colors group"
        >
          <span className="text-sm font-medium group-hover:text-[#EF4444]">إنهاء الجلسة</span>
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </header>
  );
}
