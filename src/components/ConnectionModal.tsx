import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { X, CheckCircle2, AlertCircle, RefreshCw, Key, Globe } from "lucide-react";

export const ConnectionModal: React.FC = () => {
  const {
    isConnectionModalOpen,
    setIsConnectionModalOpen,
    serverUrl,
    setServerUrl,
    secretKey,
    setSecretKey,
    refreshAll,
    addToast,
  } = useApp();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [inputKey, setInputKey] = useState(secretKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isConnectionModalOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const prevUrl = api.getServerUrl();
      const prevKey = api.getSecretKey();

      api.setServerUrl(inputUrl);
      api.setSecretKey(inputKey);

      const health = await api.checkHealth();
      if (!health.ok) {
        setTestResult({ ok: false, message: "服务不可达，请检查地址是否正确" });
        api.setServerUrl(prevUrl);
        api.setSecretKey(prevKey);
        return;
      }

      // Test management authorization by calling a management endpoint
      try {
        await api.listAuthFiles();
        setTestResult({ ok: true, message: `连接成功 (延迟: ${health.latencyMs}ms, 鉴权通过)` });
      } catch (err: any) {
        setTestResult({
          ok: false,
          message: `服务在线但管理 API 鉴权失败: ${err.message || "请检查 Management Key"}`,
        });
      }

      api.setServerUrl(prevUrl);
      api.setSecretKey(prevKey);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || "测试失败" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setServerUrl(inputUrl);
    setSecretKey(inputKey);
    setIsConnectionModalOpen(false);
    addToast("success", "连接配置已更新");
    await refreshAll();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-semibold text-white">CLIProxyAPI 服务连接设置</h3>
          </div>
          <button
            onClick={() => setIsConnectionModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-400" />
              服务接口地址 (Host URL)
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://127.0.0.1:8317 (留空则使用当前访问域名)"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
            <p className="mt-1 text-xs text-slate-500">
              CLIProxyAPI 默认监听 8317 端口。如前端与服务在同一主机，可直接保持默认或当前域名。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-400" />
              管理密钥 (Management Secret Key)
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="config.yaml 中 remote-management.secret-key 的值"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
            <p className="mt-1 text-xs text-slate-500">
              用于访问 /v0/management 管理接口。仅在本地浏览器加密存储。
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? "bg-emerald-950/50 border border-emerald-800/60 text-emerald-300"
                  : "bg-rose-950/50 border border-rose-800/60 text-rose-300"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-900/50">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
          >
            {testing && <RefreshCw className="w-4 h-4 animate-spin" />}
            测试连通性
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsConnectionModalOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-500 transition shadow-lg shadow-brand-600/20"
            >
              保存并连接
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
