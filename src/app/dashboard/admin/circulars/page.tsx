"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  Send, 
  Users, 
  User as UserIcon, 
  Shield, 
  History, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Trash2,
  Eye
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminCircularsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [circulars, setCirculars] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "NORMAL",
    targetType: "ROLE", // "ROLE" or "USER"
    targetRole: "ALL",  // "ALL", "DATA_ENTRY", "CHECKPOINT"
    targetUserId: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        fetch("/api/admin/users"), 
        fetch("/api/notifications/admin") // need an admin-specific list to see history
      ]);
      const uData = await uRes.json();
      const cData = await cRes.json();
      setUsers(uData);
      setCirculars(cData);
    } catch (err) {
      console.error("Data load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    setSending(true);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        targetRole: formData.targetType === "ROLE" ? (formData.targetRole === "ALL" ? null : formData.targetRole) : null,
        targetUserId: formData.targetType === "USER" ? formData.targetUserId : null
      };

      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("تم إرسال البرقية بنجاح.", "success");
        setFormData({ ...formData, title: "", content: "" });
        fetchData();
      } else {
        const d = await res.json();
        showToast(d.error || "فشل إرسال البرقية.", "error");
      }
    } catch (err) {
      showToast("خطأ في الاتصال بالشبكة.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#2563EB] border-b-4 rounded-xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
             <Send className="w-6 h-6 text-blue-500" /> مركز البرقيات والتعميمات (Broadcast Center)
          </h1>
          <p className="text-gray-400 text-sm">إرسال توجيهات أمنية فورية لكافة المستخدمين أو المجموعات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sending Form */}
        <div className="lg:col-span-5 bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl flex flex-col h-fit sticky top-20">
          <h2 className="text-lg font-bold text-white mb-6 border-b border-[#1F2937] pb-4 flex items-center gap-2">
             <Bell className="w-5 h-5 text-amber-500" /> إنشاء برقية برية/جوية جديدة
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-bold">العنوان (الموضوع)</label>
              <input 
                className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg p-3 text-sm focus:border-blue-500 outline-none" 
                placeholder="مثلاً: هام جداً - تحديث إجراءات التفتيش"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1 font-bold">الأولوية</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, priority: "NORMAL"})}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all ${formData.priority === "NORMAL" ? "bg-gray-800 border-gray-600 text-white" :  "bg-transparent border-[#1F2937] text-gray-600"}`}
                >
                  عادية (NORMAL)
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, priority: "URGENT"})}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all ${formData.priority === "URGENT" ? "bg-red-900/40 border-red-500 text-red-500" : "bg-transparent border-[#1F2937] text-gray-600"}`}
                >
                  عاجلة (URGENT)
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs text-gray-500 block mb-1 font-bold">تحديد المستهدفين</label>
              <div className="flex gap-2 mb-2">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, targetType: "ROLE"})}
                  className={`flex-1 p-2 rounded-lg text-xs font-bold border transition-all ${formData.targetType === "ROLE" ? "bg-blue-600 text-white border-blue-500" : "bg-transparent border-[#1F2937] text-gray-600"}`}
                >
                  حسب الدور (Role)
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, targetType: "USER"})}
                  className={`flex-1 p-2 rounded-lg text-xs font-bold border transition-all ${formData.targetType === "USER" ? "bg-blue-600 text-white border-blue-500" : "bg-transparent border-[#1F2937] text-gray-600"}`}
                >
                  مستخدم محدد
                </button>
              </div>

              {formData.targetType === "ROLE" ? (
                <select 
                  className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                  value={formData.targetRole}
                  onChange={e => setFormData({...formData, targetRole: e.target.value})}
                >
                   <option value="ALL">كافة المستخدمين (Broadcast)</option>
                   <option value="DATA_ENTRY">مدخلي البيانات فقط</option>
                   <option value="CHECKPOINT">عناصر الحواجز فقط</option>
                </select>
              ) : (
                <select 
                  className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                  value={formData.targetUserId}
                  onChange={e => setFormData({...formData, targetUserId: e.target.value})}
                  required
                >
                   <option value="">اختر المستخدم...</option>
                   {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                </select>
              )}
            </div>

            <div className="pt-2">
              <label className="text-xs text-gray-500 block mb-1 font-bold">محتوى البرقية</label>
              <textarea 
                rows={6}
                className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none" 
                placeholder="اكتب هنا تفاصيل التعليمات أو التعميم..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              إرسال وتعميم البرقية الآن
            </button>
          </form>
        </div>

        {/* Circulars History */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-bold text-gray-400 flex items-center gap-2 mb-4">
             <History className="w-5 h-5" /> سجل البرقيات والتعميمات الصادرة
          </h3>

          {loading ? (
            <div className="p-12 text-center text-gray-600 animate-pulse">جاري تحميل السجل...</div>
          ) : circulars.length === 0 ? (
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center text-gray-600 italic">
               لا يوجد أي برقيات صادرة بعد.
            </div>
          ) : (
            circulars.map((c) => (
              <div key={c.id} className={`bg-[#111827] border border-[#1F2937] rounded-xl p-5 shadow-lg border-r-4 ${c.priority === 'URGENT' ? 'border-r-red-600' : 'border-r-gray-600'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                     {c.priority === 'URGENT' && <span className="p-1.5 bg-red-600/10 rounded-full animate-pulse"><AlertTriangle className="w-4 h-4 text-red-600" /></span>}
                     <h4 className="font-bold text-white text-base">{c.title}</h4>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono italic">
                    {new Date(c.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                
                <p className="text-gray-400 text-xs mb-6 leading-relaxed line-clamp-3 bg-black/20 p-3 rounded-lg border border-[#1F2937]">
                   {c.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
                   <div className="flex gap-2">
                      <span className="text-[9px] bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded font-black uppercase">
                         Target: {c.targetRole || (c.targetUser?.username || "Individual")}
                      </span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                         <Eye className="w-3.5 h-3.5 text-gray-500" />
                         <span className="text-[10px] font-bold text-white">تمت القراءة: {c._count?.receipts || 0}</span>
                      </div>
                      <button className="text-red-500/50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
