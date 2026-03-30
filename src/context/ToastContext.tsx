"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[350px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-full fade-in duration-300 relative overflow-hidden group
            ${toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : ""}
            ${toast.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : ""}
            ${toast.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" : ""}
            ${toast.type === "info" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : ""}
            `}
          >
            <div className="flex-shrink-0">
              {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
              {toast.type === "error" && <XCircle className="w-5 h-5" />}
              {toast.type === "warning" && <AlertCircle className="w-5 h-5" />}
              {toast.type === "info" && <Info className="w-5 h-5" />}
            </div>
            <p className="text-sm font-bold flex-1 text-right font-sans">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div 
              className={`absolute bottom-0 right-0 h-1 bg-current opacity-30 transition-all duration-[4000ms] ease-linear w-full group-hover:opacity-100`}
              style={{ animation: 'progress-bar 4s linear' }}
            ></div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes progress-bar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
