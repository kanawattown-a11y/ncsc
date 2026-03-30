"use client";

import React, { useRef, useState } from "react";
import { X, Shield, FileText, AlertTriangle, CheckCircle, MapPin, User, Calendar, Printer, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

const GENDER_MAP: Record<string, string> = { MALE: "ذكر", FEMALE: "أنثى" };
const MARITAL_MAP: Record<string, string> = { SINGLE: "أعزب", MARRIED: "متزوج", DIVORCED: "مطلق", WIDOWED: "أرمل" };

interface SecurityStudyModalProps {
  person: any;
  onClose: () => void;
  // New: Optional intelligence report fields passed from search API
  intelligence?: {
    status: "BANNED" | "CLEARED" | "SUSPICIOUS";
    riskLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE";
    priority: "NORMAL" | "URGENT";
    reasonSummary?: string | null;
  }
}

export default function SecurityStudyModal({ person, onClose, intelligence }: SecurityStudyModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const activeRecords = person.records?.filter((r: any) => r.active && !r.deletedAt) || [];
  
  // Decision Logic (Synchronized with intelligence.ts)
  // If intelligence is passed, use it. Otherwise, fallback to local (for safety)
  const status = intelligence?.status || (activeRecords.length > 0 ? "BANNED" : "CLEARED");
  const risk = intelligence?.riskLevel || "NONE";

  const getDecisionUI = () => {
    if (status === "BANNED") {
      if (risk === "HIGH") {
        return { 
          label: "توقيف فوري واحالة للفرع المختص", 
          color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500", 
          icon: <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" /> 
        };
      }
      return { 
        label: "تدقيق أمني / مراجعة السجل الجنائي", 
        color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500", 
        icon: <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" /> 
      };
    }
    return { 
      label: "سليم - يسمح له بالمرور والعمل", 
      color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500", 
      icon: <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" /> 
    };
  };

  const ui = getDecisionUI();

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    try {
      setIsCapturing(true);
      
      // 1. Force the image into a Base64 string to bypass ALL CORS/Tainting issues
      if (person.photoUrl) {
        try {
          const proxiedUrl = `/api/proxy/image?url=${encodeURIComponent(person.photoUrl)}`;
          const response = await fetch(proxiedUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
          reader.readAsDataURL(blob);
          const base64Data = await base64Promise;

          const img = reportRef.current.querySelector('img[alt="Subject"]') as HTMLImageElement;
          if (img) {
            img.src = base64Data;
            // Wait for image load to be 100% sure
            await new Promise(r => { img.onload = r; if (img.complete) r(null); });
          }
        } catch (e) {
          console.error("Failed to base64 image for clean capture", e);
        }
      }

      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        backgroundColor: "#0B0F19",
        scale: 4, 
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `NCSC_Report_${person.nationalId}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Capture failed:", err);
      alert("عذراً، فشل التقاط الصورة بسبب قيود في المتصفح أو السيرفر. جرب إعادة تحميل الصفحة.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[70] flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-[#0B0F19] border-t-2 sm:border-2 border-[#1F2937] rounded-t-2xl sm:rounded-none w-full sm:max-w-3xl shadow-[0_0_100px_rgba(37,99,235,0.2)] relative flex flex-col max-h-[95dvh] sm:max-h-[95vh] overflow-hidden">
        
        <div 
          ref={reportRef} 
          dir="rtl"
          className="flex flex-col bg-[#0B0F19] overflow-y-auto text-right report-content"
          style={{ 
            fontFamily: "'Cairo', 'Segoe UI', sans-serif",
            letterSpacing: '0', 
            textRendering: 'optimizeLegibility'
          }}
        >
          {/* Detailed CSS overrides to force html2canvas to join Arabic letters */}
          <style dangerouslySetInnerHTML={{ __html: `
            .report-content, .report-content * { 
              letter-spacing: 0px !important; 
              word-spacing: normal !important;
              font-feature-settings: 'liga' on, 'kern' on !important;
              font-variant-ligatures: common-ligatures !important;
              -webkit-font-smoothing: antialiased;
              text-shadow: none !important;
            }
          `}} />
          
          {/* Official Header */}
          <div className="p-4 sm:p-8 border-b-2 border-[#1F2937] flex flex-row-reverse justify-between items-start bg-gradient-to-b from-[#111827] to-transparent shrink-0">
            <div className="flex flex-row-reverse gap-3 sm:gap-6 items-center min-w-0">
               <div className="w-12 h-12 sm:w-24 sm:h-24 bg-white/5 border border-white/10 rounded flex items-center justify-center p-1 sm:p-2 shrink-0">
                  <Shield className="w-8 h-8 sm:w-16 sm:h-16 text-blue-500 opacity-50" />
               </div>
               <div className="text-right">
                  <h1 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase leading-tight">المركز الوطني للمعلومات الأمنية المركزية
                  </h1>
                  <p className="text-blue-500 font-mono text-[9px] sm:text-xs mt-0.5 sm:mt-1 font-bold tracking-widest">NCSC // OFFICIAL SECURITY DOSSIER</p>
                  <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 bg-blue-600/10 border border-blue-600/30 text-blue-400 text-[9px] font-bold rounded-full">
                     ID: {person.id.substring(0,8).toUpperCase()}
                  </div>
               </div>
            </div>
            {!isCapturing && (
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white shrink-0">
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          <div className="flex-1 p-4 sm:p-8 font-sans text-right custom-scrollbar">
             
             {/* Section 1: Subject Identity */}
             <div className="mb-6 sm:mb-10">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-r-4 border-blue-600 pr-3">أولاً: بيانات الذاتية والمطابقة</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <div className="sm:col-span-2 grid grid-cols-2 gap-y-4 gap-x-4 sm:gap-y-6 sm:gap-x-12">
                     <StudyItem label="الاسم الرباعي" value={person.fullName} />
                     <StudyItem label="الرقم الوطني" value={person.nationalId} />
                     <StudyItem label="اسم الأم" value={person.motherName || "—"} />
                     <StudyItem label="تاريخ الميلاد" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString("ar-SA") : "—"} />
                     <StudyItem label="الجنس" value={GENDER_MAP[person.gender] || person.gender || "—"} />
                     <StudyItem label="الحالة الاجتماعية" value={MARITAL_MAP[person.maritalStatus] || person.maritalStatus || "—"} />
                     <StudyItem label="أمانة السجل" value={person.civilRegistry || "—"} />
                     <StudyItem label="القيد" value={person.civilRecord || "—"} />
                  </div>
                  <div className="bg-[#111827] border border-[#1F2937] p-2 rounded-lg sm:aspect-[3/4] flex items-center justify-center relative overflow-hidden h-32 sm:h-auto">
                     {person.photoUrl ? (
                        <img src={person.photoUrl} alt="Subject" className="w-full h-full object-cover" crossOrigin="anonymous" />
                     ) : (
                        <User className="w-16 h-16 text-gray-800" />
                     )}
                     <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-mono text-white opacity-40 uppercase">Authentic</div>
                  </div>
                </div>
             </div>

             {/* Section 2: Security Intelligence */}
             <div className="mb-10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-r-4 border-blue-600 pr-3">ثانياً: السجل الجنائي والأمني (الفعال والناعم)</h3>
                
                {activeRecords.length > 0 ? (
                  <div className="space-y-4">
                     {activeRecords.map((rec: any, i: number) => (
                        <div key={i} className="bg-[#111827] border border-[#1F2937] border-r-4 border-r-red-500/50 p-6 rounded relative text-right">
                           <div className="flex justify-between items-start mb-2 rtl">
                              <span className="text-xs font-black text-red-500 bg-red-500/10 px-3 py-1 rounded">قيد فعال - بموجب تعميم رسمي</span>
                              <span className="text-[10px] font-mono text-gray-500">{new Date(rec.createdAt).toLocaleDateString("ar-SA")}</span>
                           </div>
                           <p className="text-white text-lg font-bold leading-relaxed">{rec.reason}</p>
                           <div className="mt-4 flex flex-wrap gap-3 justify-end">
                              <div className="bg-[#0B0F19] px-3 py-1.5 border border-[#1F2937] rounded text-[10px] font-bold text-gray-400">النوع: {rec.type}</div>
                              {rec.branch && <div className="bg-[#0B0F19] px-3 py-1.5 border border-blue-500/30 rounded text-[10px] font-bold text-blue-400">الفرع: {rec.branch}</div>}
                              <div className="bg-[#0B0F19] px-3 py-1.5 border border-[#1F2937] rounded text-[10px] font-bold text-gray-400">الخطورة: {rec.severity}</div>
                           </div>
                        </div>
                     ))}
                  </div>
                ) : (
                  <div className="p-12 bg-green-500/5 border border-green-500/20 rounded-xl text-center">
                     <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                     <h4 className="text-green-500 font-black text-xl mb-2 tracking-tighter">السجل نظيف بالكامل</h4>
                     <p className="text-gray-500 text-sm">البحث في كافة الأرشفة والتعميمات الحالية لم يسفر عن أي قيود فعالة.</p>
                  </div>
                )}
             </div>

             {/* Final Decision Panel - Redesigned for html2canvas clarity */}
             <div className={`mt-8 sm:mt-16 p-6 sm:p-10 border-2 ${ui.border} ${ui.bg} rounded-2xl relative`}>
                {/* Visual Label */}
                <div className="absolute -top-4 right-8 bg-[#0B0F19] px-4 py-1 border-x-2 border-t-2 rounded-t-lg">
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">قرار اللجنة الأمنية المركزية</p>
                </div>

                <div className="flex items-center gap-4 sm:gap-10">
                   <div className={`${ui.color} p-4 sm:p-6 bg-[#0B0F19] border-2 ${ui.border} rounded-2xl shadow-2xl`}>
                      {ui.icon}
                   </div>
                   <div className="flex-1">
                      <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-2 text-gray-500 opacity-80 leading-none">توصية الاعتماد النهائي</h2>
                      <p className={`text-2xl sm:text-4xl font-black ${ui.color} tracking-tighter leading-none`}>{ui.label}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-8 bg-[#111827] border-t-2 border-[#1F2937] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
           <p className="text-[8px] sm:text-[10px] text-gray-600 font-mono tracking-widest text-center sm:text-right uppercase">CONFIDENTIAL // NCSC INTEL CORE 7</p>
           <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={handleDownloadReport}
                disabled={isCapturing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white text-xs font-black rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {isCapturing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري التجهيز...</>
                ) : (
                  <><Download className="w-4 h-4" /> حفظ التقرير كصورة رسمية</>
                )}
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
      <p className={`text-base sm:text-lg font-bold leading-tight ${highlight ? 'text-white' : 'text-gray-300'}`}>{value}</p>
    </div>
  );
}
