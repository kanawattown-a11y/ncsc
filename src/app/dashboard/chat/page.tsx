"use client";

import { useSession } from "next-auth/react";
import { Send, Shield, Radio, ShieldAlert, Users, Lock, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(data.messages || []);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg("تعذر الاتصال بخوادم القيادة المركزية. (قاعدة البيانات غير متصلة)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempMsg = {
      id: "temp-" + Date.now(),
      sender: (session?.user as any)?.username,
      senderRole: (session?.user as any)?.role,
      text: input,
      time: "الآن",
      isPrivate: false
    };

    setMessages([...messages, tempMsg]);
    const currentInput = input;
    setInput("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentInput, receiverId: null }) // General text for now
      });
      fetchMessages();
    } catch (err) {
      setErrorMsg("فشل الإرسال، تحقق من الاتصال.");
    }
  };

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] sm:h-[calc(100vh-8rem)]">
      <div className="bg-[#111827] border border-[#1F2937] rounded-t-xl p-3 sm:p-4 flex justify-between items-center z-10 shadow-md gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="bg-[#10B981]/20 p-1.5 sm:p-2 rounded-full border border-[#10B981]/50 animate-pulse shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-xl font-bold text-white tracking-widest truncate">غرفة عمليات الاتصال</h2>
            <p className="text-[9px] sm:text-xs text-[#10B981] font-mono hidden xs:block">تشفير ميداني نَشِط</p>
          </div>
        </div>
        {isAdmin && (
           <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 text-[#EF4444] shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              <span className="text-[9px] sm:text-xs font-bold hidden sm:block">وضع المراقبة الشاملة مفعل</span>
              <span className="text-[9px] font-bold sm:hidden">مراقبة</span>
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0B0F19] border-x border-[#1F2937] p-3 sm:p-6 space-y-3 sm:space-y-4">
        {loading && (
          <div className="flex justify-center items-center h-full text-[#2563EB]">
             <span className="w-8 h-8 border-4 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin"></span>
          </div>
        )}
        
        {errorMsg && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-3 animate-pulse" />
            <p className="text-[#EF4444] font-bold">{errorMsg}</p>
          </div>
        )}

        {!loading && messages.length === 0 && !errorMsg && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p>الغرفة فارغة. لا توجد رسائل مسجلة في السيرفر.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender === (session?.user as any)?.username;
          const isSenderAdmin = msg.senderRole === "ADMIN";
          const isPrivate = msg.isPrivate;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[90%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 relative overflow-hidden backdrop-blur-sm shadow-md border 
                ${isMe 
                  ? 'bg-[#2563EB]/10 border-[#2563EB]/50 text-white rounded-br-none' 
                  : (isSenderAdmin 
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/50 rounded-bl-none text-white' 
                      : 'bg-[#111827] border-[#374151] rounded-bl-none text-gray-200'
                    )
                }
                ${isPrivate ? 'ring-2 ring-[#F59E0B]' : ''}
                `}
              >
                <div className="flex justify-between items-center mb-1.5 gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] sm:text-xs font-bold font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${isSenderAdmin ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#1F2937] text-gray-400'}`}>
                      {isSenderAdmin ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {msg.sender}
                    </span>
                    {isPrivate && (
                      <span className="text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/50 px-1 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> خاص
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono shrink-0">{msg.time}</span>
                </div>
                <p className="text-sm leading-relaxed break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-b-xl p-3 sm:p-4 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            disabled={!!errorMsg}
            onChange={(e) => setInput(e.target.value)}
            placeholder={errorMsg ? "تعذّر الاتصال" : "أدخل رسالتك..."}
            className="flex-1 bg-[#0B0F19] border border-[#1F2937] text-white rounded-lg px-3 sm:px-4 py-2.5 focus:ring-2 focus:ring-[#10B981] focus:outline-none placeholder-gray-600 transition-shadow disabled:opacity-50 text-sm min-w-0"
          />
          <button 
            type="submit"
            disabled={!input.trim() || !!errorMsg}
            className="bg-[#10B981] hover:bg-[#059669] text-white p-2.5 sm:p-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0 w-11 sm:w-12"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 rtl:scale-x-[-1]" />
          </button>
        </form>
      </div>
    </div>
  );
}
