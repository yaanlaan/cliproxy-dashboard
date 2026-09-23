import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bg = "bg-slate-900 border-slate-800 text-slate-200";
        let Icon = Info;
        let iconColor = "text-brand-400";

        if (toast.type === "success") {
          bg = "bg-emerald-950/90 border-emerald-800/60 text-emerald-200";
          Icon = CheckCircle2;
          iconColor = "text-emerald-400";
        } else if (toast.type === "error") {
          bg = "bg-rose-950/90 border-rose-800/60 text-rose-200";
          Icon = AlertCircle;
          iconColor = "text-rose-400";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
            <p className="text-xs font-medium leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
