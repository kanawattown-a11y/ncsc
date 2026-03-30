"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, FileText, User as UserIcon, MapPin, Calendar, Droplets, Briefcase, Heart, Fingerprint, ExternalLink, Download, PlusCircle, Eye, Trash2, ImageIcon } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { analyzeSecurity } from "@/lib/intelligence";

interface CitizenProfileModalProps {
  person: any;
  onClose: () => void;
  onUploadClick: () => void;
  intelligence?: any; // Optional pre-calculated report
}

const GENDER_MAP: Record<string, string> = { MALE: "ذكر", FEMALE: "أنثى" };
const MARITAL_MAP: Record<string, string> = { SINGLE: "أعزب", MARRIED: "متزوج", DIVORCED: "مطلق", WIDOWED: "أرمل" };

export default function CitizenProfileModal({ person, onClose, onUploadClick, intelligence }: CitizenProfileModalProps) {
  // Use passed intelligence or calculate locally using the unified engine
  const report = intelligence || analyzeSecurity(person);
  const isBanned = report.status === "BANNED";
  
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>(person.documents || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<any>({ SEVERITIES: [] });

  useEffect(() => {
    fetch("/api/admin/config").then(res => res.json()).then(setConfigs).catch(console.error);
  }, []);

  const { showToast } = useToast();

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-300">
      
      {/* Image Fullscreen Overlay */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in zoom-in duration-300 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl"></div>
          <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-20 backdrop-blur-md">
             <X className="w-8 h-8" />
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen" 
            className="relative z-10 max-w-full max-h-full object-contain rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="bg-[#0B0F19] border border-[#1F2937] rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header with status */}
        <div className={`h-24 flex items-center justify-between px-8 relative overflow-hidden ${isBanned ? 'bg-red-600/10' : 'bg-green-600/10'}`}>
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-current to-transparent opacity-5"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-2xl shadow-lg border ${isBanned ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-green-600 border-green-400 text-white'}`}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter">{person.fullName}</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isBanned ? (report.riskLevel === 'HIGH' ? 'text-red-500' : 'text-amber-500') : 'text-green-500'}`}>
                {isBanned ? (report.riskLevel === 'HIGH' ? 'توقيف فوري واحالة' : 'تدقيق أمني فعال') : 'السجل الأمني: سليم ونظيف'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-[#111827] text-gray-500 hover:text-white rounded-full transition-all hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Portrait — hidden on mobile (shown inline below) */}
            <div className="hidden lg:block space-y-4">
              <div 
                onClick={() => person.photoUrl && setFullscreenImage(person.photoUrl)}
                className="aspect-[3/4] bg-[#111827] border-2 border-[#1F2937] rounded-2xl overflow-hidden relative group cursor-zoom-in"
              >
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.fullName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                    <UserIcon className="w-16 h-16 mb-2 opacity-20" />
                    <span className="text-[9px] font-bold uppercase">No Portrait</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-mono text-center font-bold text-sm tracking-widest">{person.nationalId}</p>
                </div>
              </div>
              <div className="bg-[#111827] p-3 rounded-xl border border-[#1F2937] text-center">
                 <p className="text-[9px] text-gray-500 font-bold uppercase mb-0.5">المعرف الرقمي</p>
                 <p className="text-xs text-blue-500 font-mono break-all">{person.id.substring(0,16)}...</p>
              </div>
            </div>

            {/* Main Info Column */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-8">

              {/* Mobile portrait strip */}
              <div className="flex lg:hidden items-center gap-4 p-3 bg-[#111827] rounded-xl border border-[#1F2937]">
                <div
                  onClick={() => person.photoUrl && setFullscreenImage(person.photoUrl)}
                  className="w-16 h-20 bg-[#0B0F19] border border-[#1F2937] rounded-xl overflow-hidden relative shrink-0 cursor-zoom-in"
                >
                  {person.photoUrl
                    ? <img src={person.photoUrl} alt={person.fullName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-8 h-8 text-gray-700" /></div>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm">{person.fullName}</p>
                  <p className="font-mono text-gray-500 text-xs mt-0.5">{person.nationalId}</p>
                  <p className="text-blue-500 font-mono text-[9px] mt-1 break-all">{person.id.substring(0,20)}...</p>
                </div>
              </div>
              
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                <InfoItem icon={<UserIcon />} label="الاسم الرباعي" value={person.fullName} />
                <InfoItem icon={<UserIcon />} label="اسم الأم" value={person.motherName || "—"} />
                <div className="grid grid-cols-2 gap-2">
                  <InfoItem icon={<Shield />} label="القيد" value={person.civilRecord || "—"} />
                  <InfoItem icon={<Shield />} label="الأمانة" value={person.civilRegistry || "—"} />
                </div>
                <InfoItem icon={<Calendar />} label="تاريخ الميلاد" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString("ar-SA") : "—"} />
                <InfoItem icon={<MapPin />} label="مكان الميلاد" value={person.placeOfBirth || "—"} />
                <InfoItem icon={<UserIcon />} label="الجنس" value={GENDER_MAP[person.gender] || person.gender || "—"} />
                <InfoItem icon={<Briefcase />} label="المهنة" value={person.job || "—"} />
                <InfoItem icon={<Heart />} label="الحالة الاجتماعية" value={MARITAL_MAP[person.maritalStatus] || person.maritalStatus || "—"} />
                <InfoItem icon={<Droplets />} label="زمرة الدم" value={person.bloodType || "—"} />
                <InfoItem icon={<Fingerprint />} label="العلامات الفارقة" value={person.physicalMarks || "—"} />
              </div>

              <div className="border-t border-[#1F2937] pt-4 sm:pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> العنوان
                  </h4>
                  <p className="text-white text-xs sm:text-sm leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#1F2937]">
                    {person.address || "لا يوجد عنوان مسجل."}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-amber-500" /> الملاحظات الأمنية
                  </h4>
                  <p className="text-white text-xs sm:text-sm leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#1F2937] whitespace-pre-wrap">
                    {person.notes || "لا توجد ملاحظات."}
                  </p>
                </div>
              </div>

              {/* Security Records Section */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> السجل الجنائي والأمني (الفعال والمنتهي)
                </h4>
                <div className="space-y-3">
                  {person.records?.length > 0 ? (
                    person.records.map((record: any) => (
                      <div key={record.id} className={`p-4 rounded-xl border ${record.active ? 'bg-red-950/20 border-red-900/50 border-r-4 border-r-red-500' : 'bg-[#111827] border-[#1F2937] opacity-60'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${record.active ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                              {record.type}
                            </span>
                            {record.branch && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                {record.branch}
                              </span>
                            )}
                            {record.severity && (
                              <span 
                                className="text-[10px] px-2 py-0.5 rounded font-bold border"
                                style={{ 
                                  backgroundColor: (configs.SEVERITIES?.find((s:any)=>s.value === record.severity)?.color || '#374151') + '33',
                                  color: configs.SEVERITIES?.find((s:any)=>s.value === record.severity)?.color || '#9ca3af',
                                  borderColor: (configs.SEVERITIES?.find((s:any)=>s.value === record.severity)?.color || '#374151') + '66'
                                }}
                              >
                                {configs.SEVERITIES?.find((s:any)=>s.value === record.severity)?.label || record.severity}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500">{new Date(record.createdAt).toLocaleDateString("ar-SA")}</span>
                          </div>
                          <span className={`text-[10px] font-bold ${record.active ? 'text-red-500' : 'text-gray-600'}`}>
                            {record.active ? 'قيد فعال' : 'ملغى/مؤرشف'}
                          </span>
                        </div>
                        <p className={`text-sm ${record.active ? 'text-red-300 font-bold' : 'text-gray-400'}`}>{record.reason}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-[#111827] rounded-xl border border-dashed border-gray-800 text-gray-600 text-xs">
                      سجل نظيف بالكامل. لا توجد قضايا مسجلة.
                    </div>
                  )}
                </div>
              </div>

              {/* Documents & Images Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" /> الأرشيف الرقمي والمستندات الثبوتية ({documents.length})
                  </h4>
                  <button 
                    onClick={onUploadClick}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/50 text-blue-500 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> إضافة مستند جديد (S3)
                  </button>
                </div>

                {/* Image Gallery */}
                {documents.filter(d => d.type === 'IMAGE').length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> معرض الصور</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {documents.filter(d => d.type === 'IMAGE').map((doc: any) => (
                        <div key={doc.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1F2937] bg-[#111827]">
                          <img 
                            src={`/api/documents/${doc.id}/view`} 
                            alt={doc.name} 
                            className="w-full h-full object-cover cursor-zoom-in transition-transform group-hover:scale-105"
                            onClick={() => setFullscreenImage(`/api/documents/${doc.id}/view`)}
                            onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,..."; }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => setFullscreenImage(`/api/documents/${doc.id}/view`)} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                              <Eye className="w-3 h-3 text-white" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)} 
                              disabled={deletingId === doc.id}
                              className="p-1.5 bg-red-600/60 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          <p className="absolute bottom-0 left-0 right-0 text-[8px] text-white/70 truncate px-1 py-0.5 bg-black/50">{doc.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.filter(d => d.type !== 'IMAGE').map((doc: any) => (
                    <div 
                      key={doc.id} 
                      className="bg-[#111827] p-3 rounded-xl border border-[#1F2937] flex items-center justify-between group hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="truncate">
                           <p className="text-xs text-white truncate font-bold">{doc.name}</p>
                           <p className="text-[10px] text-gray-500">{doc.type} • {doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a href={`/api/documents/${doc.id}/view`} target="_blank" rel="noreferrer" className="p-2 opacity-50 group-hover:opacity-100 hover:text-blue-400 transition-all text-gray-400">
                           <Download className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deletingId === doc.id}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all text-gray-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="col-span-2 text-center py-6 bg-[#111827] rounded-xl border border-dashed border-gray-800 text-gray-600 text-xs">
                      لا توجد مستندات مرفقة. اضغط "إضافة مستند" لرفع الوثائق.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 bg-[#111827] border-t border-[#1F2937] flex justify-between items-center text-[9px] sm:text-[10px] text-gray-600 font-mono">
           <span className="hidden sm:block">Created: {new Date(person.createdAt).toLocaleString("ar-SA")}</span>
           <span className="sm:hidden">ID: {person.id.substring(0,12)}</span>
           <span>Updated: {new Date(person.updatedAt).toLocaleDateString("ar-SA")}</span>
        </div>

      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-gray-500">
        {React.cloneElement(icon, { className: "w-3 h-3" })}
        <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      </div>
      <p className="text-sm text-white font-bold">{value}</p>
    </div>
  );
}
