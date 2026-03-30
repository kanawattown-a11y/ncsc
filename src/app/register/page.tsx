"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, AlertTriangle, CheckCircle, Briefcase } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CHECKPOINT");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "حدث خطأ غير معروف");
      } else {
        setSuccess(data.message);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err) {
      setError("تعذر الاتصال بالخادم الداخلي");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10B981] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#2563EB] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#0B0F19] p-4 rounded-full border border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.4)] relative">
            <img
              src="/logo.png"
              alt="NCSC"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/public/logo.png';
              }}
            />
            <div className="absolute inset-0 rounded-full bg-[#10B981]/10 animate-pulse"></div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white tracking-wider text-center">تقديم طلب وصول</h1>
          <p className="text-gray-400 mt-2 text-sm text-center">الخط الساخن لتسجيل الحواجز ومدخلي البيانات للمراجعة</p>
          <div className="h-1 w-20 bg-gradient-to-r from-[#10B981] to-[#2563EB] mt-4 rounded-full"></div>
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 mb-6 flex items-start space-x-3 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <p className="text-[#EF4444] text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/50 rounded-lg p-4 mb-6 flex items-start space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            <p className="text-[#10B981] text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">نقطة التفتيش / المعرف</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all duration-300"
                placeholder="أدخل المعرف المراد اعتماده"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">القسم المطلوب (الدور)</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-500" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg py-3 pr-10 pl-4 appearance-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all duration-300"
              >
                <option value="CHECKPOINT">أمن الحواجز والمطابقة (نقطة تفتيش)</option>
                <option value="DATA_ENTRY">قسم الإدخال والأرشفة والتعديلات</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">إنشاء رمز عبور (Password)</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all duration-300 font-mono tracking-widest"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 mr-2">يجب أن يتكون الرمز من 8 خانات على الأقل</p>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>إرسال الطلب الآمن للقيادة</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#1F2937] pt-6">
          <p className="text-sm text-gray-400">
            لديك تصريح مسبق؟{" "}
            <Link href="/login" className="text-[#10B981] hover:text-[#34D399] font-medium transition-colors">
              العودة لشاشة الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
