"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Search, Database, Users, ShieldAlert, Trash2, MessageSquare, CheckCircle, Settings, X, Send, Bell } from "lucide-react";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const getLinks = () => {
    const links = [];
    links.push({ name: "الرئيسية", href: "/dashboard", icon: Shield });
    if (role === "CHECKPOINT" || role === "ADMIN") {
      links.push({ name: "الفيش والتفتيش", href: "/dashboard/search", icon: Search });
    }
    if (role === "DATA_ENTRY" || role === "ADMIN") {
      links.push({ name: "إدارة القيود والسجلات", href: "/dashboard/data-entry", icon: Database });
    }
    if (role === "ADMIN") {
      links.push({ name: "طلبات التعديل", href: "/dashboard/admin/requests", icon: CheckCircle });
      links.push({ name: "إدارة المستخدمين", href: "/dashboard/admin/users", icon: Users });
      links.push({ name: "بث البرقيات والتعميمات", href: "/dashboard/admin/circulars", icon: Send }); // New Admin Link
      links.push({ name: "سجل الرقابة", href: "/dashboard/admin/logs", icon: ShieldAlert });
      links.push({ name: "سلة المحذوفات", href: "/dashboard/admin/trash", icon: Trash2 });
    }
    links.push({ name: "البرقيات والتعميمات", href: "/dashboard/notifications", icon: Bell }); // New User Link
    links.push({ name: "الاتصالات الميدانية", href: "/dashboard/chat", icon: MessageSquare });
    links.push({ name: "إعدادات الحساب", href: "/dashboard/settings", icon: Settings });
    return links;
  };

  const links = getLinks();

  return (
    <aside className="w-72 sm:w-64 bg-[#111827] border-l border-[#1F2937] flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between border-b border-[#1F2937] px-4 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 text-white min-w-0">
          <img
            src="/logo.png"
            alt="NCSC"
            className="w-9 h-9 object-contain shrink-0"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/public/logo.png'; }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base tracking-wider uppercase leading-none">N C S C</span>
            <span className="text-[10px] text-[#10B981] font-mono mt-0.5 uppercase tracking-tighter">Security System</span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? "bg-gradient-to-r from-[#2563EB]/20 to-transparent text-[#2563EB] border-r-2 border-[#2563EB]"
                  : "text-gray-400 hover:bg-[#1F2937] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#2563EB]" : "text-gray-500 group-hover:text-gray-200"}`} />
              <span className="truncate">{link.name}</span>
              {isActive && <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#2563EB]/10 to-transparent pointer-events-none"></div>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#1F2937] shrink-0">
        <div className="bg-[#0B0F19] rounded-lg p-3 border border-[#1F2937] flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${role === "ADMIN" ? "bg-[#2563EB]" : "bg-[#10B981]"}`}></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{role || "..."}</span>
            <span className="text-sm font-bold text-white truncate">{(session?.user as any)?.username || "..."}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
