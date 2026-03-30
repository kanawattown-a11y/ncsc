"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, User, FileEdit } from "lucide-react";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
      } else {
        const error = await res.json();
        alert("خطأ: " + error.error);
      }
    } catch (err) {
      alert("حدث خطأ تقني أثناء معالجة الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">جاري تحميل الطلبات العالقة...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">مراجعة واعتماد طلبات التعديل</h1>
        <p className="text-gray-400 text-sm">قم بتدقيق التغييرات المقترحة من مدخلي البيانات قبل اعتمادها في السجل الوطني.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center text-gray-500">
           <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
           لا توجد طلبات تعديل معلقة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req) => {
            let changes: any = {};
            try { changes = JSON.parse(req.proposedChanges); } catch (e) { console.error("Parse error", e); }
            
            return (
              <div key={req.id} className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4">
                <div className="bg-[#1F2937]/50 p-4 border-b border-[#1F2937] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#2563EB]/20 p-2 rounded-lg">
                       <User className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">مقدم الطلب: {req.dataEntry?.username || "غير معروف"}</p>
                      <p className="text-gray-400 text-[10px]">{new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleDecision(req.id, "REJECTED")}
                      className="flex-1 md:flex-none bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleDecision(req.id, "APPROVED")}
                      className="flex-1 md:flex-none bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> اعتماد التعديل
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-[#F59E0B] font-bold mb-4 flex items-center gap-2 text-sm uppercase">
                    <FileEdit className="w-4 h-4" /> التعديلات المقترحة لملف المواطن ID: {req.entityId}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(changes).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-[#0B0F19] p-4 rounded-lg border border-[#1F2937] text-right">
                        <p className="text-gray-500 text-[10px] mb-1 font-bold uppercase">{key}</p>
                        <p className="text-white text-sm font-mono break-words">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
