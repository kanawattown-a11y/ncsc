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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Manage Branches */}
        <ConfigCard 
          title="الأفرع والجهات الطالبة" 
          description="تحديد قائمة الأفرع الأمنية المخولة بإصدار برقيات التعميم."
          items={config.BRANCHES}
          onSave={(items) => handleUpdate("BRANCHES", items)}
          isSaving={savingKey === "BRANCHES"}
        />

        {/* Manage Types */}
        <ConfigCard 
          title="تصنيف التعميمات" 
          description="تحديد مسميات أنواع القيود (مذكرة جلب، منع سفر، إلخ)."
          items={config.WARRANT_TYPES}
          onSave={(items) => handleUpdate("WARRANT_TYPES", items)}
          isSaving={savingKey === "WARRANT_TYPES"}
        />

        {/* Manage Severities */}
        <SeverityConfigCard 
          title="درجات الخطورة"
          description="تحديد مستويات الخطورة والألوان المصاحبة لها في التقارير."
          items={config.SEVERITIES}
          onSave={(items) => handleUpdate("SEVERITIES", items)}
          isSaving={savingKey === "SEVERITIES"}
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

function SeverityConfigCard({ title, description, items, onSave, isSaving }: { title: string, description: string, items: any[], onSave: (items: any[]) => void, isSaving: boolean }) {
  const [list, setList] = useState<any[]>(items || []);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const add = () => {
    if (!label.trim() || !value.trim()) return;
    setList([...list, { label: label.trim(), value: value.trim().toUpperCase(), color }]);
    setLabel("");
    setValue("");
  };

  const remove = (idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-8 flex flex-col h-full shadow-xl">
       <h2 className="text-xl font-black text-white mb-2">{title}</h2>
       <p className="text-gray-500 text-xs mb-8 leading-tight">{description}</p>
       
       <div className="space-y-3 mb-6">
          <input 
            className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-xs"
            placeholder="اسم الدرجة (مثلاً: عالية الخطورة)"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-[#0B0F19] text-white border border-[#1F2937] rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all text-xs font-mono"
              placeholder="الكود (HIGH)"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <input 
              type="color"
              className="w-12 h-10 bg-transparent border-none cursor-pointer"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
          <button 
            onClick={add}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-all active:scale-95 text-xs font-bold"
          >
            إضافة مستوى جديد
          </button>
       </div>

       <div className="flex-1 space-y-2 mb-8 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {list.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#111827] border border-[#1F2937] p-3 pl-2 rounded-xl group transition-all">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <p className="text-white text-xs font-bold">{item.label}</p>
                    <p className="text-[9px] text-gray-500 font-mono">{item.value}</p>
                  </div>
               </div>
               <button onClick={() => remove(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
          ))}
       </div>

       <button 
         onClick={() => onSave(list)}
         disabled={isSaving}
         className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-500/30 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
       >
         {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
         حفظ الإعدادات
       </button>
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
         حفظ الإعدادات
       </button>
    </div>
  );
}
