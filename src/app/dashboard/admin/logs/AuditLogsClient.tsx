"use client";

import { Download } from "lucide-react";

export default function AuditLogsClient({ logs }: { logs: any[] }) {
  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "User", "Action", "Entity", "EntityID", "Details"];
    const rows = logs.map(log => [
       log.id,
       new Date(log.timestamp).toISOString(),
       log.user?.username || "Unknown",
       log.action,
       log.entity,
       log.entityId || "",
       (log.details || "").replace(/,/g, ";").replace(/\n/g, " ")
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NCSC_Audit_Logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExportCSV}
      className="bg-[#111827] border border-[#EF4444]/30 hover:bg-[#EF4444] hover:text-white text-[#EF4444] px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-lg active:scale-95"
    >
      <Download className="w-4 h-4" /> تصدير السجل بصيغة CSV (Excel)
    </button>
  );
}
