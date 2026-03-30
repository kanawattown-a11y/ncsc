"use client";

import React from "react";
import { X, Shield, FileText, AlertTriangle, CheckCircle, Fingerprint, MapPin, User, Calendar, Printer, Download } from "lucide-react";

interface SecurityStudyModalProps {
  person: any;
  onClose: () => void;
}

export default function SecurityStudyModal({ person, onClose }: SecurityStudyModalProps) {
  const activeRecords = person.records?.filter((r: any) => r.active) || [];
  const hasCriminal = activeRecords.some((r: any) => r.type === "CRIMINAL");
  const hasSecurity = activeRecords.some((r: any) => r.type === "SECURITY" || r.type === "WANTED");
  const isWanted = hasCriminal || hasSecurity;

  // Decision Logic
  const getDecision = () => {
    if (hasSecurity) return { label: "توقيف فوري واحالة للفرع المختص", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500", icon: <AlertTriangle className="w-6 h-6" /> };
    if (hasCriminal) return { label: "تدقيق قضائي (جلب / محاكمة)", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500", icon: <AlertTriangle className="w-6 h-6" /> };
    if (activeRecords.length > 0) return { label: "مراقبة وتدقيق الموقف", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500", icon: <FileText className="w-6 h-6" /> };
    return { label: "سليم - يسمح له بالمرور والعمل", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500", icon: <CheckCircle className="w-6 h-6" /> };
  };

  const decision = getDecision();

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex justify-center items-center p-4">
      <div className="bg-[#0B0F19] border-2 border-[#1F2937] rounded-none w-full max-w-3xl shadow-[0_0_100px_rgba(37,99,235,0.2)] relative flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Official Header */}
        <div className="p-8 border-b-2 border-[#1F2937] flex justify-between items-start bg-gradient-to-b from-[#111827] to-transparent">
          <div className="flex gap-6 items-center">
             <div className="w-24 h-24 bg-white/5 border border-white/10 rounded flex items-center justify-center p-2">
                <Shield className="w-16 h-16 text-blue-500 opacity-50" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white tracking-widest uppercase">المركز الوطني للمعلومات الأمنية</h1>
                <p className="text-blue-500 font-mono text-xs mt-1 font-bold tracking-[0.3em]">National Center for Security Information</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/30 text-blue-400 text-[10px] font-bold tracking-widest rounded-full">
                   SECURITY STUDY REPORT ID: #NCSC-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 font-sans text-right custom-scrollbar">
           
           {/* Section 1: Subject Identity */}
           <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-r-4 border-blue-600 pr-3">أولاً: بيانات الذاتية والمطابقة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 grid grid-cols-2 gap-y-6 gap-x-12">
                   <StudyItem label="الاسم الرباعي" value={person.fullName} />
                   <StudyItem label="الرقم الوطني" value={person.nationalId} />
                   <StudyItem label="اسم الأم" value={person.motherName || "غير مدرج"} />
                   <StudyItem label="تاريخ الميلاد" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString("ar-SA") : "غير مدرج"} />
                   <StudyItem label="مكان السكن" value={person.address || "غير مدرج"} />
                   <StudyItem label="المهنة المسجلة" value={person.job || "عمل حر / غير مدرج"} />
                </div>
                <div className="bg-[#111827] border border-[#1F2937] p-2 rounded-lg aspect-[3/4] flex items-center justify-center relative overflow-hidden group">
                   {person.photoUrl ? (
                      <img src={person.photoUrl} alt="Subject" className="w-full h-full object-cover" />
                   ) : (
                      <User className="w-20 h-20 text-gray-800" />
                   )}
                   <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-white opacity-40">PORTRAIT_ID_01</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-8 border-y border-[#1F2937] py-6">
                 <StudyItem label="أمانة السجل المدني" value={person.civilRegistry || "غير معلومة"} highlight />
                 <StudyItem label="القيد المدني" value={person.civilRecord || "غير معلوم"} highlight />
              </div>
           </div>

           {/* Section 2: Criminal & Security Background */}
           <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-r-4 border-blue-600 pr-3">ثانياً: الموقف الأمني والقيود الجنائية</h3>
              
              {activeRecords.length > 0 ? (
                <div className="space-y-4">
                   {activeRecords.map((rec: any, i: number) => (
                      <div key={i} className="bg-[#111827] border border-[#1F2937] border-r-4 border-r-red-500/50 p-6 rounded relative">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-red-500 bg-red-500/10 px-3 py-1 rounded">قيد فعال - بموجب برقية رسمية</span>
                            <span className="text-[10px] font-mono text-gray-500">{new Date(rec.createdAt).toLocaleString("ar-SA")}</span>
                         </div>
                         <p className="text-white text-lg font-bold leading-relaxed">{rec.reason}</p>
                         <div className="mt-4 flex flex-wrap gap-4">
                            <div className="bg-[#0B0F19] px-3 py-1.5 border border-[#1F2937] rounded text-[10px] font-bold text-gray-400">التصنيف: {rec.type}</div>
                            {rec.branch && <div className="bg-[#0B0F19] px-3 py-1.5 border border-blue-500/30 rounded text-[10px] font-bold text-blue-400">الجهة الطالبة: {rec.branch}</div>}
                            <div className="bg-[#0B0F19] px-3 py-1.5 border border-[#1F2937] rounded text-[10px] font-bold text-gray-400">الجانب: {rec.source}</div>
                            <div className={`bg-[#0B0F19] px-3 py-1.5 border border-[#1F2937] rounded text-[10px] font-bold ${rec.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>الخطورة: {rec.severity}</div>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-xl text-center">
                   <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-green-500" />
                   </div>
                   <h4 className="text-green-500 font-black text-xl mb-2 tracking-tighter">السجل الأمني نظيف بالكامل</h4>
                   <p className="text-gray-500 text-sm">لم يتم العثور على أي برقيات أو بلاغات جلب أو تعميمات في قاعدة البيانات المركزية.</p>
                </div>
              )}
           </div>

           {/* Section 3: Strategic Assessment */}
           {person.notes && (
              <div className="mb-10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-r-4 border-blue-600 pr-3">ثالثاً: الملاحظات الاستخباراتية والوصف الحر</h3>
                <p className="bg-[#111827] p-6 rounded-lg border border-[#1F2937] text-white leading-relaxed whitespace-pre-wrap italic">
                   "{person.notes}"
                </p>
              </div>
           )}

           {/* Final Decision Panel */}
           <div className={`mt-12 p-8 border-2 ${decision.border} ${decision.bg} relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-32 h-full bg-current opacity-5 -rotate-12 transform -translate-x-12"></div>
              <div className="flex items-center gap-6 relative z-10">
                 <div className={`${decision.color} p-4 bg-[#0B0F19] border ${decision.border} rounded-2xl shadow-xl`}>
                    {decision.icon}
                 </div>
                 <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-2 opacity-60">التوصية الأمنية النهائية (رأي الفرع)</h2>
                    <p className={`text-3xl font-black ${decision.color} tracking-tighter leading-tight`}>{decision.label}</p>
                 </div>
              </div>
           </div>

           <div className="mt-12 pt-8 border-t border-[#1F2937] flex justify-between items-center opacity-30">
              <div className="flex gap-8">
                 <div className="w-16 h-16 bg-white flex items-center justify-center p-1 rounded opacity-60">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=NCSC-STUDY-REPORT-AUTH" alt="QR" className="grayscale" />
                 </div>
                 <div className="text-[8px] font-mono leading-tight">
                    <p>DIGITAL SIGNATURE SECURED</p>
                    <p>TIMESTAMP: {new Date().toISOString()}</p>
                    <p>OFFICER_ID: SYSTEM_AUTO_ENGINE</p>
                 </div>
              </div>
              <p className="text-[10px] font-bold">NCSC CENTRAL INTELLIGENCE NODE 7</p>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-[#111827] border-t-2 border-[#1F2937] flex justify-between items-center group">
           <p className="text-[10px] text-gray-500 font-mono tracking-widest">CONFIDENTIAL // TOP SECRET // FOR OFFICIAL USE ONLY</p>
           <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Printer className="w-4 h-4" /> طباعة التقرير
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                <Download className="w-4 h-4" /> حفظ كـ PDF
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

function StudyItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{label}</p>
      <p className={`text-lg font-bold leading-tight ${highlight ? 'text-white' : 'text-gray-300'}`}>{value}</p>
    </div>
  );
}
