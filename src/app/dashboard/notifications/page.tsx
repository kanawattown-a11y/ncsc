"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  ChevronRight,
  Shield,
  BookOpen
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error("Mark read error", err);
    }
  };

  const filtered = notifications.filter(n => filter === "ALL" || !n.isRead);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#2563EB] border-b-4 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
             <Bell className="w-6 h-6 text-blue-500" /> البرقيات والتعميمات الواردة
          </h1>
          <p className="text-gray-400 text-sm">التوجيهات والرسائل الرسمية الصادرة من القيادة.</p>
        </div>
        <div className="flex bg-[#0B0F19] p-1 rounded-lg border border-[#1F2937]">
           <button 
             onClick={() => setFilter("ALL")}
             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === "ALL" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
           >
              الكل
           </button>
           <button 
             onClick={() => setFilter("UNREAD")}
             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === "UNREAD" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
           >
              غير المقروء ({notifications.filter(n => !n.isRead).length})
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 animate-pulse">
           <Loader2 className="w-10 h-10 animate-spin mb-4" />
           <p className="font-bold">جاري جلب البرقيات من السيرفر...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-20 text-center text-gray-600 italic">
           لا توجد برقيات {filter === "UNREAD" ? "غير مقروءة" : ""} حالياً.
        </div>
      ) : (
        <div className="space-y-4">
           {filtered.map((n) => (
             <div 
               key={n.id} 
               onClick={() => !n.isRead && markAsRead(n.id)}
               className={`group bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg transition-all hover:bg-[#1F2937]/50 cursor-pointer relative overflow-hidden flex flex-col sm:flex-row gap-4 
               ${!n.isRead ? 'border-l-4 border-l-blue-500 ring-1 ring-blue-500/10' : 'opacity-80'}`}
             >
                <div className="shrink-0">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${n.priority === 'URGENT' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}>
                      {n.priority === 'URGENT' ? <AlertTriangle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                   </div>
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-lg font-bold leading-none ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>
                         {n.title}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                         <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleString("ar-SA", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                   </div>
                   
                   <p className={`text-sm mt-3 leading-relaxed whitespace-pre-wrap ${!n.isRead ? 'text-gray-300' : 'text-gray-500'}`}>
                      {n.content}
                   </p>

                   <div className="mt-4 pt-4 border-t border-[#1F2937] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-gray-600 bg-black/20 px-2 py-0.5 rounded border border-[#1F2937] uppercase">
                            Sender: {n.sender?.username || "ADMIN"}
                         </span>
                         {n.priority === 'URGENT' && (
                           <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase animate-pulse">
                              Urgent Briefing
                           </span>
                         )}
                      </div>
                      
                      {!n.isRead ? (
                        <div className="flex items-center gap-1 text-blue-500 text-xs font-bold group-hover:translate-x-[-4px] transition-transform">
                           <BookOpen className="w-3.5 h-3.5" /> تمييز كمقروء
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                           <CheckCircle className="w-3.5 h-3.5" /> تمت القراءة
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
