import { prisma } from "@/lib/prisma";
import { ShieldAlert, Terminal, Clock, Fingerprint } from "lucide-react";
import AuditLogItem from "./AuditLogItem";
import AuditLogsClient from "./AuditLogsClient";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  let logs: any[] = [];
  let dbError = false;

  try {
    logs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { timestamp: "desc" },
      take: 200, // Increased capacity for elite monitoring
    });
  } catch (error) {
    dbError = true;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="bg-[#111827] border border-[#1C2533] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#EF4444] to-transparent"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 text-right">
          <div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tighter flex items-center gap-2">
               <Fingerprint className="w-8 h-8 text-[#EF4444]" /> السجل الرقابي الموحد (Elite Audit)
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <p className="text-gray-500 text-xs font-sans uppercase">مراقبة دقيقة لكل بايت يتغير في المنظومة لضمان النزاهة المطلقة.</p>
              {!dbError && logs.length > 0 && <AuditLogsClient logs={logs} />}
            </div>
          </div>
          <div className="bg-[#EF4444]/5 p-4 rounded-full border border-[#EF4444]/20 ring-4 ring-[#EF4444]/5">
            <Terminal className="w-8 h-8 text-[#EF4444] animate-pulse" />
          </div>
        </div>
      </div>

      {dbError ? (
        <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-8 text-red-500 text-center">
           <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
           <p className="font-bold">فشل الاتصال بجهاز الرقابة المركزي. يرجى التحقق من اتصال قاعدة البيانات.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-20 text-center text-gray-600 shadow-inner">
          <Clock className="w-16 h-16 mx-auto mb-6 opacity-10" />
          السجل خالي تماماً. لا توجد عمليات مسجلة حالياً.
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:right-8 before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-[#EF4444]/40 before:to-transparent pr-4 md:pr-0">
          {logs.map((log) => (
            <div key={log.id} className="relative pr-12 md:pr-0">
               <div className="absolute top-6 right-0 w-8 h-[2px] bg-[#EF4444]/40 hidden md:block"></div>
               <AuditLogItem log={log} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
