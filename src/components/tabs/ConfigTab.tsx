import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import {
  Sliders,
  Save,
  RefreshCw,
  Terminal,
  Bug,
  FileCode,
  AlertCircle,
} from "lucide-react";

export const ConfigTab: React.FC = () => {
  const { addToast } = useApp();
  const [yamlContent, setYamlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const yaml = await api.getConfigYAML();
      setYamlContent(yaml || "");
    } catch (e: any) {
      addToast("error", `加载配置失败: ${e.message}`);
    }

    try {
      const debug = await api.getDebug();
      setDebugMode(debug);
    } catch {}

    setLoading(false);
  };

  const handleSaveYaml = async () => {
    setSaving(true);
    try {
      await api.updateConfigYAML(yamlContent);
      addToast("success", "配置已成功热更新至服务器");
    } catch (e: any) {
      addToast("error", `更新配置失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDebug = async () => {
    const next = !debugMode;
    try {
      await api.setDebug(next);
      setDebugMode(next);
      addToast("success", `Debug 模式已${next ? "开启" : "关闭"}`);
    } catch (e: any) {
      addToast("error", `切换 Debug 模式失败: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug and System Toggles */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">调试模式 (Debug Logging)</h3>
            <p className="text-[11px] text-slate-400">
              开启后，CLIProxyAPI 将在控制台与日志中输出详细的请求/响应与指纹跟踪信息。
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleDebug}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            debugMode
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800"
          }`}
        >
          {debugMode ? "Debug 已开启" : "Debug 已关闭"}
        </button>
      </div>

      {/* Online YAML Editor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="font-semibold text-white text-sm">在线配置文件编辑 (config.yaml)</h3>
              <p className="text-[11px] text-slate-400">
                支持在线编辑 YAML 并直接热应用 (Hot Reload)，无需手动重启 CLIProxyAPI 服务。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadConfig}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="重新加载"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleSaveYaml}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              热更新保存配置
            </button>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
          {loading ? (
            <div className="py-24 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              正在读取 config.yaml...
            </div>
          ) : (
            <textarea
              rows={22}
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              className="w-full bg-transparent p-4 text-slate-200 font-mono text-xs focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
