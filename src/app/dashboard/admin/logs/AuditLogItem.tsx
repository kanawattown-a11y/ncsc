"use client";

import { useState } from "react";
import { ShieldAlert, Terminal, Clock, User, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

export default function AuditLogItem({ log }: { log: any }) {
  const [isOpen, setIsOpen] = useState(false);

  let details: any = null;
  let isJson = false;

  try {
    if (log.details && (log.details.startsWith("{") || log.details.startsWith("["))) {
      details = JSON.parse(log.details);
      isJson = true;
    }
  } catch (e) {
    // Not JSON
  }

  return (
    <div className={`bg-[#111827] border-r-4 ${isOpen ? 'border-[#2563EB]' : 'border-gray-800'} p-4 rounded-lg flex flex-col gap-4 transition-all duration-300 hover:bg-[#1F2937]/50 shadow-md`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <ShieldAlert className={`w-5 h-5 ${isJson ? 'text-[#2563EB]' : 'text-gray-500'}`} />
          </div>
          <div className="text-right">
            <h4 className="text-white font-bold font-mono text-sm uppercase tracking-wider">{log.action}</h4>
            <p className="text-[10px] text-gray-500 mt-1 uppercase">الكيان: {log.entity} | ID: {log.entityId?.substring(0, 8) || "N/A"}</p>
            {!isJson && log.details && (
              <p className="text-xs text-gray-400 mt-2">{log.details}</p>
            )}
            {isJson && (
               <button 
                onClick={() => setIsOpen(!isOpen)}
                className="mt-2 text-[10px] bg-[#2563EB]/20 text-[#2563EB] px-2 py-1 rounded flex items-center gap-1 hover:bg-[#2563EB] hover:text-white transition-all font-bold"
               >
                 {isOpen ? <><ChevronUp className="w-3 h-3"/> إغلاق التفاصيل</> : <><ChevronDown className="w-3 h-3"/> عرض فروقات البيانات (JSON)</>}
               </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end pr-4 mr-auto border-r border-[#1F2937] rtl:border-r-0 rtl:border-l rtl:mr-0 rtl:ml-auto rtl:pl-4">
          <span className="flex items-center gap-1 text-sm text-[#2563EB] font-bold">
            <User className="w-4 h-4" /> {log.user.username}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 font-mono tracking-tighter">
            <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString("ar-SA")}
          </span>
        </div>
      </div>

      {isOpen && isJson && (
        <div className="mt-4 p-4 bg-[#0B0F19] rounded-xl border border-[#1F2937] animate-in slide-in-from-top-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="space-y-2">
                 <h5 className="text-[10px] text-gray-500 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span> الحالة السابقة
                 </h5>
                 <pre className="text-[10px] text-red-300/70 p-3 bg-red-900/5 rounded font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(details.old, null, 2)}
                 </pre>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                 <ArrowRight className="w-6 h-6 text-gray-700" />
              </div>

              <div className="space-y-2">
                 <h5 className="text-[10px] text-gray-500 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> الحالة الجديدة
                 </h5>
                 <pre className="text-[10px] text-green-300/70 p-3 bg-green-900/5 rounded font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(details.new, null, 2)}
                 </pre>
              </div>
           </div>
           {details.message && (
             <div className="mt-4 pt-4 border-t border-[#1F2937] text-xs text-[#2563EB] font-bold italic">
                {details.message}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
