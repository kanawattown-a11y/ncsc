"use client";

import { useState } from "react";
import { PlusCircle, Upload, Search, Edit2, FileText, CheckCircle, AlertTriangle, X, ShieldCheck, Download, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import CitizenProfileModal from "./CitizenProfileModal";

export default function DataEntryClient({ initialData }: { initialData: any[] }) {
  const [people, setPeople] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();
  const { showToast } = useToast();
  const role = (session?.user as any)?.role;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    nationalId: "", fullName: "", motherName: "",
    dateOfBirth: "", placeOfBirth: "", gender: "MALE",
    address: "", job: "", maritalStatus: "SINGLE",
    bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
  });
  const [recordData, setRecordData] = useState({
    type: "OTHER", reason: "", source: "INTERNAL", severity: "MEDIUM"
  });
  const [addRecordMode, setAddRecordMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [portraitIndex, setPortraitIndex] = useState<number | null>(null);

  // Single Upload State (For existing persons)
  const [file, setFile] = useState<File | null>(null);
  const [setAsPortrait, setSetAsPortrait] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<"" | "uploading" | "success" | "error">("");
  const [uploadMessage, setUploadMessage] = useState("");

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Person
      const payload = { ...formData, records: addRecordMode ? [recordData] : [] };
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const person = await res.json();
      if (!res.ok) throw new Error(person.error);

      // 2. Continuous Multi-File Upload to S3
      if (selectedFiles.length > 0) {
        setUploadStatus("uploading");
        for (let i = 0; i < selectedFiles.length; i++) {
          const f = selectedFiles[i];
          setUploadMessage(`جاري رفع الملف (${i + 1}/${selectedFiles.length}): ${f.name}`);

          const authRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              personId: person.id,
              nationalId: person.nationalId,
              fileName: f.name.replace(/[^a-zA-Z0-9.\-]/g, "_"),
              fileType: f.type,
              docType: f.type.includes("pdf") ? "PDF" : (f.type.includes("image") ? "IMAGE" : "OTHER"),
              setAsPortrait: i === portraitIndex
            })
          });

          const authData = await authRes.json();
          if (!authRes.ok) continue; // Skip failed to keep going

          await fetch(authData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": f.type },
            body: f
          });
        }
      }

      // Successfully added! Refresh local list
      setPeople([person, ...people]);
      setShowAddModal(false);
      setSelectedFiles([]);
      setPortraitIndex(null);
      setFormData({
        nationalId: "", fullName: "", motherName: "",
        dateOfBirth: "", placeOfBirth: "", gender: "MALE",
        address: "", job: "", maritalStatus: "SINGLE",
        bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
      });
      setAddRecordMode(false);
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (person: any) => {
    setFormData({
      nationalId: person.nationalId,
      fullName: person.fullName,
      motherName: person.motherName || "",
      dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth).toISOString().split('T')[0] : "",
      placeOfBirth: person.placeOfBirth || "",
      gender: person.gender || "MALE",
      address: person.address || "",
      job: person.job || "",
      maritalStatus: person.maritalStatus || "SINGLE",
      bloodType: person.bloodType || "",
      physicalMarks: person.physicalMarks || "",
      photoUrl: person.photoUrl || "",
      notes: person.notes || ""
    });
    setSelectedPersonId(person.id);
    setShowEditModal(true);
  };

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    setIsSubmitting(true);

    try {
      if (role === "ADMIN") {
        // Direct Action for Admin
        const res = await fetch(`/api/persons/${selectedPersonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setPeople(people.map(p => p.id === selectedPersonId ? data : p));
        setShowEditModal(false);
        setFormData({
          nationalId: "", fullName: "", motherName: "",
          dateOfBirth: "", placeOfBirth: "", gender: "MALE",
          address: "", job: "", maritalStatus: "SINGLE",
          bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
        });
        setSelectedPersonId(null);
        showToast("تم تحديث بيانات الملف بنجاح.", "success");
      } else {
        // Request Action for Data Entry
        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: selectedPersonId,
            proposedChanges: formData
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast("تم إرسال طلب التعديل بنجاح لمراجعة الأدمن.", "success");
        setShowEditModal(false);
        setFormData({
          nationalId: "", fullName: "", motherName: "",
          dateOfBirth: "", placeOfBirth: "", gender: "MALE",
          address: "", job: "", maritalStatus: "SINGLE",
          bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
        });
        setSelectedPersonId(null);
      }
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

  const handleExportCSV = () => {
    const headers = ["الرقم الوطني", "الاسم الكامل", "اسم الأم", "المهنة", "حالة القيد"];
    const rows = filtered.map(p => {
      const isBanned = p.records && p.records.some((r: any) => r.active);
      return [
        p.nationalId,
        p.fullName,
        p.motherName || "—",
        p.job || "—",
        isBanned ? `مطلوب (${p.records.length})` : "سليم"
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NCSC_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = people.filter(p => p.nationalId.includes(searchTerm) || p.fullName.includes(searchTerm));

  return (
    <>
      {/* Tools Layer */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button onClick={() => setShowAddModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg transition-colors">
          <PlusCircle className="w-5 h-5" /> بناء ملف مواطن
        </button>
        <button onClick={handleExportCSV} className="bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937] text-gray-300 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95">
          <Download className="w-5 h-5 text-[#F59E0B]" /> تصدير السجل العام
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
                  <th className="px-6 py-4 font-semibold text-center">التصنيف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {filtered.map((person) => {
                  const isBanned = person.records && person.records.some((r: any) => r.active);
                  return (
                    <tr key={person.id} className="hover:bg-[#1F2937]/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-gray-300 font-bold">{person.nationalId}</td>
                      <td
                        className="px-6 py-4 font-bold text-white cursor-pointer hover:text-[#2563EB] transition-colors flex items-center gap-2 group/name"
                        onClick={() => { setActiveProfile(person); setShowProfileModal(true); }}
                      >
                        {person.fullName}
                        <Eye className="w-4 h-4 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!isBanned ? (
                          <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded text-xs border border-[#10B981]/30">معدوم القيود</span>
                        ) : (
                          <span className="text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded text-xs border border-[#EF4444]/30">مطلوب ({person.records.length})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left flex justify-end gap-2 items-center">
                        <button
                          onClick={() => handleEditClick(person)}
                          className="text-gray-400 hover:text-white bg-[#1F2937]/50 border border-[#374151] hover:bg-[#374151] px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-xs"
                        >
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الرقم الوطني *</label>
                  <input required placeholder="12345678901" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 font-mono text-sm" value={formData.nationalId} onChange={e => setFormData(p => ({ ...p, nationalId: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الاسم الرباعي الكامل *</label>
                  <input required placeholder="الاسم الكامل" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">اسم الأم</label>
                  <input placeholder="اسم الأم" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.motherName} onChange={e => setFormData(p => ({ ...p, motherName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">تاريخ الميلاد</label>
                  <input type="date" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.dateOfBirth} onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">مكان الميلاد</label>
                  <input placeholder="المدينة/البلدة" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.placeOfBirth} onChange={e => setFormData(p => ({ ...p, placeOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الجنس</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">المهنة</label>
                  <input placeholder="المهنة الحالية" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.job} onChange={e => setFormData(p => ({ ...p, job: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الحالة الاجتماعية</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.maritalStatus} onChange={e => setFormData(p => ({ ...p, maritalStatus: e.target.value }))}>
                    <option value="SINGLE">أعزب</option>
                    <option value="MARRIED">متزوج</option>
                    <option value="DIVORCED">مطلق</option>
                    <option value="WIDOWED">أرمل</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">فصيلة الدم</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.bloodType} onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value }))}>
                    <option value="">غير معروف</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">العنوان التفصيلي</label>
                <input placeholder="البلدة - المنطقة - الشارع - رقم البناء" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">العلامات الفارقة</label>
                <input placeholder="ندبات، أوشام، إلخ" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.physicalMarks} onChange={e => setFormData(p => ({ ...p, physicalMarks: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1 font-bold">وصف حر (تفاصيل إضافية / الحالة العامة)</label>
                <textarea 
                  rows={4}
                  placeholder="اكتب هنا أي تفاصيل إضافية لا تغطيها الخانات أعلاه..." 
                  className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                  value={formData.notes} 
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} 
                />
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
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.type} onChange={e => setRecordData(p => ({ ...p, type: e.target.value }))}>
                        <option value="CRIMINAL">مذكرة جلب (جرم جنائي)</option>
                        <option value="SECURITY">تعميم أمني / مطلوب مخابرات</option>
                        <option value="TRAVEL_BAN">منع المغادرة (سفر)</option>
                        <option value="WANTED">مطلوب أمن الدولة</option>
                        <option value="OTHER">إشارة حظر تنقل</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-[#EF4444] block mb-1">سبب أو حيثيات القيد</label>
                      <input required placeholder="وصف التدخل الجرمي أو مصدر البرقية..." className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.reason} onChange={e => setRecordData(p => ({ ...p, reason: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-[#EF4444] block mb-1">الدرجة</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.severity} onChange={e => setRecordData(p => ({ ...p, severity: e.target.value }))}>
                        <option value="HIGH">عالي الخطورة (التوقيف المباشر)</option>
                        <option value="MEDIUM">متوسط (الاستجواب الميداني)</option>
                        <option value="LOW">منخفض (المراقبة اللاحقة)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-File Upload Section in Add Modal */}
              <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500" /> إرفاق وثائق مشفرة (ملحقات برمجية)</h3>
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    اختيار ملفات...
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        setSelectedFiles([...selectedFiles, ...newFiles]);
                      }}
                    />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
                    {selectedFiles.map((f, idx) => (
                      <div key={idx} className={`relative group p-2 rounded-lg border transition-all ${portraitIndex === idx ? 'bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/50' : 'bg-[#111827] border-[#1F2937] hover:border-gray-600'}`}>
                        {f.type.includes("image") ? (
                          <img src={URL.createObjectURL(f)} alt="preview" className="w-full aspect-square object-cover rounded shadow-sm mb-2" />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center bg-[#0B0F19] rounded mb-2"><FileText className="w-8 h-8 opacity-20" /></div>
                        )}
                        <p className="text-[10px] text-gray-500 truncate text-center px-1 font-mono">{f.name}</p>

                        {/* Portrait Designation Button */}
                        {f.type.includes("image") && (
                          <button
                            type="button"
                            onClick={() => setPortraitIndex(idx)}
                            className={`absolute -top-2 -right-2 p-1.5 rounded-full shadow-xl z-20 transition-all ${portraitIndex === idx ? 'bg-blue-500 text-white scale-110' : 'bg-gray-800 text-gray-500 opacity-0 group-hover:opacity-100'}`}
                            title="Set as Profile Portrait"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                            if (portraitIndex === idx) setPortraitIndex(null);
                          }}
                          className="absolute -top-2 -left-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadStatus === "uploading" && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg animate-pulse text-xs text-blue-400 font-bold flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    {uploadMessage}
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

      {/* Edit Person Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto font-sans">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 left-4 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#1F2937] pb-4 flex items-center gap-2"><Edit2 className="text-[#F59E0B]" /> تعديل بيانات السجل الأمني</h2>

            <form onSubmit={handleUpdatePerson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الرقم الوطني (محمي)</label>
                  <input readOnly className="w-full bg-[#0B0F19] text-gray-500 border border-[#1F2937] rounded p-3 font-mono opacity-60 text-sm" value={formData.nationalId} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الاسم الكامل *</label>
                  <input required className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">اسم الأم</label>
                  <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.motherName} onChange={e => setFormData(p => ({ ...p, motherName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">تاريخ الميلاد</label>
                  <input type="date" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.dateOfBirth} onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">مكان الميلاد</label>
                  <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.placeOfBirth} onChange={e => setFormData(p => ({ ...p, placeOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الجنس</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">المهنة الحالية</label>
                  <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.job} onChange={e => setFormData(p => ({ ...p, job: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الحالة الاجتماعية</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.maritalStatus} onChange={e => setFormData(p => ({ ...p, maritalStatus: e.target.value }))}>
                    <option value="SINGLE">أعزب</option>
                    <option value="MARRIED">متزوج</option>
                    <option value="DIVORCED">مطلق</option>
                    <option value="WIDOWED">أرمل</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">فصيلة الدم</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.bloodType} onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value }))}>
                    <option value="">غير معروف</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O+">O+</option>
                  </select>
                </div>
              </div>
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">العنوان التفصيلي</label>
                <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">العلامات الفارقة والجسدية</label>
                <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.physicalMarks} onChange={e => setFormData(p => ({ ...p, physicalMarks: e.target.value }))} />
              </div>
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">تحديث الوصف الأمني الحر</label>
                <textarea 
                  rows={4}
                  className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" 
                  value={formData.notes} 
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} 
                />
              </div>

              <div className="pt-6 flex justify-start">
                <button type="submit" disabled={isSubmitting} className={`${role === 'ADMIN' ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'} hover:opacity-90 text-black font-bold px-10 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95`}>
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  ) : (
                    role === "ADMIN" ? (
                      <>حفظ التعديلات الأمنية فوراً (بدون مراجعة)</>
                    ) : (
                      <>إرسال طلب مراجعة للقيادة</>
                    )
                  )}
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
                  <input type="file" required onChange={e => setFile(e.target.files?.[0] || null)} className="w-full bg-[#0B0F19] text-gray-300 border border-[#1F2937] p-2 rounded mb-4 file:cursor-pointer file:border-0 file:bg-[#10B981] file:text-black file:font-bold file:px-4 file:py-2 file:mr-4 file:rounded file:hover:bg-[#059669]" />

                  {file && file.type.includes("image") && (
                    <div className="flex items-center gap-3 mb-6 bg-[#0B0F19] p-3 rounded border border-[#1F2937]">
                      <input
                        type="checkbox"
                        id="portrait_chk"
                        className="w-4 h-4 accent-[#10B981]"
                        checked={setAsPortrait}
                        onChange={(e) => setSetAsPortrait(e.target.checked)}
                      />
                      <label htmlFor="portrait_chk" className="text-xs text-[#10B981] font-bold cursor-pointer">
                        اعتماد هذه الصورة كـ "صورة شخصية رسمية" في ملف المواطن
                      </label>
                    </div>
                  )}

                  <button type="submit" disabled={uploadStatus === "uploading" || !file} className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                    {uploadStatus === "uploading" ? (
                      <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    ) : (
                      <><Upload className="w-5 h-5" /> رفع المستند لـ S3 الآن</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Profile Detail Modal */}
      {showProfileModal && activeProfile && (
        <CitizenProfileModal
          person={activeProfile}
          onClose={() => setShowProfileModal(false)}
          onUploadClick={() => {
            setSelectedPersonId(activeProfile.id);
            setShowUploadModal(true);
          }}
        />
      )}
    </>
  );
}
