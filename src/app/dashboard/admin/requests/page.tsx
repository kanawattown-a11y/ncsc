"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, User, FileEdit, ShieldCheck } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
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
  photoUrl: "رابط الصورة",
  notes: "الوصف الأمني",
  records: "القيود والتعميمات"
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

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
    } catch {
      alert("حدث خطأ تقني أثناء معالجة الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-3">
      <Clock className="w-8 h-8 animate-spin opacity-40" />
      جاري تحميل الطلبات العالقة...
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 sm:p-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">مراجعة واعتماد طلبات التعديل</h1>
        <p className="text-gray-400 text-sm hidden sm:block">قم بتدقيق التغييرات المقترحة من مدخلي البيانات قبل اعتمادها في السجل الوطني.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-10 text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
          لا توجد طلبات تعديل معلقة حالياً.
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-8">
          {requests.map((req) => {
            let proposed: any = {};
            try { proposed = JSON.parse(req.proposedChanges); } catch { }
            const current = req.currentData || {};

            return (
              <div key={req.id} className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-2xl">
                {/* Request Header */}
                <div className="bg-[#1F2937]/30 p-4 sm:p-6 border-b border-[#1F2937]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm tracking-tight">طلب من: {req.dataEntry?.username || "مدخل بيانات"}</p>
                        <p className="text-gray-500 text-[11px] font-mono">{new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        disabled={!!processingId}
                        onClick={() => handleDecision(req.id, "REJECTED")}
                        className="flex-1 sm:flex-none bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> رفض
                      </button>
                      <button
                        disabled={!!processingId}
                        onClick={() => handleDecision(req.id, "APPROVED")}
                        className="flex-1 sm:flex-none bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-600/30 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" /> اعتماد
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                    <FileEdit className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>ملف: <span className="text-white font-bold">{current.fullName || req.entityId}</span></span>
                  </div>
                </div>

                {/* Diff Content */}
                <div className="p-4 sm:p-6">
                  <div className="space-y-2">
                    {/* Header row - desktop only */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-[#0B0F19]/50 rounded-lg">
                      <div className="col-span-2">الحقل</div>
                      <div className="col-span-10 grid grid-cols-2 gap-6 px-2">
                        <span>الحالي</span>
                        <span>المقترح</span>
                      </div>
                    </div>

                    <div className="divide-y divide-[#1F2937]/50">
                      {Object.entries(proposed).map(([key, newValue]: [string, any]) => {
                        if (key === "records") {
                          const recordsArray = newValue as any[];
                          return (
                            <div key={key} className="py-4 bg-blue-600/5 rounded-xl mt-2 px-3">
                              <h4 className="text-blue-400 text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> القيود والتعميمات ({recordsArray.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {recordsArray.map((rec: any, i: number) => (
                                  <div key={i} className={`border p-3 rounded-lg text-xs ${rec.active ? 'bg-[#0B0F19] border-blue-500/30' : 'bg-gray-900/50 border-gray-800 opacity-50'}`}>
                                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${rec.active ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-500'}`}>
                                        {rec.active ? 'تفعيل/تحديث' : 'إلغاء'}
                                      </span>
                                      <span className="text-gray-500 font-mono text-[9px]">{rec.type} | {rec.severity}</span>
                                    </div>
                                    <p className="text-white font-medium">{rec.reason || "بدون وصف"}</p>
                                    {!rec.id && <p className="text-green-500 text-[8px] font-black mt-1">+ قيد جديد مقترح</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        const oldValue = current[key];
                        const isChanged = String(oldValue) !== String(newValue);

                        return (
                          <div key={key} className={`py-2.5 ${isChanged ? 'bg-blue-600/5' : ''}`}>
                            {/* Mobile layout: stacked */}
                            <div className="sm:hidden px-2">
                              <p className="text-[10px] font-black text-gray-500 uppercase mb-1">{FIELD_LABELS[key] || key}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs text-gray-500 line-through bg-red-950/10 p-2 rounded border border-red-900/10 break-words">
                                  {oldValue ? String(oldValue) : "—"}
                                </div>
                                <div className={`text-xs p-2 rounded border break-words ${isChanged ? 'bg-green-600/20 text-green-400 border-green-500/30 font-bold' : 'bg-[#0B0F19] text-white border-[#1F2937]'}`}>
                                  {newValue ? String(newValue) : "—"}
                                  {isChanged && <span className="block text-[8px] bg-green-500 text-black px-1 py-0.5 rounded mt-1 w-fit">MODIFIED</span>}
                                </div>
                              </div>
                            </div>
                            {/* Desktop layout: table-like */}
                            <div className={`hidden sm:grid grid-cols-12 gap-4 px-3 items-center`}>
                              <div className="col-span-2 text-xs font-black text-gray-400">{FIELD_LABELS[key] || key}</div>
                              <div className="col-span-10 grid grid-cols-2 gap-6 px-2 font-mono text-sm">
                                <div className="text-gray-500 line-through opacity-50 bg-red-950/10 p-2 rounded border border-red-900/10 break-words">
                                  {oldValue ? String(oldValue) : "—"}
                                </div>
                                <div className={`p-2 rounded border font-black break-words ${isChanged ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-[#0B0F19] text-white border-[#1F2937]'}`}>
                                  {newValue ? String(newValue) : "—"}
                                  {isChanged && <span className="mr-2 text-[9px] bg-green-500 text-black px-1.5 py-0.5 rounded-full">MODIFIED</span>}
                                </div>
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
