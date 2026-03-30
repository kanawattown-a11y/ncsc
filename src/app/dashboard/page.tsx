"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Shield, Search, Users, AlertOctagon, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { SecurityPieChart, SecurityBarChart } from "@/components/CustomCharts";

import { Skeleton, CardSkeleton } from "@/components/SkeletonLoader";

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch("/api/analytics");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error("Analytics poll error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Tactical Polling: Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB] rounded-full mix-blend-screen filter blur-[80px] opacity-10 pointer-events-none"></div>
        <h1 className="text-2xl font-bold text-white relative z-10">
          مرحباً بك في القيادة الآمنة، {(session?.user as any)?.username || "المعرف"}
        </h1>
        <p className="text-gray-400 mt-2 relative z-10 font-sans">
          النظام متصل وآمن. يرجى الانتباه من أن جميع العمليات مسجلة ومرصودة في السجل الأمني الموحد.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="bg-[#2563EB]/10 p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-[#2563EB]" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">{data?.counters?.total || 0}</h3>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">إجمالي السجلات</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="bg-[#10B981]/10 p-4 rounded-full mb-4">
            <Shield className="w-8 h-8 text-[#10B981]" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">{data?.counters?.banned || 0}</h3>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">مطلوبين أمنياً</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
          <div className="bg-[#F59E0B]/10 p-4 rounded-full mb-4">
            <Users className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">{data?.counters?.checkpoints || 0}</h3>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">نقاط تفتيش فعالة</p>
        </div>

        <div className="bg-[#111827] border border-[#EF4444]/30 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <div className="bg-[#EF4444]/10 p-4 rounded-full mb-4 animate-pulse">
            <AlertOctagon className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono">{data?.counters?.alerts || 0}</h3>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">بلاغات قيد الاعتماد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl h-full flex flex-col">
           <h3 className="text-white font-bold mb-6 flex items-center gap-2">
             <PieChart className="w-5 h-5 text-[#2563EB]" /> تصنيف القيود الأمنية (توزيع الأنواع)
           </h3>
           <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6">
              <SecurityPieChart data={data?.distribution || []} />
              <div className="grid grid-cols-2 gap-4 text-right">
                {data?.distribution?.map((d: any, i: number) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{d.name}</span>
                    <span className="text-white font-bold font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl h-full flex flex-col">
           <h3 className="text-white font-bold mb-6 flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-[#10B981]" /> نشاط إضافة السجلات (آخر 7 أيام)
           </h3>
           <div className="flex-1 flex items-end w-full">
              <SecurityBarChart data={data?.weekly || []} />
           </div>
           <div className="mt-4 pt-4 border-t border-[#1F2937] flex justify-between items-center text-xs">
              <span className="text-gray-500">حالة التحديث: <span className="text-[#10B981]">فوري</span></span>
              <span className="flex items-center gap-1 text-gray-300 font-bold"><TrendingUp className="w-3 h-3 text-[#10B981]" /> {data?.counters?.total || 0} سجل مخزن ومؤمن</span>
           </div>
        </div>
      </div>
    </div>
  );
}
