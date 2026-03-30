"use client";

import { useSession } from "next-auth/react";
import { Shield, Search, Users, AlertOctagon } from "lucide-react";

export default function DashboardHomePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none"></div>
        <h1 className="text-2xl font-bold text-white relative z-10">
          مرحباً بك في القيادة الآمنة، {(session?.user as any)?.username || "المعرف"}
        </h1>
        <p className="text-gray-400 mt-2 relative z-10">
          النظام متصل وآمن. يرجى الانتباه من أن جميع العمليات مسجلة ومرصودة في السجل الأمني الموحد.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#2563EB]/50 transition-colors">
          <div className="bg-[#2563EB]/10 p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h3 className="text-xl font-bold text-white">1,492</h3>
          <p className="text-sm text-gray-400 mt-1">عملية تفتيش اليوم</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#10B981]/50 transition-colors">
          <div className="bg-[#10B981]/10 p-4 rounded-full mb-4">
            <Shield className="w-8 h-8 text-[#10B981]" />
          </div>
          <h3 className="text-xl font-bold text-white">موثوق</h3>
          <p className="text-sm text-gray-400 mt-1">حالة الاتصال بالخوادم</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#F59E0B]/50 transition-colors">
          <div className="bg-[#F59E0B]/10 p-4 rounded-full mb-4">
            <Users className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <h3 className="text-xl font-bold text-white">8</h3>
          <p className="text-sm text-gray-400 mt-1">حواجز نشطة ميدانياً</p>
        </div>

        <div className="bg-[#111827] border border-[#EF4444]/30 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-shadow">
          <div className="bg-[#EF4444]/10 p-4 rounded-full mb-4 animate-pulse">
            <AlertOctagon className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h3 className="text-xl font-bold text-white">3</h3>
          <p className="text-sm text-gray-400 mt-1">تنبيهات أمنية حديثة</p>
        </div>
      </div>
    </div>
  );
}
