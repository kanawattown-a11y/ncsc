"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserActions({ userId, status }: { userId: string, status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = async (action: "ACTIVE" | "SUSPENDED") => {
    // We would fetch API here
    // Example: fetch(`/api/admin/users/${userId}/status`, { method: "PUT", body: JSON.stringify({ status: action }) })
    // For now we just mock the reload to not crash.
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      {status === "PENDING" && (
        <div className="flex items-center space-x-2 space-x-reverse justify-end">
          <button 
            disabled={isPending}
            onClick={() => handleAction("ACTIVE")}
            className="bg-[#10B981] disabled:opacity-50 hover:bg-[#059669] text-white px-3 py-1.5 rounded transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          >
            اعتماد الوصول
          </button>
          <button 
            disabled={isPending}
            onClick={() => handleAction("SUSPENDED")}
            className="bg-transparent disabled:opacity-50 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white px-3 py-1.5 rounded transition-colors"
          >
            تجميد
          </button>
        </div>
      )}
      {status === "ACTIVE" && (
        <button 
          disabled={isPending}
          onClick={() => handleAction("SUSPENDED")}
          className="bg-[#EF4444]/10 disabled:opacity-50 text-[#EF4444] hover:bg-[#EF4444] hover:text-white px-4 py-1.5 rounded transition-colors w-full md:w-auto flex ml-auto"
        >
          إلغاء الترخيص
        </button>
      )}
      {status === "SUSPENDED" && (
        <button 
          disabled={isPending}
          onClick={() => handleAction("ACTIVE")}
          className="bg-[#1F2937] disabled:opacity-50 text-gray-300 hover:bg-[#374151] px-4 py-1.5 rounded transition-colors w-full md:w-auto flex ml-auto"
        >
          إعادة التفعيل
        </button>
      )}
    </>
  );
}
