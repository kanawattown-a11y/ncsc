"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563EB] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#10B981] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#0B0F19] p-4 rounded-full border border-[#2563EB] shadow-[0_0_20px_rgba(37,99,235,0.4)] relative">
            <img
              src="/logo.png"
              alt="NCSC"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/public/logo.png';
              }}
            />
            <div className="absolute inset-0 rounded-full bg-[#2563EB]/10 animate-ping"></div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white tracking-wider text-center">النظام الأمني الوطني</h1>
          <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-semibold">National Criminal & Security Clearance</p>
          <div className="h-1 w-20 bg-gradient-to-r from-[#2563EB] to-[#10B981] mt-4 rounded-full"></div>
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg p-4 mb-6 flex items-start space-x-3 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <p className="text-[#EF4444] text-sm">{error}</p>
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
                className="w-full bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-300"
                placeholder="أدخل معرف الوصول المعتمد"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">رمز المرور السري</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg py-3 pr-10 pl-4 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all duration-300 font-mono tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e3a8a] text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>تسجيل الدخول الآمن</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#1F2937] pt-6 relative">
          <p className="text-xs text-gray-500 mb-4">الدخول مقيد للمصرح لهم فقط. كل العمليات مسجلة ومراقبة.</p>
          <p className="text-sm text-gray-400">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-[#2563EB] hover:text-[#3B82F6] font-medium transition-colors">
              تقديم طلب انضمام
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
