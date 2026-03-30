import { prisma } from "@/lib/prisma";
import { Database } from "lucide-react";
import DataEntryClient from "@/components/DataEntryClient";

export const dynamic = "force-dynamic";

export default async function DataEntryPage() {
  let people: any[] = [];
  let dbError = false;

  try {
    people = await prisma.person.findMany({
      include: { records: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">إدارة البيانات والمستندات المشفرة</h1>
          <p className="text-gray-400 text-sm">أضف القيود فوراً وارفع مستندات الإدانة (PDF/صور) مباشرة لخزائن S3.</p>
        </div>
        <div className="bg-[#10B981]/10 p-4 rounded-full border border-[#10B981]/30">
          <Database className="w-8 h-8 text-[#10B981]" />
        </div>
      </div>

      {dbError ? (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 text-[#EF4444] text-center font-bold mb-4">
          تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات الاتصال.
        </div>
      ) : (
        <DataEntryClient initialData={people} />
      )}
    </div>
  );
}
