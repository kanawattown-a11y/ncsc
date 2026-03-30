"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Upload, Search, Edit2, FileText, CheckCircle, AlertTriangle, X, ShieldCheck, Download, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import CitizenProfileModal from "./CitizenProfileModal";
import SecurityStudyModal from "./SecurityStudyModal";
import { Files } from "lucide-react";

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
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [editingRecords, setEditingRecords] = useState<any[]>([]);
  const [editingDocuments, setEditingDocuments] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>({ WARRANT_TYPES: [], BRANCHES: [], SEVERITIES: [] });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      setConfigs(data);
    } catch (err) { console.error("Config load error", err); }
  };

  const [formData, setFormData] = useState({
    nationalId: "", fullName: "", motherName: "",
    civilRecord: "", civilRegistry: "",
    dateOfBirth: "", placeOfBirth: "", gender: "MALE",
    address: "", job: "", maritalStatus: "SINGLE",
    bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
  });
  const [recordData, setRecordData] = useState({
    type: "OTHER", reason: "", source: "INTERNAL", branch: "", severity: "MEDIUM"
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
        nationalId: "", fullName: "", motherName: "", civilRecord: "", civilRegistry: "",
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
    setAddRecordMode(false);
    setRecordData({ type: "OTHER", reason: "", source: "INTERNAL", branch: "", severity: "MEDIUM" });
    setSelectedFiles([]);
    setPortraitIndex(null);
    setEditingRecords(person.records || []);
    setEditingDocuments(person.documents || []);
    setFormData({
      nationalId: person.nationalId,
      fullName: person.fullName,
      motherName: person.motherName || "",
      civilRecord: person.civilRecord || "",
      civilRegistry: person.civilRegistry || "",
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

  const handleDeleteEditingDocument = async (docId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        setEditingDocuments(docs => docs.filter(d => d.id !== docId));
        showToast("تم حذف المستند بنجاح.", "success");
      }
    } catch (err) {
      showToast("فشل حذف المستند.", "error");
    }
  };

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        records: [
          ...(addRecordMode ? [recordData] : []),
          ...editingRecords
        ]
      };

      if (role === "ADMIN") {
        // Direct Action for Admin
        const res = await fetch(`/api/persons/${selectedPersonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // 2. Multi-File Upload for Edit
        if (selectedFiles.length > 0) {
          setUploadStatus("uploading");
          for (let i = 0; i < selectedFiles.length; i++) {
            const f = selectedFiles[i];
            setUploadMessage(`جاري رفع الملف (${i + 1}/${selectedFiles.length}): ${f.name}`);
            const authRes = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                personId: selectedPersonId,
                nationalId: data.nationalId,
                fileName: f.name.replace(/[^a-zA-Z0-9.\-]/g, "_"),
                fileType: f.type,
                docType: f.type.includes("pdf") ? "PDF" : (f.type.includes("image") ? "IMAGE" : "OTHER"),
                setAsPortrait: i === portraitIndex
              })
            });
            const authData = await authRes.json();
            if (!authRes.ok) continue;
            await fetch(authData.uploadUrl, { method: "PUT", headers: { "Content-Type": f.type }, body: f });
          }
        }

        setPeople(people.map(p => p.id === selectedPersonId ? data : p));
        setShowEditModal(false);
        setFormData({
          nationalId: "", fullName: "", motherName: "", civilRecord: "", civilRegistry: "",
          dateOfBirth: "", placeOfBirth: "", gender: "MALE",
          address: "", job: "", maritalStatus: "SINGLE",
          bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
        });
        setSelectedFiles([]);
        setPortraitIndex(null);
        setSelectedPersonId(null);
        showToast("تم تحديث بيانات الملف والوثائق بنجاح.", "success");
      } else {
        // Request Action for Data Entry
        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: selectedPersonId,
            proposedChanges: payload
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast("تم إرسال طلب التعديل (مع القيود والوثائق) بنجاح لمراجعة الأدمن.", "success");
        setShowEditModal(false);
        setFormData({
          nationalId: "", fullName: "", motherName: "", civilRecord: "", civilRegistry: "",
          dateOfBirth: "", placeOfBirth: "", gender: "MALE",
          address: "", job: "", maritalStatus: "SINGLE",
          bloodType: "", physicalMarks: "", photoUrl: "", notes: ""
        });
        setSelectedFiles([]);
        setPortraitIndex(null);
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
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button onClick={() => setShowAddModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg transition-colors text-sm">
          <PlusCircle className="w-4 h-4" /> بناء ملف مواطن
        </button>
        <button onClick={handleExportCSV} className="bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937] text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95 text-sm">
          <Download className="w-4 h-4 text-[#F59E0B]" /> تصدير السجل
        </button>
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو الرقم الوطني..."
            className="w-full bg-[#0B0F19] text-white border border-[#1F2937] px-10 py-2.5 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none placeholder-gray-600 text-sm"
          />
        </div>
      </div>

      {/* Database View */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-mono text-sm">لا توجد سجلات. جرب إضافة ملفات أو استوردها للشبكة الموحدة.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#0B0F19] border-b border-[#1F2937] text-gray-400 text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">الرقم الوطني</th>
                    <th className="px-4 py-3 font-semibold">الاسم الكامل</th>
                    <th className="px-4 py-3 font-semibold text-center">التصنيف</th>
                    <th className="px-4 py-3 font-semibold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {filtered.map((person) => {
                    const isBanned = person.records && person.records.some((r: any) => r.active);
                    return (
                      <tr key={person.id} className="hover:bg-[#1F2937]/30 transition-colors group">
                        <td className="px-4 py-3 font-mono text-gray-300 font-bold text-sm">{person.nationalId}</td>
                        <td
                          className="px-4 py-3 font-bold text-white cursor-pointer hover:text-[#2563EB] transition-colors"
                          onClick={() => { setActiveProfile(person); setShowProfileModal(true); }}
                        >
                          <span className="flex items-center gap-1.5">
                            {person.fullName}
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!isBanned ? (
                            <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded text-[10px] font-bold border border-[#10B981]/30">نظيف</span>
                          ) : (
                            <span className="text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded text-[10px] font-bold border border-[#EF4444]/30">مطلوب ({person.records.filter((r:any)=>r.active).length})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(person)}
                              className="text-gray-400 hover:text-white bg-[#1F2937]/50 border border-[#374151] hover:bg-[#374151] px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> {role === "ADMIN" ? "تعديل" : "طلب تعديل"}
                            </button>
                            <button
                              onClick={() => { setActiveProfile(person); setShowStudyModal(true); }}
                              className="text-blue-400 hover:text-white bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600 px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 text-xs font-bold"
                            >
                              <Files className="w-3.5 h-3.5" /> دراسة أمنية
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-[#1F2937]">
              {filtered.map((person) => {
                const isBanned = person.records && person.records.some((r: any) => r.active);
                return (
                  <div key={person.id} className={`p-4 ${isBanned ? 'border-r-2 border-r-red-500' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => { setActiveProfile(person); setShowProfileModal(true); }}
                          className="text-right w-full"
                        >
                          <p className="font-bold text-white text-base leading-tight">{person.fullName}</p>
                          <p className="font-mono text-gray-500 text-xs mt-0.5">{person.nationalId}</p>
                        </button>
                      </div>
                      <div className="shrink-0">
                        {!isBanned ? (
                          <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded text-[10px] font-bold border border-[#10B981]/30 block">نظيف</span>
                        ) : (
                          <span className="text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded text-[10px] font-bold border border-[#EF4444]/30 block">مطلوب ({person.records.filter((r:any)=>r.active).length})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEditClick(person)}
                        className="flex-1 text-gray-400 hover:text-white bg-[#1F2937]/50 border border-[#374151] hover:bg-[#374151] py-2 rounded transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> {role === "ADMIN" ? "تعديل" : "طلب تعديل"}
                      </button>
                      <button
                        onClick={() => { setActiveProfile(person); setShowStudyModal(true); }}
                        className="flex-1 text-blue-400 bg-blue-600/10 border border-blue-600/30 py-2 rounded flex items-center justify-center gap-1.5 text-xs font-bold"
                      >
                        <Files className="w-3.5 h-3.5" /> دراسة أمنية
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-2xl shadow-2xl relative max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-[#111827] z-10 flex items-center justify-between pb-4 border-b border-[#1F2937] mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"><PlusCircle className="text-[#2563EB] w-5 h-5" /> إنشاء ملف مواطن جديد</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-bold">القيد</label>
                    <input placeholder="مثال: 4/12" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm font-mono" value={formData.civilRecord} onChange={e => setFormData(p => ({ ...p, civilRecord: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-bold">الأمانة</label>
                    <input placeholder="أمانة السجل" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 text-sm" value={formData.civilRegistry} onChange={e => setFormData(p => ({ ...p, civilRegistry: e.target.value }))} />
                  </div>
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
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">التصنيف</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.type} onChange={e => setRecordData(p => ({ ...p, type: e.target.value }))}>
                        {configs.WARRANT_TYPES?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">الجهة الطالبة (الفرع)</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.branch} onChange={e => setRecordData(p => ({ ...p, branch: e.target.value }))}>
                        <option value="">بدون تحديد</option>
                        {configs.BRANCHES?.map((b: string) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-[#EF4444] block mb-1">سبب أو حيثيات القيد</label>
                      <input required placeholder="وصف التدخل الجرمي أو مصدر البرقية..." className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.reason} onChange={e => setRecordData(p => ({ ...p, reason: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">الدرجة</label>
                      <select 
                        className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" 
                        value={recordData.severity} 
                        onChange={e => setRecordData(p => ({ ...p, severity: e.target.value }))}
                      >
                        {configs.SEVERITIES?.map((s: any) => (
                           <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-2xl shadow-2xl relative max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar font-sans">
            <div className="sticky top-0 bg-[#111827] z-10 flex items-center justify-between pb-4 border-b border-[#1F2937] mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2"><Edit2 className="text-[#F59E0B] w-5 h-5" /> تعديل بيانات السجل الأمني</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdatePerson} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الرقم الوطني (محمي)</label>
                  <input readOnly className="w-full bg-[#0B0F19] text-gray-500 border border-[#1F2937] rounded p-3 font-mono opacity-60 text-sm" value={formData.nationalId} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الاسم الرباعي الكامل *</label>
                  <input required placeholder="الاسم الكامل" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">اسم الأم</label>
                  <input className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.motherName} onChange={e => setFormData(p => ({ ...p, motherName: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-bold text-amber-500">القيد</label>
                    <input placeholder="مثال: 4/12" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm font-mono" value={formData.civilRecord} onChange={e => setFormData(p => ({ ...p, civilRecord: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1 font-bold text-amber-500">الأمانة</label>
                    <input placeholder="أمانة السجل" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.civilRegistry} onChange={e => setFormData(p => ({ ...p, civilRegistry: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">تاريخ الميلاد</label>
                  <input type="date" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.dateOfBirth} onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">مكان الميلاد</label>
                  <input placeholder="المدينة/البلدة" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.placeOfBirth} onChange={e => setFormData(p => ({ ...p, placeOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">الجنس</label>
                  <select className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}>
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">العمل/المهنة</label>
                  <input placeholder="المهنة الحالية" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.job} onChange={e => setFormData(p => ({ ...p, job: e.target.value }))} />
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
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">العنوان التفصيلي</label>
                <input placeholder="البلدة - المنطقة - الشارع - رقم البناء" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">العلامات الفارقة</label>
                <input placeholder="ندبات، أوشام، إلخ" className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm" value={formData.physicalMarks} onChange={e => setFormData(p => ({ ...p, physicalMarks: e.target.value }))} />
              </div>
              <div className="text-right">
                <label className="text-xs text-gray-500 block mb-1 font-bold">وصف حر (تفاصيل إضافية / الحالة العامة)</label>
                <textarea
                  rows={4}
                  placeholder="اكتب هنا أي تفاصيل إضافية لا تغطيها الخانات أعلاه..."
                  className="w-full bg-[#0B0F19] text-white border border-[#1F2937] rounded p-3 focus:border-[#F59E0B] outline-none text-sm"
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* EXISTING RECORDS MANAGEMENT */}
              {editingRecords.length > 0 && (
                <div className="mt-8 border-t border-[#1F2937] pt-8 bg-blue-500/5 -mx-6 px-6 pb-8">
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> إدارة القيود والتعميمات القائمة ({editingRecords.filter(r => r.active).length} فعال)
                  </h3>

                  <div className="space-y-4">
                    {editingRecords.map((rec, idx) => (
                      <div key={rec.id} className={`p-4 rounded-xl border ${rec.active ? 'bg-[#0B0F19] border-[#1F2937] border-r-4 border-r-blue-500' : 'bg-gray-900/30 border-gray-800 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${rec.active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                              {rec.active ? 'قيد فعال' : 'قيد مؤرشف/ملغى'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-600">ID: {rec.id.substr(-6)}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer scale-75">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={rec.active}
                              onChange={(e) => {
                                const newRecs = [...editingRecords];
                                newRecs[idx].active = e.target.checked;
                                setEditingRecords(newRecs);
                              }}
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="text-right">
                            <label className="text-[10px] text-gray-500 block mb-1">نوع التعميم</label>
                            <select
                              className="w-full bg-[#111827] text-white border border-[#1F2937] rounded p-2 text-xs"
                              value={rec.type}
                              onChange={e => {
                                const newRecs = [...editingRecords];
                                newRecs[idx].type = e.target.value;
                                setEditingRecords(newRecs);
                              }}
                            >
                              {configs.WARRANT_TYPES?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="text-right">
                            <label className="text-[10px] text-gray-500 block mb-1">الجهة الطالبة (الفرع)</label>
                            <select
                              className="w-full bg-[#111827] text-white border border-[#1F2937] rounded p-2 text-xs"
                              value={rec.branch || ""}
                              onChange={e => {
                                const newRecs = [...editingRecords];
                                newRecs[idx].branch = e.target.value;
                                setEditingRecords(newRecs);
                              }}
                            >
                              <option value="">بدون تحديد</option>
                              {configs.BRANCHES?.map((b: string) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="text-right">
                            <label className="text-[10px] text-gray-500 block mb-1 font-bold">الدرجة</label>
                            <select
                              className="w-full bg-[#111827] text-white border border-[#1F2937] rounded p-2 text-xs"
                              value={rec.severity}
                              onChange={e => {
                                const newRecs = [...editingRecords];
                                newRecs[idx].severity = e.target.value;
                                setEditingRecords(newRecs);
                              }}
                            >
                              {configs.SEVERITIES?.map((s: any) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-2 lg:col-span-3 text-right">
                            <label className="text-[10px] text-gray-500 block mb-1">سبب القيد / حيثيات التعميم</label>
                            <textarea
                              className="w-full bg-[#111827] text-white border border-[#1F2937] rounded p-2 text-xs h-16"
                              value={rec.reason}
                              onChange={e => {
                                const newRecs = [...editingRecords];
                                newRecs[idx].reason = e.target.value;
                                setEditingRecords(newRecs);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADD NEW RECORD SECTION */}
              <div className="border border-[#1F2937] rounded-lg p-4 mt-6 bg-[#0B0F19]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#EF4444] text-lg uppercase tracking-tighter">إضافة تعميم أمني جديد</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={addRecordMode} onChange={() => setAddRecordMode(!addRecordMode)} />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EF4444]"></div>
                  </label>
                </div>

                {addRecordMode && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="text-right">
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">التصنيف</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.type} onChange={e => setRecordData(p => ({ ...p, type: e.target.value }))}>
                        {configs.WARRANT_TYPES?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="text-right">
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">الجهة الطالبة (الفرع)</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.branch} onChange={e => setRecordData(p => ({ ...p, branch: e.target.value }))}>
                        <option value="">بدون تحديد</option>
                        {configs.BRANCHES?.map((b: string) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="text-right sm:col-span-2">
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">سبب أو حيثيات القيد</label>
                      <input required placeholder="وصف التدخل الجرمي أو مصدر البرقية..." className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.reason} onChange={e => setRecordData(p => ({ ...p, reason: e.target.value }))} />
                    </div>
                    <div className="text-right sm:col-span-2">
                      <label className="text-sm text-[#EF4444] block mb-1 font-bold">الدرجة</label>
                      <select className="w-full bg-[#111827] text-white border border-[#EF4444]/30 rounded p-3" value={recordData.severity} onChange={e => setRecordData(p => ({ ...p, severity: e.target.value }))}>
                        <option value="HIGH">عالية (توقيف مباشر)</option>
                        <option value="MEDIUM">متوسطة (تدقيق أمني)</option>
                        <option value="LOW">منخفضة (مراقبة)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* EXISTING DOCUMENTS MANAGEMENT in Edit Modal */}
              {editingDocuments.length > 0 && (
                <div className="bg-[#0B0F19] border border-blue-500/20 rounded-xl p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-blue-400 flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4" /> المرفقات الحالية ({editingDocuments.length} ملف)
                    </h3>
                  </div>

                  {/* Images Grid */}
                  {editingDocuments.filter(d => d.type === 'IMAGE').length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">الصور المرفقة</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {editingDocuments.filter(d => d.type === 'IMAGE').map((doc: any) => (
                          <div key={doc.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[#1F2937] bg-[#111827]">
                            <img 
                              src={`/api/documents/${doc.id}/view`} 
                              alt={doc.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => handleDeleteEditingDocument(doc.id)}
                                className="p-1.5 bg-red-600/80 rounded-full hover:bg-red-600 transition-colors"
                                title="حذف الصورة"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                            <p className="absolute bottom-0 left-0 right-0 text-[7px] text-white/70 truncate px-1 py-0.5 bg-black/50">{doc.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Files List */}
                  {editingDocuments.filter(d => d.type !== 'IMAGE').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">ملفات أخرى</p>
                      {editingDocuments.filter(d => d.type !== 'IMAGE').map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-[#111827] rounded-lg border border-[#1F2937] group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-xs text-gray-400 truncate">{doc.name}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteEditingDocument(doc.id)}
                            className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Multi-File Upload Section in Edit Modal */}
              <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4 text-blue-500" /> إرفاق وثائق/صور إضافية للملف</h3>
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
