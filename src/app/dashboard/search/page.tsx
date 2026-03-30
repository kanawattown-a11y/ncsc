"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldAlert, AlertTriangle, User as UserIcon, Activity, FileText, X, Eye, Files, Clipboard } from "lucide-react";
import SecurityStudyModal from "@/components/SecurityStudyModal";

const SEVERITY_MAP: Record<string, string> = { HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [configs, setConfigs] = useState<any>({ SEVERITIES: [] });

  useEffect(() => {
    fetch("/api/admin/config").then(res => res.json()).then(setConfigs).catch(console.error);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الاتصال بالشبكة الداخلية");
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "تعذر الاتصال بقاعدة البيانات.");
    } finally {
      setLoading(false);
    }
  };

  const parseRecordType = (type: string) => {
    const types: Record<string, string> = {
      CRIMINAL: "جنائية", POLITICAL: "سياسية", ECONOMIC: "اقتصادية",
      COURT: "محاكم", SECURITY: "أمنية", TRAVEL_BAN: "منع سفر",
      EXIT_BAN: "منع خروج", WANTED: "مطلوب"
    };
    return types[type] || "أخرى";
  };

  const handleDocumentOpen = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err: any) {
      alert("تعذر فتح المستند: " + err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Header */}
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#2563EB] border-b-4 rounded-xl p-4 sm:p-6 shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">منظومة الفيش والبحث الأمني</h1>
        <p className="text-gray-400 text-sm hidden sm:block">أدخل الرقم الوطني أو الاسم الكامل للتحقق من الموقف الجنائي وحالة المنع.</p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="رقم وطني أو الاسم..."
              className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg py-3 sm:py-4 pr-10 pl-4 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-base sm:text-lg font-mono"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
          <button
            type="submit"
            disabled={loading || !query}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3 sm:py-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:min-w-[140px]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><Search className="w-4 h-4" /> تنفيذ الفيش</>
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-xl p-5 flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-[#EF4444]">{errorMsg}</h3>
        </div>
      )}

      {/* Not Found */}
      {result?.status === "NOT_FOUND" && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
          <UserIcon className="w-14 h-14 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">السجل غير متوفر (مجهول)</h3>
          <p className="text-gray-400 mt-2 text-sm">لا توجد أي بيانات مرتبطة بهذا القيد.</p>
        </div>
      )}

      {/* Image Fullscreen */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl"></div>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-20">
            <X className="w-7 h-7" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="relative z-10 max-w-full max-h-full object-contain rounded-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* CLEARED Result */}
      {result?.status === "CLEARED" && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-4 sm:p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="absolute -left-8 text-[8rem] sm:text-[10rem] opacity-5 text-[#10B981] font-bold rotate-12 select-none pointer-events-none top-4">سليم</div>

          <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
            <div className="bg-[#10B981] p-3 sm:p-4 rounded-full shrink-0 animate-[pulse_3s_ease-in-out_infinite] self-start">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-white">
              <h2 className="text-xl sm:text-3xl font-bold text-[#10B981] mb-4">تصريح بالمرور (لا يوجد قيود)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-[#0B0F19]/40 p-4 rounded-lg border border-[#10B981]/20">
                <InfoRow label="الرقم الوطني" value={result.person.nationalId} mono />
                <InfoRow label="الاسم الكامل" value={result.person.fullName} />
                <InfoRow label="اسم الأم" value={result.person.motherName || "غير محدد"} />
                <div className="flex gap-3">
                  <InfoRow label="القيد" value={result.person.civilRecord || "—"} highlight />
                  <InfoRow label="الأمانة" value={result.person.civilRegistry || "—"} highlight />
                </div>
                <InfoRow label="تاريخ/مكان الولادة" value={`${result.person.dateOfBirth ? new Date(result.person.dateOfBirth).toLocaleDateString("ar-SA") : "—"} - ${result.person.placeOfBirth || "—"}`} />
                <InfoRow label="المهنة" value={result.person.job || "غير مدرج"} />
                {result.person.physicalMarks && <InfoRow label="العلامات الفارقة" value={result.person.physicalMarks} />}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowStudyModal(true)}
                  className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-95"
                >
                  <Files className="w-4 h-4" /> استخراج دراسة أمنية
                </button>
              </div>

              {/* Documents for Cleared */}
              {result.person.documents?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-[#10B981] font-bold flex items-center gap-2 border-b border-[#10B981]/30 pb-2 text-sm">
                    <FileText className="w-4 h-4" /> الوثائق والمرفقات ({result.person.documents.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {result.person.documents.map((doc: any, i: number) => {
                      const isImage = doc.type === "IMAGE" || /\.(jpg|jpeg|png|webp)$/i.test(doc.name);
                      return (
                        <button
                          key={i}
                          onClick={() => isImage ? setFullscreenImage(doc.viewUrl || `/api/documents/${doc.id}/view`) : handleDocumentOpen(doc.id)}
                          className={`bg-[#0B0F19]/60 hover:bg-[#10B981]/10 rounded-lg flex flex-col border border-[#10B981]/30 transition-all group overflow-hidden ${isImage ? 'cursor-zoom-in' : ''}`}
                        >
                          {isImage ? (
                            <div className="w-full h-20 sm:h-28 relative overflow-hidden bg-black/40">
                              <img src={doc.viewUrl || `/api/documents/${doc.id}/view`} alt={doc.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-20 sm:h-28 flex items-center justify-center bg-black/20">
                              <FileText className="w-8 h-8 text-[#10B981]" />
                            </div>
                          )}
                          <div className="p-2 w-full text-right">
                            <p className="font-bold text-xs text-white truncate">{doc.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BANNED Result */}
      {result?.status === "BANNED" && (
        <div className="bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-xl p-4 sm:p-6 shadow-[0_0_40px_rgba(239,68,68,0.2)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
            <div className="bg-[#EF4444] p-3 sm:p-4 rounded-full shrink-0 animate-bounce self-start">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <div className="flex-1 min-w-0 text-white">
              <h2 className="text-lg sm:text-2xl font-black text-[#EF4444] mb-4 flex items-center gap-2 flex-wrap">
                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                تحذير: مطلوب للأجهزة الأمنية
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 bg-[#0B0F19] p-4 rounded-lg border border-[#EF4444]/30">
                <InfoRow label="الرقم الوطني" value={result.person.nationalId} mono danger />
                <InfoRow label="الاسم الكامل" value={result.person.fullName} danger />
                <InfoRow label="اسم الأم" value={result.person.motherName || "غير محدد"} />
                <div className="flex gap-3 bg-red-500/10 p-2 rounded border border-red-500/20 col-span-full sm:col-span-1">
                  <InfoRow label="القيد" value={result.person.civilRecord || "—"} />
                  <InfoRow label="الأمانة" value={result.person.civilRegistry || "—"} />
                </div>
                <InfoRow label="تاريخ/مكان الولادة" value={`${result.person.dateOfBirth ? new Date(result.person.dateOfBirth).toLocaleDateString("ar-SA") : "—"} - ${result.person.placeOfBirth || "—"}`} />
                <InfoRow label="المهنة" value={result.person.job || "غير مدرج"} />
                {result.person.physicalMarks && <InfoRow label="العلامات الفارقة" value={result.person.physicalMarks} special />}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowStudyModal(true)}
                  className="flex items-center gap-2 bg-[#EF4444] hover:bg-white hover:text-[#EF4444] text-white px-5 py-3 rounded-xl font-black text-sm sm:text-base shadow-2xl shadow-[#EF4444]/40 transition-all active:scale-95 border-2 border-transparent hover:border-[#EF4444]"
                >
                  <Clipboard className="w-5 h-5" /> فتح الدراسة الأمنية الكاملة
                </button>
              </div>

              {/* Records */}
              <div className="mt-6 space-y-3">
                <h4 className="text-[#EF4444] font-bold text-base flex items-center gap-2 border-b border-[#EF4444]/30 pb-2">
                  <FileText className="w-4 h-4" /> السجل الجنائي والقيود ({result.records.length})
                </h4>
                <div className="space-y-3">
                  {result.records.map((rec: any, i: number) => (
                    <div key={i} className="bg-[#EF4444]/20 p-4 rounded-lg border border-[#EF4444]/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-[#EF4444]"></div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-[#EF4444] text-white px-2 py-0.5 rounded">
                              {rec.source === "EXTERNAL" ? "تعميم خارجي" : "قيد داخلي"}
                            </span>
                            <span className="text-[10px] font-bold bg-[#111827] border border-[#F59E0B] text-[#F59E0B] px-2 py-0.5 rounded flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {parseRecordType(rec.type)}
                            </span>
                            {rec.branch && (
                              <span className="text-[10px] font-bold bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded">
                                {rec.branch}
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-base sm:text-lg leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="flex items-center justify-center bg-[#0B0F19] px-3 py-2 rounded-lg border border-[#374151] shrink-0">
                          <div className="text-center">
                            <span className="text-[10px] text-gray-400 block">الخطورة</span>
                            <span 
                              className="font-black text-sm" 
                              style={{ color: configs.SEVERITIES?.find((s:any)=>s.value === rec.severity)?.color || '#9ca3af' }}
                            >
                              {configs.SEVERITIES?.find((s:any)=>s.value === rec.severity)?.label || rec.severity || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents for Banned */}
              {result.person.documents?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-[#F59E0B] font-bold text-sm flex items-center gap-2 border-b border-[#F59E0B]/30 pb-2">
                    المرفقات وأدلة الاتهام ({result.person.documents.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {result.person.documents.map((doc: any, i: number) => {
                      const isImage = doc.type === "IMAGE" || /\.(jpg|jpeg|png|webp)$/i.test(doc.name);
                      return (
                        <button
                          key={i}
                          onClick={() => isImage ? setFullscreenImage(doc.viewUrl || `/api/documents/${doc.id}/view`) : handleDocumentOpen(doc.id)}
                          className={`bg-[#0B0F19]/60 hover:bg-[#F59E0B]/20 rounded-lg flex flex-col border border-[#F59E0B]/30 transition-all group overflow-hidden ${isImage ? 'cursor-zoom-in' : ''}`}
                        >
                          {isImage ? (
                            <div className="w-full h-20 sm:h-28 relative overflow-hidden bg-black/40">
                              <img src={doc.viewUrl || `/api/documents/${doc.id}/view`} alt={doc.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-20 sm:h-28 flex items-center justify-center bg-black/20">
                              <FileText className="w-8 h-8 text-[#F59E0B]" />
                            </div>
                          )}
                          <div className="p-2 w-full text-right">
                            <p className="font-bold text-xs text-white truncate">{doc.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStudyModal && result?.person && (
        <SecurityStudyModal
          person={result.person}
          intelligence={result}
          onClose={() => setShowStudyModal(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value, mono = false, danger = false, highlight = false, special = false }: {
  label: string;
  value: string;
  mono?: boolean;
  danger?: boolean;
  highlight?: boolean;
  special?: boolean;
}) {
  return (
    <div>
      <span className="text-gray-400 block mb-0.5 text-xs font-bold">{label}:</span>
      <span className={`font-bold text-sm sm:text-base leading-tight break-words ${
        danger ? 'text-[#EF4444]' :
        highlight ? 'text-blue-400' :
        special ? 'text-amber-500' :
        'text-white'
      } ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
