"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, User, FileEdit, ShieldCheck } from "lucide-react";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      } else {
        const error = await res.json();
        alert("خطأ: " + error.error);
      }
    } catch (err) {
      alert("حدث خطأ تقني أثناء معالجة الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">جاري تحميل الطلبات العالقة...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">مراجعة واعتماد طلبات التعديل</h1>
        <p className="text-gray-400 text-sm">قم بتدقيق التغييرات المقترحة من مدخلي البيانات قبل اعتمادها في السجل الوطني.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center text-gray-500">
           <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
           لا توجد طلبات تعديل معلقة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {requests.map((req) => {
            let proposed: any = {};
            try { proposed = JSON.parse(req.proposedChanges); } catch (e) { console.error("Parse error", e); }
            
            const current = req.currentData || {};
            
            return (
              <div key={req.id} className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-6">
                {/* Request Header */}
                <div className="bg-[#1F2937]/30 p-5 px-8 border-b border-[#1F2937] flex flex-col lg:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                       <User className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white font-black text-base tracking-tight">طلب من: {req.dataEntry?.username || "مدخل بيانات"}</p>
                      <p className="text-gray-500 text-[11px] font-mono uppercase tracking-widest">{new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleDecision(req.id, "REJECTED")}
                      className="flex-1 lg:flex-none bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
                    >
                      <XCircle className="w-4 h-4 inline-block mr-1" /> رفض الطلب
                    </button>
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleDecision(req.id, "APPROVED")}
                      className="flex-1 lg:flex-none bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-600/30 px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-1" /> اعتماد التعديلات
                    </button>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#1F2937]/50">
                    <FileEdit className="w-5 h-5 text-amber-500" />
                    <div>
                       <h3 className="text-white font-bold text-lg">مراجعة الفوارق لملف: {current.fullName || req.entityId}</h3>
                       <p className="text-[10px] text-gray-500 font-mono tracking-tighter">Entity ID: {req.entityId}</p>
                    </div>
                  </div>
                  
                  {/* Diff Table Style */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-[#0B0F19]/50 rounded-t-lg">
                       <div className="col-span-2">الحقل</div>
                       <div className="col-span-10 grid grid-cols-2 gap-8 px-4">
                          <span>البيانات الحالية (Current)</span>
                          <span>البيانات المقترحة (Proposed)</span>
                       </div>
                    </div>

                    <div className="divide-y divide-[#1F2937]">
                      {Object.entries(proposed).map(([key, newValue]: [string, any]) => {
                        // Map technical keys to Arabic labels
                        const labels: any = {
                          fullName: "الاسم الكامل",
                          motherName: "اسم الأم",
                          civilRecord: "القيد",
                          civilRegistry: "الأمانة",
                          nationalId: "الرقم الوطني",
                          dateOfBirth: "تاريخ الميلاد",
                          placeOfBirth: "مكان الميلاد",
                          gender: "الجنس",
                          address: "العنوان",
                          job: "المهنة",
                          maritalStatus: "الحالة الاجتماعية",
                          bloodType: "فصيلة الدم",
                          physicalMarks: "العلامات الفارقة",
                          photoUrl: "رابط الصورة الشخصية",
                          notes: "الوصف الأمني الحر",
                          records: "القيود والتعميمات"
                        };

                        if (key === "records") {
                          const recordsArray = newValue as any[];
                          return (
                            <div key={key} className="col-span-12 p-6 bg-blue-600/5 border-y border-blue-500/10 mt-4 rounded-xl">
                               <h4 className="text-blue-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                                 <ShieldCheck className="w-4 h-4" /> تفاصيل القيود والتعميمات المقترحة ({recordsArray.length})
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {recordsArray.map((rec: any, i: number) => (
                                   <div key={i} className={`border p-3 rounded-lg text-xs transition-all ${rec.active ? 'bg-[#0B0F19] border-blue-500/30' : 'bg-gray-900/50 border-gray-800 opacity-50'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                         <span className={`px-2 py-0.5 rounded text-[9px] font-black ${rec.active ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-500'}`}>
                                            {rec.active ? 'تفعيل/تحديث قيد' : 'أرشفة/إلغاء قيد'}
                                         </span>
                                         <span className="text-gray-500 font-mono text-[9px] uppercase">{rec.type} | {rec.severity}</span>
                                      </div>
                                      <p className="text-white font-medium mb-1">{rec.reason || "بدون وصف"}</p>
                                      {!rec.id && <p className="text-green-500 text-[8px] font-black tracking-tighter">+ قيد جديد مقترح (NEW RECORD)</p>}
                                   </div>
                                 ))}
                               </div>
                            </div>
                          );
                        }

                        const oldValue = current[key];
                        const isChanged = String(oldValue) !== String(newValue);

                        return (
                          <div key={key} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${isChanged ? 'bg-blue-600/5' : ''}`}>
                             <div className="col-span-2 text-xs font-black text-gray-400">
                                {labels[key] || key}
                             </div>
                             <div className="col-span-10 grid grid-cols-2 gap-8 px-4 font-mono text-sm items-center">
                                <div className="text-gray-500 line-through opacity-50 bg-red-950/10 p-2 rounded border border-red-900/10">
                                   {oldValue ? String(oldValue) : "—"}
                                </div>
                                <div className={`p-2 rounded border font-black ${isChanged ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-[#0B0F19] text-white border-[#1F2937]'}`}>
                                   {newValue ? String(newValue) : "—"}
                                   {isChanged && <span className="mr-2 text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded-full uppercase">MODIFIED</span>}
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
