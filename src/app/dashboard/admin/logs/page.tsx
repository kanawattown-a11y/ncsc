import { prisma } from "@/lib/prisma";
import { ShieldAlert, Terminal, Clock, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  let logs: any[] = [];
  let dbError = false;

  try {
    logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: "desc" },
      take: 100, // Show last 100 logs
    });
  } catch (error) {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">السجل الأمني الموحد (Audit Logs)</h1>
          <p className="text-gray-400 text-sm">مراقبة جميع تحركات الكوادر وحركات النوافذ على الشبكة بشكل لحظي وغير قابل للمسح.</p>
        </div>
        <div className="bg-[#EF4444]/10 p-4 rounded-full border border-[#EF4444]/30">
          <Terminal className="w-8 h-8 text-[#EF4444]" />
        </div>
      </div>

      {dbError ? (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 text-[#EF4444] text-center font-bold">
          تعذر الاتصال بقاعدة البيانات.
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center text-gray-400">
          السجل خالي. لم يتم رصد أي عمليات حتى الآن.
        </div>
      ) : (
        <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl overflow-hidden shadow-lg p-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="bg-[#111827] border-l-2 border-[#2563EB] p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <ShieldAlert className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-mono">{log.action}</h4>
                    <p className="text-sm text-gray-400 mt-1">الكيان: {log.entity} | المعرف: {log.entityId || "N/A"}</p>
                    {log.details && (
                       <pre className="text-xs text-amber-500 mt-2 bg-[#0B0F19] p-2 rounded">{log.details}</pre>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end border-r border-[#1F2937] pr-4 rtl:border-l rtl:border-r-0 rtl:pl-4 rtl:pr-0">
                  <span className="flex items-center gap-1 text-sm text-[#2563EB] font-bold">
                    <User className="w-4 h-4" /> {log.user.username}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-mono">
                    <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString("ar-SA")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
