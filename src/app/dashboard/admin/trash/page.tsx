import { prisma } from "@/lib/prisma";
import { Trash2, AlertOctagon, RotateCcw, ShieldCheck } from "lucide-react";
import TrashActions from "./TrashActions";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  let deletedPeople: any[] = [];
  let deletedRecords: any[] = [];
  let dbError = false;

  try {
    deletedPeople = await prisma.person.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" }
    });

    deletedRecords = await prisma.securityRecord.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" }
    });
  } catch (error) {
    dbError = true;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#F59E0B] border-b-4 rounded-xl p-6 shadow-lg flex justify-between items-center transition-all">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">سلة المحذوفات المركزية (Elite Trash)</h1>
          <p className="text-gray-400 text-sm">كافة الملفات المحذوفة تبقى هنا، فقط القيادة العليا تملك صلاحية استعادتها أو إتلافها بالكامل.</p>
        </div>
        <div className="bg-[#F59E0B]/10 p-4 rounded-full border border-[#F59E0B]/30 animate-pulse">
          <Trash2 className="w-8 h-8 text-[#F59E0B]" />
        </div>
      </div>

      {dbError ? (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 text-[#EF4444] text-center font-bold">
          تعذر الاتصال بقاعدة البيانات. السجل غير متاح.
        </div>
      ) : (deletedPeople.length === 0 && deletedRecords.length === 0) ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-16 text-center text-gray-500 shadow-inner">
          <AlertOctagon className="w-16 h-16 mx-auto mb-4 opacity-10" />
          سلة المحذوفات فارغة. لا توجد قضايا أو أفراد محذوفين حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deleted People */}
          <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 shadow-inner relative overflow-hidden flex flex-col h-full">
            <h3 className="text-[#F59E0B] font-bold text-xl mb-4 border-b border-[#F59E0B]/30 pb-2 flex items-center gap-2">
               <Users className="w-5 h-5" /> الأشخاص المحذوفين
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {deletedPeople.map((person) => (
                <div key={person.id} className="bg-[#111827] border border-[#374151] p-4 rounded-lg hover:border-blue-500/50 transition-colors group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold group-hover:text-blue-400">{person.fullName}</span>
                    <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded">{person.id.substring(0,8)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">{person.nationalId}</p>
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#1F2937]">
                    <span className="text-[10px] text-gray-500">حُذف في: {new Date(person.deletedAt).toLocaleDateString("ar-SA")}</span>
                    <TrashActions id={person.id} type="person" />
                  </div>
                </div>
              ))}
              {deletedPeople.length === 0 && <p className="text-gray-600 text-sm text-center py-4">لا يوجد أشخاص محذوفين.</p>}
            </div>
          </div>

          {/* Deleted Records */}
          <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 shadow-inner relative overflow-hidden flex flex-col h-full">
             <h3 className="text-[#F59E0B] font-bold text-xl mb-4 border-b border-[#F59E0B]/30 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> القيود الأمنية المحذوفة
             </h3>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
              {deletedRecords.map((record) => (
                <div key={record.id} className="bg-[#111827] border border-l-4 border-[#374151] border-l-[#EF4444] p-4 rounded-lg hover:bg-[#1F2937]/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-bold text-xs leading-relaxed line-clamp-2">{record.reason}</span>
                    <span className="text-[10px] bg-[#EF4444] text-white px-2 py-0.5 rounded font-bold whitespace-nowrap">{record.type}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 border-t border-[#1F2937] pt-2">
                     <span className="text-[10px] text-gray-500">حُذف في: {new Date(record.deletedAt).toLocaleDateString("ar-SA")}</span>
                     <TrashActions id={record.id} type="record" />
                  </div>
                </div>
              ))}
              {deletedRecords.length === 0 && <p className="text-gray-600 text-sm text-center py-4">لا يوجد قيود أمنية محذوفة.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Users, ShieldAlert } from "lucide-react";
