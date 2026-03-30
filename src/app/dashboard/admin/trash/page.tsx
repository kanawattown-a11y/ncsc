import { prisma } from "@/lib/prisma";
import { Trash2, AlertOctagon, RotateCcw, ShieldCheck } from "lucide-react";

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
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] border-b-[#F59E0B] border-b-4 rounded-xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">سلة المحذوفات المركزية (Soft Delete Area)</h1>
          <p className="text-gray-400 text-sm">كافة الملفات المحذوفة تبقى هنا، فقط القيادة العليا تملك صلاحية استعادتها أو إتلافها بالكامل.</p>
        </div>
        <div className="bg-[#F59E0B]/10 p-4 rounded-full border border-[#F59E0B]/30">
          <Trash2 className="w-8 h-8 text-[#F59E0B]" />
        </div>
      </div>

      {dbError ? (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 text-[#EF4444] text-center font-bold">
          تعذر الاتصال بقاعدة البيانات. السجل غير متاح.
        </div>
      ) : (deletedPeople.length === 0 && deletedRecords.length === 0) ? (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center text-gray-400">
          سلة المحذوفات فارغة. لا توجد قضايا أو أفراد محذوفين حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deleted People */}
          <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 shadow-inner relative overflow-hidden">
            <h3 className="text-[#F59E0B] font-bold text-xl mb-4 border-b border-[#F59E0B]/30 pb-2">الأشخاص المحذوفين</h3>
            <div className="space-y-3">
              {deletedPeople.map((person) => (
                <div key={person.id} className="bg-[#111827] border border-[#374151] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold">{person.fullName}</span>
                    <span className="text-sm font-mono text-gray-400">{person.nationalId}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-gray-500">حُذف في: {new Date(person.deletedAt).toLocaleDateString("ar-SA")}</span>
                    <button className="flex items-center gap-1 bg-[#2563EB]/20 text-[#2563EB] px-3 py-1 rounded text-sm hover:bg-[#2563EB] hover:text-white transition-colors">
                      <RotateCcw className="w-4 h-4" /> استعادة
                    </button>
                  </div>
                </div>
              ))}
              {deletedPeople.length === 0 && <p className="text-gray-600 text-sm text-center py-4">لا يوجد أشخاص محذوفين.</p>}
            </div>
          </div>

          {/* Deleted Records */}
          <div className="bg-[#0B0F19] border border-[#1F2937] rounded-xl p-6 shadow-inner relative overflow-hidden">
             <h3 className="text-[#F59E0B] font-bold text-xl mb-4 border-b border-[#F59E0B]/30 pb-2">القيود الأمنية والجنائية المحذوفة</h3>
             <div className="space-y-3">
              {deletedRecords.map((record) => (
                <div key={record.id} className="bg-[#111827] border border-l-4 border-[#374151] border-l-[#EF4444] p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-bold text-sm leading-relaxed">{record.reason}</span>
                    <span className="text-[10px] bg-[#EF4444] text-white px-2 py-0.5 rounded font-bold whitespace-nowrap">{record.type}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 border-t border-[#1F2937] pt-2">
                     <span className="text-xs text-gray-500">حُذف في: {new Date(record.deletedAt).toLocaleDateString("ar-SA")}</span>
                     <button className="flex items-center gap-1 bg-[#10B981]/20 text-[#10B981] px-3 py-1 rounded text-sm hover:bg-[#10B981] hover:text-white transition-colors">
                       <ShieldCheck className="w-4 h-4" /> العفو والاستعادة
                     </button>
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
