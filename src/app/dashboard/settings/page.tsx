"use client";

import { useState } from "react";
import { Key, User, ShieldCheck, Save, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState({
    username: (session?.user as any)?.username || "",
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setStatus("error");
      setMessage("كلمات المرور غير متطابقة.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus("success");
      setMessage("تم تحديث إعدادات الحساب بنجاح.");
      setFormData({ ...formData, password: "", confirmPassword: "" });
      // Update session locally if username changed
      await update({ username: formData.username });
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">إعدادات الحساب والأمان</h1>
        <p className="text-gray-400 text-sm italic font-sans uppercase">تعديل بيانات الوصول وتأمين حسابك الشخصي.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-xl">
           <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2 mb-6 border-b border-[#1F2937] pb-4">
                 <User className="w-5 h-5 text-[#2563EB]" /> البيانات الأساسية
              </h3>

              <div>
                <label className="text-sm text-gray-400 block mb-2">اسم المستخدم الرسمي</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={e => setFormData(p => ({...p, username: e.target.value}))}
                    className="w-full bg-[#0B0F19] text-white border border-[#1F2937] pl-10 pr-4 py-3 rounded-lg focus:border-[#2563EB] outline-none font-mono" 
                  />
                </div>
              </div>

              <h3 className="text-white font-bold flex items-center gap-2 mt-10 mb-6 border-b border-[#1F2937] pb-4">
                 <Key className="w-5 h-5 text-[#F59E0B]" /> تغيير كلمة المرور
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">كلمة المرور الجديدة</label>
                  <input 
                    type="password" 
                    placeholder="تحتاج لتغييرها؟ اتركها فارغة للحفاظ على الحالية"
                    value={formData.password}
                    onChange={e => setFormData(p => ({...p, password: e.target.value}))}
                    className="w-full bg-[#0B0F19] text-white border border-[#1F2937] p-3 rounded-lg focus:border-[#F59E0B] outline-none" 
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">تأكيد كلمة المرور</label>
                  <input 
                    type="password" 
                    placeholder="أعد الكتابة للتأكيد"
                    value={formData.confirmPassword}
                    onChange={e => setFormData(p => ({...p, confirmPassword: e.target.value}))}
                    className="w-full bg-[#0B0F19] text-white border border-[#1F2937] p-3 rounded-lg focus:border-[#F59E0B] outline-none" 
                  />
                </div>
              </div>
           </div>

           {status === "success" && (
             <div className="mt-8 bg-green-900/20 border border-green-500/30 text-green-400 p-4 rounded-lg flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" /> {message}
             </div>
           )}
           {status === "error" && (
             <div className="mt-8 bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" /> {message}
             </div>
           )}

           <div className="mt-8 pt-6 border-t border-[#1F2937] flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                {isSubmitting ? "جاري الحفظ..." : <><Save className="w-4 h-4" /> حفظ الإعدادت الأمنية الحيوية</>}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
}
