import { prisma } from "@/lib/prisma";
import { CheckCircle, XCircle, Clock, ShieldAlert } from "lucide-react";
import AdminUserActions from "./AdminUserActions"; // Client component for buttons

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let users: any[] = [];
  let dbError = false;

  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">إدارة المستخدمين والتصاريح</h1>
          <p className="text-gray-400 text-sm">مراجعة المنضمين للنظام وتحديد صلاحياتهم الأمنية.</p>
        </div>
        <div className="bg-[#2563EB]/10 p-4 rounded-full border border-[#2563EB]/30">
          <ShieldAlert className="w-8 h-8 text-[#2563EB]" />
        </div>
      </div>

      {dbError && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 text-[#EF4444] text-center font-bold">
          تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات الاتصال (DATABASE_URL).
        </div>
      )}

      {!dbError && users.length === 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center text-gray-400">
          لا يوجد أي مستخدمين مسجلين في النظام.
        </div>
      )}

      {users.length > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-[#0B0F19] border-b border-[#1F2937] text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">المعرف / المستخدم</th>
                  <th className="px-6 py-4 font-semibold text-center">عضوية التشكيل (الدور)</th>
                  <th className="px-6 py-4 font-semibold text-center">تاريخ الطلب</th>
                  <th className="px-6 py-4 font-semibold text-center">الحالة الأمنية</th>
                  <th className="px-6 py-4 font-semibold text-left">التوجيه الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1F2937]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-3">
                          <p className="text-sm font-bold text-white font-mono">{user.username}</p>
                          <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1F2937] text-gray-300 border border-[#374151]">
                        {user.role === "CHECKPOINT" ? "حاجز / نقطة تفتيش" : (user.role === "ADMIN" ? "إدارة عليا" : "إدخال بيانات")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-400 font-mono">
                      {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.status === "PENDING" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/50 animate-pulse">
                          <Clock className="w-3 h-3 ml-1" />
                          قيد المراجعة
                        </span>
                      )}
                      {user.status === "ACTIVE" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          نقطة فعالة
                        </span>
                      )}
                      {user.status === "SUSPENDED" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50">
                          <XCircle className="w-3 h-3 ml-1" />
                          حساب موقوف
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left whitespace-nowrap text-sm font-medium">
                      <AdminUserActions userId={user.id} status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
