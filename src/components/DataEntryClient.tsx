"use client";

import { useState } from "react";
import { PlusCircle, Upload, Search, Edit2, FileText, CheckCircle, AlertTriangle, X } from "lucide-react";

export default function DataEntryClient({ initialData }: { initialData: any[] }) {
  const [people, setPeople] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Add Form State
  const [formData, setFormData] = useState({
    nationalId: "", fullName: "", motherName: "", placeOfBirth: "", job: "", physicalMarks: ""
  });
  const [recordData, setRecordData] = useState({
    type: "OTHER", reason: "", source: "INTERNAL", severity: "MEDIUM"
  });
  const [addRecordMode, setAddRecordMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"" | "uploading" | "success" | "error">("");
  const [uploadMessage, setUploadMessage] = useState("");

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, records: addRecordMode ? [recordData] : [] };
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Successfully added! Refresh local list
      setPeople([data, ...people]);
      setShowAddModal(false);
      setFormData({ nationalId: "", fullName: "", motherName: "", placeOfBirth: "", job: "", physicalMarks: "" });
      setAddRecordMode(false);
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!file || !selectedPersonId) return;

     setUploadStatus("uploading");
     setUploadMessage("جاري تأمين الرابط ورفع الملف المشفر...");

     try {
       // 1. Get Presigned S3 Link
       const person = people.find(p => p.id === selectedPersonId);
       const authRes = await fetch("/api/upload", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            personId: selectedPersonId,
            nationalId: person?.nationalId,
            fileName: file.name.replace(/[^a-zA-Z0-9.\-]/g, "_"), // Filter bizarre characters
            fileType: file.type,
            docType: file.type.includes("pdf") ? "PDF" : (file.type.includes("image") ? "IMAGE" : "OTHER")
         })
       });
       
       const authData = await authRes.json();
       if (!authRes.ok) throw new Error(authData.error || "فشل الحصول على تصريح رفع لـ AWS S3");

       // 2. Upload cleanly & directly to S3 Bucket
       const uploadRes = await fetch(authData.uploadUrl, {
         method: "PUT",
         headers: { "Content-Type": file.type },
         body: file
       });

       if (!uploadRes.ok) throw new Error("سيرفر AWS رفض الملف المرفوع. تأكد من حجم الملف.");

       setUploadStatus("success");
       setUploadMessage("تم إرفاق وتشفير المستند لـ S3 بنجاح وتأمينه داخل ملف المواطن.");
       setTimeout(() => {
          setShowUploadModal(false);
          setUploadStatus("");
          setFile(null);
       }, 3000);
     } catch (err: any) {
        setUploadStatus("error");
        setUploadMessage(err.message);
     }
  };

  const filtered = people.filter(p => p.nationalId.includes(searchTerm) || p.fullName.includes(searchTerm));

  return (
    <>
      {/* Tools Layer */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button onClick={() => setShowAddModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg transition-colors">
          <PlusCircle className="w-5 h-5" /> بناء ملف مواطن
        </button>
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث سريع بالاسم أو الرقم الوطني..." 
            className="w-full bg-[#0B0F19] text-white border border-[#1F2937] px-10 py-3 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none placeholder-gray-600"
          />
        </div>
      </div>

      {/* Database View Table */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono">لا توجد سجلات. جرب إضافة ملفات أو استوردها للشبكة الموحدة.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[#0B0F19] border-b border-[#1F2937] text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">الرقم الوطني</th>
                  <th className="px-6 py-4 font-semibold">الاسم الكامل</th>
                  <th className="px-6 py-4 font-semibold">التصنيف</th>
                  <th className="px-6 py-4 font-semibold text-left">أدوات الملف والأدلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {filtered.map((person) => {
                  const isBanned = person.records && person.records.some((r: any) => r.active);
                  return (
                    <tr key={person.id} className="hover:bg-[#1F2937]/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-300 font-bold">{person.nationalId}</td>
                      <td className="px-6 py-4 font-bold text-white">{person.fullName}</td>
                      <td className="px-6 py-4">
                        {!isBanned ? (
                          <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded text-xs border border-[#10B981]/30">معدوم القيود</span>
                        ) : (
                          <span className="text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded text-xs border border-[#EF4444]/30">مطلوب ({person.records.length})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left flex justify-end gap-2 items-center">
                         <button 
                            onClick={() => { setSelectedPersonId(person.id); setShowUploadModal(true); }}
                            className="text-[#10B981] hover:text-white bg-[#10B981]/10 border border-[#10B981]/50 hover:bg-[#10B981] px-3 py-1.5 rounded transition-colors flex items-center justify-end gap-2 text-xs font-bold whitespace-nowrap"
                         >
                            <Upload className="w-4 h-4 cursor-pointer" /> إرفاق دليل مشفر  (S3)
                         </button>
                         <button className="text-gray-400 hover:text-white bg-[#1F2937]/50 border border-[#374151] hover:bg-[#374151] px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-xs">
                            <Edit2 className="w-4 h-4" /> طلب تعديل
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#1F2937] pb-4 flex items-center gap-2"><PlusCircle className="text-[#2563EB]" /> إنشاء ملف مواطن جديد</h2>
            
            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">الرقم الوطني *</label>
                  <input required placeholder="مثال: 01010101010" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 font-mono" value={formData.nationalId} onChange={e => setFormData(p => ({...p, nationalId: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">الاسم الكامل (رباعي) *</label>
                  <input required placeholder="الاسم" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3" value={formData.fullName} onChange={e => setFormData(p => ({...p, fullName: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">اسم الأم</label>
                  <input placeholder="الاسم" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3" value={formData.motherName} onChange={e => setFormData(p => ({...p, motherName: e.target.value}))} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">المهنة / العمل</label>
                  <input placeholder="طبيب، ضابط، نجار" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3" value={formData.job} onChange={e => setFormData(p => ({...p, job: e.target.value}))} />
                </div>
              </div>
              <div>
                  <label className="text-sm text-gray-400 block mb-1">العلامات الفارقة</label>
                  <input placeholder="وشم على اليد اليمنى، ندبة في الوجه" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3" value={formData.physicalMarks} onChange={e => setFormData(p => ({...p, physicalMarks: e.target.value}))} />
              </div>

              <div className="border border-[#1F2937] rounded-lg p-4 mt-6 bg-[#0B0F19]">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-[#EF4444] text-lg">تعميم أمني (إضافة حظر فور الإنشاء)</h3>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={addRecordMode} onChange={() => setAddRecordMode(!addRecordMode)} />
                     <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                   </label>
                </div>
                
                {addRecordMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                     <div>
                       <label className="text-sm text-[#EF4444] block mb-1">تصنيف הקيد</label>
                       <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.type} onChange={e => setRecordData(p => ({...p, type: e.target.value}))}>
                         <option value="CRIMINAL">مذكرة جلب (جرم جنائي)</option>
                         <option value="SECURITY">تعميم أمني / مطلوب مخابرات</option>
                         <option value="TRAVEL_BAN">منع المغادرة (سفر)</option>
                         <option value="WANTED">مطلوب أمن الدولة</option>
                         <option value="OTHER">إشارة حظر تنقل</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-sm text-[#EF4444] block mb-1">سبب أو حيثيات القيد</label>
                       <input required placeholder="وصف التدخل الجرمي أو مصدر البرقية..." className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.reason} onChange={e => setRecordData(p => ({...p, reason: e.target.value}))} />
                     </div>
                     <div>
                       <label className="text-sm text-[#EF4444] block mb-1">الدرجة</label>
                       <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.severity} onChange={e => setRecordData(p => ({...p, severity: e.target.value}))}>
                         <option value="HIGH">عالي الخطورة (التوقيف المباشر)</option>
                         <option value="MEDIUM">متوسط (الاستجواب الميداني)</option>
                         <option value="LOW">منخفض (المراقبة اللاحقة)</option>
                       </select>
                     </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2">
                  {isSubmitting ? "جاري الإنشاء..." : "حفظ وبناء الملف الدائم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload S3 Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 w-full max-w-lg shadow-2xl relative ring-1 ring-[#10B981]/50">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-4 left-4 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-[#10B981]/10 rounded-full mb-4 animate-pulse"><FileText className="w-12 h-12 text-[#10B981]" /></div>
              <h2 className="text-xl font-bold text-white mb-2 text-center">إدراج دليل أمني مشفر (AWS S3)</h2>
              <p className="text-gray-400 text-sm text-center mb-6">سيتم حجز رابط مشفر للرفع وحفظه مباشرة في الرفوف المشفرة للسيرفر بدون مروره باللوحة الأم لتجنب الثغرات.</p>
              
              {uploadStatus === "success" && (
                <div className="w-full bg-green-900/40 border border-green-500 text-green-400 p-4 rounded-lg mb-4 text-center">
                   <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                   {uploadMessage}
                </div>
              )}
              {uploadStatus === "error" && (
                <div className="w-full bg-red-900/40 border border-red-500 text-red-400 p-4 rounded-lg mb-4 text-center text-sm">
                   <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                   {uploadMessage}
                </div>
              )}

              {uploadStatus !== "success" && (
                <form onSubmit={handleFileUpload} className="w-full">
                  <input type="file" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full bg-[#0B0F19] text-gray-300 border border-[#1F2937] p-2 rounded mb-6 file:cursor-pointer file:border-0 file:bg-[#10B981] file:text-black file:font-bold file:px-4 file:py-2 file:mr-4 file:rounded file:hover:bg-[#059669]" />
                  <button type="submit" disabled={uploadStatus === "uploading" || !file} className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                    {uploadStatus === "uploading" ? (
                      <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    ) : ( 
                      <><Upload className="w-5 h-5"/> رفع المستند لـ S3 الآن</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
