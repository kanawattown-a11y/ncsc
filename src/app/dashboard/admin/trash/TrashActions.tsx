"use client";

import { RotateCcw, ShieldCheck } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrashActions({ id, type }: { id: string; type: "person" | "record" }) {
  const { showToast } = useToast();
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/admin/trash/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type })
      });

      if (res.ok) {
        showToast("تمت استعادة السجل بنجاح إلى قاعدة البيانات النشطة.", "success");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "فشلت عملية الاستعادة.", "error");
      }
    } catch (err) {
      showToast("حدث خطأ تقني غير متوقع.", "error");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <button 
      onClick={handleRestore}
      disabled={isRestoring}
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 
      ${type === 'person' 
        ? 'bg-[#2563EB]/20 text-[#2563EB] hover:bg-[#2563EB] hover:text-white' 
        : 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981] hover:text-white'
      }`}
    >
      {isRestoring ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        type === "person" ? <><RotateCcw className="w-4 h-4" /> استعادة الملف</> : <><ShieldCheck className="w-4 h-4" /> العفو والاستعادة</>
      )}
    </button>
  );
}
