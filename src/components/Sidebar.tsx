"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Search, Database, Users, ShieldAlert, Trash2, MessageSquare, CheckCircle, Settings, X } from "lucide-react";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const getLinks = () => {
    const links = [];

    // All roles can see Dashboard home and Chat
    links.push({ name: "الرئيسية", href: "/dashboard", icon: Shield });

    if (role === "CHECKPOINT" || role === "ADMIN") {
      links.push({ name: "الفيش والتفتيش", href: "/dashboard/search", icon: Search });
    }

    if (role === "DATA_ENTRY" || role === "ADMIN") {
      links.push({ name: "إدارة القيود والسجلات", href: "/dashboard/data-entry", icon: Database });
    }

    if (role === "ADMIN") {
      links.push({ name: "طلبات التعديل", href: "/dashboard/admin/requests", icon: CheckCircle });
      links.push({ name: "إدارة التصاريح والمستخدمين", href: "/dashboard/admin/users", icon: Users });
      links.push({ name: "سجل الرقابة والنشاط", href: "/dashboard/admin/logs", icon: ShieldAlert });
      links.push({ name: "سلة المحذوفات", href: "/dashboard/admin/trash", icon: Trash2 });
    }

    links.push({ name: "الاتصالات الميدانية", href: "/dashboard/chat", icon: MessageSquare });
    links.push({ name: "إعدادات الحساب", href: "/dashboard/settings", icon: Settings });

    return links;
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-[#111827] border-l border-[#1F2937] flex flex-col transition-all duration-300">
      <div className="h-20 flex items-center justify-between border-b border-[#1F2937] p-4">
        <Link href="/dashboard" className="flex items-center space-x-3 space-x-reverse text-white">
          <img
            src="/logo.png"
            alt="NCSC"
            className="w-10 h-10 object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/public/logo.png';
            }}
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-wider uppercase leading-none">N C S C</span>
            <span className="text-[10px] text-[#10B981] font-mono mt-0.5 uppercase tracking-tighter">Security System</span>
          </div>
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                  ? "bg-gradient-to-r from-[#2563EB]/20 to-transparent text-[#2563EB] border-r-2 border-[#2563EB]"
                  : "text-gray-300 hover:bg-[#1F2937] hover:text-white"
                }`}
            >
              <Icon className={`w-5 h-5 ml-3 transition-colors ${isActive ? "text-[#2563EB]" : "text-gray-400 group-hover:text-gray-200"}`} />
              {link.name}
              {isActive && (
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#2563EB]/10 to-transparent pointer-events-none"></div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1F2937]">
        <div className="bg-[#0B0F19] rounded-lg p-3 border border-[#1F2937] flex items-center space-x-3 space-x-reverse">
          <div className={`w-3 h-3 rounded-full animate-pulse ${role === "ADMIN" ? "bg-[#2563EB]" : "bg-[#10B981]"}`}></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{role || "Loading..."}</span>
            <span className="text-sm font-bold text-white truncate max-w-[150px]">{(session?.user as any)?.username || "..."}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
