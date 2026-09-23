import React, { useState, useEffect, useRef } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import {
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Globe,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

interface OAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  {
    id: "claude",
    name: "Claude Code",
    desc: "Anthropic Claude Code OAuth 授权（支持 Fable/Sonnet/Opus）",
    color: "from-amber-600 to-orange-500",
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    desc: "OpenAI 订阅账号授权（ChatGPT Plus / Pro / GPT-5 系列）",
    color: "from-emerald-600 to-teal-500",
  },
  {
    id: "antigravity",
    name: "Google Antigravity",
    desc: "Google Gemini Advanced / Antigravity Web 后端授权",
    color: "from-sky-600 to-blue-500",
  },
  {
    id: "kimi",
    name: "Moonshot Kimi",
    desc: "Kimi.com / Kimi.ai Code 订阅授权（Kimi K3 / K2.7 Code）",
    color: "from-blue-600 to-indigo-500",
  },
  {
    id: "xai",
    name: "xAI Grok",
    desc: "xAI Grok Build 授权（Grok 4.5 / Grok Composer）",
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "devin",
    name: "Devin AI",
    desc: "Devin 开发者工作流授权",
    color: "from-teal-600 to-cyan-500",
  },
];

export const OAuthModal: React.FC<OAuthModalProps> = ({ isOpen, onClose }) => {
  const { addToast, refreshAll } = useApp();
  const [selectedProvider, setSelectedProvider] = useState<string>("claude");
  const [step, setStep] = useState<"select" | "authenticating" | "success" | "error">("select");
  const [authUrl, setAuthUrl] = useState<string>("");
  const [userCode, setUserCode] = useState<string>("");
  const [pastedCallbackUrl, setPastedCallbackUrl] = useState<string>("");
  const [submittingCallback, setSubmittingCallback] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setStep("select");
      setAuthUrl("");
      setUserCode("");
      setPastedCallbackUrl("");
      setSubmittingCallback(false);
      setCopiedCode(false);
      setStatusMessage("");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAuth = async () => {
    setLoading(true);
    setStatusMessage("正在获取授权链接...");
    try {
      const res = await api.getOAuthUrl(selectedProvider);
      const url = res.url || res.auth_url || "";
      if (!url) {
        throw new Error(res.error || "未返回有效的 OAuth 授权地址");
      }

      setAuthUrl(url);
      if (res.user_code) {
        setUserCode(res.user_code);
      }

      setStep("authenticating");
      setStatusMessage("正在等待授权完成...");

      // Automatically open browser window
      window.open(url, "_blank");

      // Start polling status
      pollTimerRef.current = window.setInterval(async () => {
        try {
          const statusRes = await api.getAuthStatus();
          if (statusRes.status === "success" || statusRes.status === "completed") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setStep("success");
            setStatusMessage("授权成功！凭据已自动写入账号池。");
            addToast("success", `【${selectedProvider}】账号授权成功！`);
            await refreshAll();
            setTimeout(() => {
              onClose();
            }, 1800);
          } else if (statusRes.status === "failed" || statusRes.status === "error") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setStep("error");
            setStatusMessage(statusRes.message || statusRes.error || "授权失败，请重试");
          }
        } catch {
          // ignore transient polling errors
        }
      }, 1500);
    } catch (e: any) {
      setStep("error");
      if (e.message?.includes("404")) {
        setStatusMessage("请求失败 (404)：后端管理接口未开启，请检查 config.yaml 中已配置 secret-key");
      } else {
        setStatusMessage(e.message || "请求 OAuth 链接失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManualCallback = async () => {
    if (!pastedCallbackUrl.trim()) return;
    setSubmittingCallback(true);
    try {
      await api.submitOAuthCallback(selectedProvider, pastedCallbackUrl.trim());
      addToast("success", "已成功提交回调地址，正在完成换码...");
      setPastedCallbackUrl("");
    } catch (e: any) {
      addToast("error", `提交回调失败: ${e.message}`);
    } finally {
      setSubmittingCallback(false);
    }
  };

  const handleCopyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopiedCode(true);
      addToast("success", "已复制设备验证码");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCancel = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    try {
      await api.cancelOAuthSession();
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">添加账号 (OAuth 授权)</h3>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "select" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                请选择你要授权的服务提供商。系统将生成官方 OAuth 授权链接并在浏览器中打开。局域网其他用户登录也同样受支持。
              </p>

              <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {PROVIDERS.map((p) => {
                  const isSelected = selectedProvider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? "bg-slate-800/80 border-brand-500 shadow-md ring-1 ring-brand-500"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow`}
                        >
                          {p.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{p.name}</div>
                          <div className="text-xs text-slate-400">{p.desc}</div>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-brand-500 bg-brand-500" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === "authenticating" && (
            <div className="space-y-5">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">等待授权完成</h4>
                  <p className="text-xs text-slate-400">{statusMessage}</p>
                </div>

                {/* If device flow user code is provided (e.g. Kimi) */}
                {userCode && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">设备授权验证码 (User Code)：</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-base font-bold text-brand-400 tracking-wider">
                        {userCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {authUrl && (
                  <div>
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition shadow-md"
                    >
                      点击在浏览器中打开授权页面 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Remote / LAN OAuth Helper Box */}
              {!userCode && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Globe className="w-3.5 h-3.5 text-brand-400" />
                    <span>局域网 / 远程设备授权辅助</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    若你在其他电脑上访问本面板，授权后浏览器跳转至 <code className="text-slate-300">localhost:...</code> 可能提示“无法访问此网站”。<strong>此时请直接复制浏览器地址栏中的完整网址并粘贴到下方</strong>：
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pastedCallbackUrl}
                      onChange={(e) => setPastedCallbackUrl(e.target.value)}
                      placeholder="粘贴地址栏链接 (例如: http://localhost:54545/callback?code=...)"
                      className="flex-1 rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={handleSubmitManualCallback}
                      disabled={!pastedCallbackUrl.trim() || submittingCallback}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition disabled:opacity-50 shrink-0"
                    >
                      {submittingCallback ? "提交中..." : "提交完成"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white">授权成功</h4>
              <p className="text-xs text-slate-400">{statusMessage}</p>
            </div>
          )}

          {step === "error" && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-white">授权中断或失败</h4>
              <p className="text-xs text-rose-400">{statusMessage}</p>
              <button
                onClick={() => setStep("select")}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
              >
                返回重新选择
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-900/50">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            {step === "success" ? "关闭" : "取消"}
          </button>
          {step === "select" && (
            <button
              type="button"
              onClick={handleStartAuth}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              开始 OAuth 授权
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
