import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import {
  Zap,
  Lock,
  User,
  Globe,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, serverUrl, setServerUrl } = useApp();
  const { language, setLanguage, t } = useI18n();

  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("123456");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [customServerUrl, setCustomServerUrl] = useState<string>(serverUrl);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("请输入用户名与管理密码");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (customServerUrl.trim()) {
        setServerUrl(customServerUrl.trim());
      }
      const res = await login(username.trim(), password.trim(), customServerUrl.trim());
      if (!res.ok) {
        setErrorMessage(res.error || "登录失败，请检查密码或服务地址");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "登录请求异常");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 relative overflow-hidden select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-mono"
        >
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <span>{language === "zh" ? "English" : "中文"}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white shadow-xl shadow-brand-500/25 mb-4">
            <Zap className="w-7 h-7 fill-white text-transparent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            CLIProxy Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            {language === "zh" ? "请输入管理员凭据登录管理控制台" : "Sign in with admin credentials"}
          </p>
        </div>

        {/* Login Form Box */}
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {language === "zh" ? "管理员账号 (Username)" : "Username"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            {/* Password / Secret Key Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {language === "zh" ? "管理密码 (Management Secret Key)" : "Password (Secret Key)"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === "zh" ? "输入后端配置的 secret-key" : "Enter secret key"}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Advanced Host Collapsible */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-500 hover:text-brand-400 flex items-center gap-1 transition"
              >
                <Server className="w-3 h-3" />
                <span>
                  {showAdvanced
                    ? (language === "zh" ? "收起服务地址设置" : "Hide server host")
                    : (language === "zh" ? "自定义服务连接地址 (默认自动)" : "Custom server host")}
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8317 或留空"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    如直接通过浏览器访问当前面板域名，留空即可自动路由。
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-500 transition shadow-lg shadow-brand-600/25 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === "zh" ? "正在验证身份..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{language === "zh" ? "立即登录控制台" : "Sign In to Dashboard"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick tips at bottom */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {language === "zh"
                  ? "默认管理密码可在 config.yaml 的 secret-key 中配置"
                  : "Default password matches secret-key in config.yaml"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

