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
                  <th className="px-6 py-4 font-semibold">المحرر / المستخدم</th>
                  <th className="px-6 py-4 font-semibold text-center">عضوية التشكيل</th>
                  <th className="px-6 py-4 font-semibold text-center">الحالة والنشاط</th>
                  <th className="px-6 py-4 font-semibold text-center">السجل الزمني</th>
                  <th className="px-6 py-4 font-semibold text-left">التوجيه الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {users.map((user) => {
                  const isOnline = user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 5 * 60 * 1000);
                  
                  return (
                    <tr key={user.id} className="hover:bg-[#1F2937]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center border border-[#374151] text-[#2563EB] font-bold uppercase">
                              {user.username.substring(0, 2)}
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#111827] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            )}
                          </div>
                          <div className="mr-3">
                            <p className="text-sm font-bold text-white font-mono">{user.username}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">ID: {user.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#1F2937] text-gray-400 border border-[#374151] uppercase tracking-widest">
                          {user.role === "CHECKPOINT" ? "حاجز" : (user.role === "ADMIN" ? "إدارة" : "بيانات")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          {isOnline ? (
                            <span className="text-[10px] font-black text-green-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> متصل الآن
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600">
                              {user.lastActive ? `آخر ظهور: ${new Date(user.lastActive).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}` : "لم يظهر بعد"}
                            </span>
                          )}
                          <div className="mt-1">
                            {user.status === "PENDING" && <span className="text-[9px] text-amber-500 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">قيد المراجعة</span>}
                            {user.status === "ACTIVE" && <span className="text-[9px] text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">نقطة فعالة</span>}
                            {user.status === "SUSPENDED" && <span className="text-[9px] text-red-500 font-bold px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">موقوف</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[10px] text-gray-400 font-mono">
                          <p title="آخر تسجيل دخول رسمي"><span className="text-gray-600 mr-1">LOGIN:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString("ar-SA") : "—"}</p>
                          <p title="تاريخ إنشاء الحساب"><span className="text-gray-600 mr-1">JOINED:</span> {new Date(user.createdAt).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm font-medium">
                        <AdminUserActions userId={user.id} status={user.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
