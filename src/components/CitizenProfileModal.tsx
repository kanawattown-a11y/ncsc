"use client";

import { X, Shield, FileText, User as UserIcon, MapPin, Calendar, Droplets, Briefcase, Heart, Fingerprint, ExternalLink, Download, PlusCircle } from "lucide-react";

interface CitizenProfileModalProps {
  person: any;
  onClose: () => void;
  onUploadClick: () => void;
}

export default function CitizenProfileModal({ person, onClose, onUploadClick }: CitizenProfileModalProps) {
  const isBanned = person.records && person.records.some((r: any) => r.active);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex justify-center items-center p-4 animate-in fade-in duration-300">
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
              <p className={`text-xs font-bold uppercase tracking-widest ${isBanned ? 'text-red-500' : 'text-green-500'}`}>
                {isBanned ? `مطلوب أمنياً - عدد القيود: ${person.records.length}` : 'السجل الأمني: سليم ونظيف'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-[#111827] text-gray-500 hover:text-white rounded-full transition-all hover:rotate-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Portrait & ID */}
            <div className="space-y-6">
              <div className="aspect-[3/4] bg-[#111827] border-2 border-[#1F2937] rounded-2xl overflow-hidden relative group">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.fullName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                    <UserIcon className="w-20 h-20 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">No Official Portrait</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-mono text-center font-bold tracking-[0.2em]">{person.nationalId}</p>
                </div>
              </div>

              <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937] text-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">المعرف الرقمي للمنظومة</p>
                 <p className="text-xs text-blue-500 font-mono">{person.id}</p>
              </div>
            </div>

            {/* Middle/Right: Info Grid */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoItem icon={<UserIcon />} label="الاسم الرباعي" value={person.fullName} />
                <InfoItem icon={<UserIcon />} label="اسم الأم" value={person.motherName || "—"} />
                <InfoItem icon={<Calendar />} label="تاريخ الميلاد" value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString("ar-SA") : "—"} />
                <InfoItem icon={<MapPin />} label="مكان الميلاد" value={person.placeOfBirth || "—"} />
                <InfoItem icon={<UserIcon />} label="الجنس" value={person.gender === 'MALE' ? 'ذكر' : (person.gender === 'FEMALE' ? 'أنثى' : "—")} />
                <InfoItem icon={<Briefcase />} label="المهنة" value={person.job || "—"} />
                <InfoItem icon={<Heart />} label="الحالة الاجتماعية" value={person.maritalStatus || "—"} />
                <InfoItem icon={<Droplets />} label="زمرة الدم" value={person.bloodType || "—"} />
                <InfoItem icon={<Fingerprint />} label="العلامات الفارقة" value={person.physicalMarks || "—"} />
              </div>

              <div className="border-t border-[#1F2937] pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> العنوان التفصيلي المسجل
                  </h4>
                  <p className="text-white text-sm leading-relaxed bg-[#111827] p-4 rounded-xl border border-[#1F2937] min-h-[60px]">
                    {person.address || "لا يوجد عنوان مسجل في السجل الحالي."}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> الوصف الأمني الحر والملاحظات
                  </h4>
                  <p className="text-white text-sm leading-relaxed bg-[#111827] p-4 rounded-xl border border-[#1F2937] min-h-[60px] whitespace-pre-wrap">
                    {person.notes || "لا توجد ملاحظات وصفية إضافية لهذا السجل."}
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
                      <div key={record.id} className={`p-4 rounded-xl border flex justify-between items-center ${record.active ? 'bg-red-950/20 border-red-900/50' : 'bg-[#111827] border-[#1F2937]'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${record.active ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                              {record.type}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleDateString("ar-SA")}</span>
                          </div>
                          <p className={`text-sm ${record.active ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{record.reason}</p>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{record.source}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-[#111827] rounded-xl border border-dashed border-gray-800 text-gray-600 text-xs">
                      سجل نظيف بالكامل. لا توجد قضايا مسجلة.
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" /> الأرشيف الرقمي والمستندات الثبوتية
                  </h4>
                  <button 
                    onClick={onUploadClick}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/10 hover:bg-blue-600 border border-blue-600/50 text-blue-500 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> إضافة مستند جديد (S3)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {person.documents?.length > 0 ? (
                    person.documents.map((doc: any) => (
                      <div key={doc.id} className="bg-[#111827] p-3 rounded-xl border border-[#1F2937] flex items-center justify-between group hover:border-blue-500/50 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <div className="truncate">
                             <p className="text-xs text-white truncate font-bold">{doc.name}</p>
                             <p className="text-[10px] text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                        <button className="p-2 opacity-50 group-hover:opacity-100 hover:text-blue-400 transition-opacity">
                           <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-6 bg-[#111827] rounded-xl border border-dashed border-gray-800 text-gray-600 text-xs">
                      لا توجد مستندات مرفقة.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="p-6 bg-[#111827] border-t border-[#1F2937] flex justify-end gap-3 text-[10px] text-gray-500 font-mono">
           <span>Created: {new Date(person.createdAt).toLocaleString()}</span>
           <span className="opacity-30">|</span>
           <span>Last Updated: {new Date(person.updatedAt).toLocaleString()}</span>
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

import React from "react";
