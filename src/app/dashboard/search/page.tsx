"use client";

import { useState } from "react";
import { Search, ShieldCheck, ShieldAlert, AlertTriangle, User as UserIcon, Building, Activity, FileText } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "خطأ في الاتصال بالشبكة الداخلية");
      }
      
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "تعذر الاتصال بقاعدة البيانات. (لم يتم ربطها بعد)");
    } finally {
      setLoading(false);
    }
  };

  const parseRecordType = (type: string) => {
    switch (type) {
      case "CRIMINAL": return "جنائية";
      case "POLITICAL": return "سياسية";
      case "ECONOMIC": return "اقتصادية";
      case "COURT": return "محاكم (قضائية)";
      case "SECURITY": return "أمنية";
      case "TRAVEL_BAN": return "منع سفر";
      case "EXIT_BAN": return "منع خروج";
      case "WANTED": return "مطلوب للتحقيق";
      default: return "أخرى";
    }
  };

  const handleDocumentOpen = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Open the secure presigned URL in a new tab
      window.open(data.url, "_blank");
    } catch (err: any) {
      alert("تعذر فتح المستند المشفر: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#2563EB] border-b-4 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">منظومة الفيش والبحث الأمني الشامل</h1>
        <p className="text-gray-400 text-sm">أدخل الرقم الوطني أو الاسم الكامل للتحقق من الموقف الجنائي وحالة المنع.</p>
        
        <form onSubmit={handleSearch} className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: 123456789 أو الاسم الثلاثي"
              className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded-lg py-4 pr-12 pl-4 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-lg font-mono tracking-wider"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
          </div>
          <button
            type="submit"
            disabled={loading || !query}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-8 py-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
          >
            {loading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : "تنفيذ الفيش"}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <AlertTriangle className="w-16 h-16 text-[#EF4444] mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-[#EF4444]">{errorMsg}</h3>
        </div>
      )}

      {result && result.status === "NOT_FOUND" && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
          <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">السجل غير متوفر (مجهول)</h3>
          <p className="text-gray-400 mt-2">يرجى التأكد من الرقم الوطني للمبحوث عنه والمحاولة مرة أخرى. لا توجد أي بيانات مرتبطة بهذا القيد.</p>
        </div>
      )}

      {result && result.status === "CLEARED" && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden text-white">
          <div className="absolute -left-10 text-[10rem] opacity-5 text-[#10B981] font-bold rotate-12 select-none pointer-events-none">سليم</div>
          <div className="flex flex-col md:flex-row items-start space-x-0 md:space-x-reverse md:space-x-6 relative z-10 w-full">
            <div className="bg-[#10B981] p-4 rounded-full min-w-[4rem] flex justify-center flex-shrink-0 animate-[pulse_3s_ease-in-out_infinite]">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 w-full">
              <h2 className="text-3xl font-bold text-[#10B981] mb-4">تصريح بالمرور (لايوجد قيود أمنية)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#0B0F19]/40 p-6 rounded-lg border border-[#10B981]/20">
                <div><span className="text-gray-400 block mb-1">الرقم الوطني:</span><span className="font-bold text-xl font-mono">{result.person.nationalId}</span></div>
                <div><span className="text-gray-400 block mb-1">الاسم الكامل:</span><span className="font-bold text-xl">{result.person.fullName}</span></div>
                <div><span className="text-gray-400 block mb-1">اسم الأم:</span><span className="font-bold text-xl">{result.person.motherName || "غير محدد"}</span></div>
                
                <div><span className="text-gray-400 block mb-1">سنة ومكان الولادة:</span><span>{result.person.dateOfBirth ? new Date(result.person.dateOfBirth).toLocaleDateString("ar-SA") : "غير مدرج"} - {result.person.placeOfBirth || "غير مدرج"}</span></div>
                <div><span className="text-gray-400 block mb-1">العمل/المهنة:</span><span>{result.person.job || "غير مدرج"}</span></div>
                <div><span className="text-gray-400 block mb-1">العلامات الفارقة:</span><span>{result.person.physicalMarks || "لا يوجد"}</span></div>
              </div>

              {/* Documents Section for Cleared */}
              {result.person.documents && result.person.documents.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-[#10B981] font-bold text-xl flex items-center gap-2 border-b border-[#10B981]/30 pb-3">
                    <FileText className="w-6 h-6" /> المرفقات والوثائق الأمنية (PDF، صور، الخ):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.person.documents.map((doc: any, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => handleDocumentOpen(doc.id)} 
                        className="bg-[#0B0F19]/60 hover:bg-[#10B981]/20 p-4 rounded-lg flex items-center gap-3 border border-[#10B981]/30 transition-colors text-right"
                      >
                        <FileText className="w-8 h-8 text-[#10B981]" />
                        <div>
                          <p className="font-bold text-sm text-white">{doc.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{doc.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {result && result.status === "BANNED" && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444] rounded-xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.2)] relative overflow-hidden animate-[pulse_2s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNlZjQ0NDQiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] pointer-events-none mix-blend-overlay"></div>
          
          <div className="flex flex-col md:flex-row items-start space-x-0 md:space-x-reverse md:space-x-6 relative z-10 w-full">
            <div className="bg-[#EF4444] p-4 rounded-full flex-shrink-0 animate-bounce">
              <ShieldAlert className="w-12 h-12 text-white" />
            </div>
            
            <div className="w-full text-white">
              <h2 className="text-3xl font-black text-[#EF4444] mb-4 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                تحذير: مطلوب للأجهزة الأمنية والرقابية
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#0B0F19] p-6 rounded-lg border border-[#EF4444]/30 shadow-inner">
                <div><span className="text-[#EF4444]/70 block mb-1 text-sm font-bold">الرقم الوطني:</span><span className="font-bold text-2xl font-mono text-[#EF4444]">{result.person.nationalId}</span></div>
                <div><span className="text-[#EF4444]/70 block mb-1 text-sm font-bold">الاسم الكامل:</span><span className="font-bold text-2xl text-[#EF4444]">{result.person.fullName}</span></div>
                <div><span className="text-gray-400 block mb-1 text-sm font-bold">اسم الأم:</span><span className="font-bold text-xl">{result.person.motherName || "غير محدد"}</span></div>
                
                <div><span className="text-gray-400 block mb-1 text-sm font-bold">سنة ومكان الولادة:</span><span className="font-medium">{result.person.dateOfBirth ? new Date(result.person.dateOfBirth).toLocaleDateString("ar-SA") : "غير مدرج"} - {result.person.placeOfBirth || "غير مدرج"}</span></div>
                <div><span className="text-gray-400 block mb-1 text-sm font-bold">المهنة:</span><span className="font-medium">{result.person.job || "غير مدرج"}</span></div>
                <div><span className="text-gray-400 block mb-1 text-sm font-bold">العلامات الفارقة:</span><span className="font-medium text-amber-500">{result.person.physicalMarks || "لا يوجد"}</span></div>
              </div>
              
              <div className="mt-8 space-y-4">
                <h4 className="text-[#EF4444] font-bold text-xl flex items-center gap-2 border-b border-[#EF4444]/30 pb-3">
                  <FileText className="w-6 h-6" /> السجل الجنائي والقيود:
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {result.records.map((rec: any, i: number) => (
                    <div key={i} className="bg-[#EF4444]/20 p-5 rounded-lg border border-[#EF4444]/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-[#EF4444]"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 items-center mb-3">
                            <span className="text-xs font-bold bg-[#EF4444] text-white px-3 py-1 rounded shadow-md">
                              {rec.source === "EXTERNAL" ? "تعميم خارجي" : "قيد داخلي"}
                            </span>
                            <span className="text-xs font-bold bg-[#111827] border border-[#F59E0B] text-[#F59E0B] px-3 py-1 rounded shadow-md flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              تصنيف: {parseRecordType(rec.type)}
                            </span>
                          </div>
                          <p className="font-bold text-xl leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-[#0B0F19] p-3 rounded-lg border border-[#374151]">
                          <span className="text-xs text-gray-400 mb-1">الدرجة</span>
                          <span className={`font-black tracking-wider ${rec.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>
                            {rec.severity || "غير مصنف"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents Section for Banned */}
              {result.person.documents && result.person.documents.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="text-[#F59E0B] font-bold text-xl flex items-center gap-2 border-b border-[#F59E0B]/30 pb-3">
                     المرفقات وأدلة الاتهام (وثائق للمراجعة):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.person.documents.map((doc: any, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => handleDocumentOpen(doc.id)} 
                        className="bg-[#0B0F19]/60 hover:bg-[#F59E0B]/20 p-4 rounded-lg flex items-center gap-3 border border-[#F59E0B]/30 transition-colors text-right shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <FileText className="w-8 h-8 text-[#F59E0B]" />
                        <div>
                          <p className="font-bold text-sm text-white">{doc.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{doc.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
