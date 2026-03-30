"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, Save, Network, AlertCircle, Cpu, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: any) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) alert(`تم تحديث إعدادات (${key}) بنجاح.`);
    } catch (err) {
      alert("خطأ في الاتصال بالسيرفر.");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-blue-500 font-black flex items-center justify-center gap-4 animate-pulse"><Loader2 className="w-8 h-8 animate-spin" /> جاري تحميل مجمع الإعداد السيادي...</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-32 h-full bg-blue-500/5 -skew-x-12 transform translate-x-12"></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl">
               <Cpu className="w-10 h-10 text-blue-500" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-white tracking-widest uppercase">لوحة السيادة الإدارية</h1>
               <p className="text-gray-500 text-sm mt-1 uppercase font-mono tracking-widest">Global Administrative Sovereignty & Config</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Manage Branches */}
        <ConfigCard 
          title="إدارة الأفرع والجهات الطالبة" 
          description="تحديد قائمة الأفرع الأمنية المخولة بإصدار برقيات التعميم (سياسي، جنائية، إلخ)."
          items={config.BRANCHES}
          onSave={(items) => handleUpdate("BRANCHES", items)}
          isSaving={savingKey === "BRANCHES"}
        />

        {/* Manage Types */}
        <ConfigCard 
          title="تصنيف أنواع التعميمات" 
          description="تحديد مصطلحات التعميمات الرسمية (مذكرة جلب، منع سفر، مراقبة، إلخ)."
          items={config.WARRANT_TYPES}
          onSave={(items) => handleUpdate("WARRANT_TYPES", items)}
          isSaving={savingKey === "WARRANT_TYPES"}
        />
      </div>

      <div className="bg-[#111827] border border-[#1F2937] p-8 rounded-2xl">
         <h3 className="text-white font-bold mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" /> تنبيه السيادة الأمنية
         </h3>
         <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
            أي تعديل في هذه اللوحة سيغير القوائم المنسدلة فوراً لدى كافة "مدخلي البيانات" والموظفين الميدانيين. 
            يرجى عدم حذف التصنيفات القديمة إذا كانت مستخدمة في سجلات المواطنين الحالية لتجنب حدوث ارتباك في التقارير.
         </p>
      </div>
    </div>
  );
}

function ConfigCard({ title, description, items, onSave, isSaving }: { title: string, description: string, items: string[], onSave: (items: string[]) => void, isSaving: boolean }) {
  const [list, setList] = useState<string[]>(items || []);
  const [newValue, setNewValue] = useState("");

  const add = () => {
    if (!newValue.trim()) return;
    setList([...list, newValue.trim()]);
    setNewValue("");
  };

  const remove = (idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 flex flex-col h-full shadow-xl">
       <h2 className="text-xl font-black text-white mb-2">{title}</h2>
       <p className="text-gray-500 text-xs mb-8 leading-tight">{description}</p>
       
       <div className="flex gap-2 mb-6">
          <input 
            className="flex-1 bg-[#0B0F19] text-white border border-[#1F2937] rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all text-sm"
            placeholder="أدخل مسمى جديد..."
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button 
            onClick={add}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
       </div>

       <div className="flex-1 space-y-2 mb-8 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          {list.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#111827] border border-[#1F2937] p-3 pl-2 rounded-xl group hover:border-blue-500/50 transition-all">
               <span className="text-white text-sm font-bold">{item}</span>
               <button onClick={() => remove(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
          ))}
          {list.length === 0 && <div className="text-center py-8 text-gray-700 text-xs italic">لا توجد بنود مضافة حالياً.</div>}
       </div>

       <button 
         onClick={() => onSave(list)}
         disabled={isSaving}
         className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
       >
         {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
         حفظ التغييرات السيادية
       </button>
    </div>
  );
}
