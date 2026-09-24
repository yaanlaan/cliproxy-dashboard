import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import { copyToClipboard } from "../utils/clipboard";
import { api } from "../services/api";
import {
  X,
  Rocket,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Download,
  RotateCw,
  Sparkles,
  Layers,
} from "lucide-react";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  const { versionInfo, latestVersion, refreshAll, addToast } = useApp();
  const { language, t } = useI18n();

  const [activeTab, setActiveTab] = useState<"docker" | "reload" | "binary">("docker");
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [reloading, setReloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentVer = versionInfo?.version ? `v${versionInfo.version.replace(/^v/, "")}` : "v7.3.15";
  const latestVer = latestVersion?.["latest-version"] || latestVersion?.tag_name || currentVer;
  const hasUpdate = latestVer && currentVer && latestVer !== currentVer && latestVer !== "vdev";

  const dockerUpdateCmd = `# 进入 Docker 部署目录并平滑升级后端核心
cd /vol1/1000/dockers/cliproxy

# 1. 拉取最新官方镜像 (数据与配置完全保留)
docker compose pull cli-proxy-api

# 2. 毫秒级热重启新版本容器
docker compose up -d cli-proxy-api`;

  const handleCopyCmd = async () => {
    const success = await copyToClipboard(dockerUpdateCmd);
    if (success) {
      setCopiedCmd(true);
      addToast("success", language === "zh" ? "Docker 升级命令已复制" : "Docker update command copied");
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  const handleTriggerHotReload = async () => {
    setReloading(true);
    try {
      // 1. Refresh all auth tokens
      await api.refreshAuthFiles("", true);
      // 2. Fetch latest config
      await refreshAll();
      addToast(
        "success",
        language === "zh" ? "后端运行态模型库与凭据池已动态刷新！" : "Runtime models and credentials refreshed!"
      );
    } catch (e: any) {
      addToast("error", `热重载失败: ${e.message}`);
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-white">
              {language === "zh" ? "CLIProxyAPI 核心版本与更新中心" : "Core Version & Updates"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Version Status Comparison Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                {language === "zh" ? "版本状态检测" : "Version Status"}
              </span>
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">{language === "zh" ? "当前核心版本" : "Current"}</span>
                  <span className="text-sm font-bold font-mono text-slate-200">{currentVer}</span>
                </div>
                <div className="text-slate-600 font-mono">➔</div>
                <div>
                  <span className="text-xs text-slate-400 block">{language === "zh" ? "GitHub 最新发布" : "Latest"}</span>
                  <span className="text-sm font-bold font-mono text-brand-400">{latestVer}</span>
                </div>
              </div>
            </div>

            <div>
              {hasUpdate ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "发现新版本可用" : "Update Available"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === "zh" ? "当前已是最新" : "Up to Date"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("docker")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "docker"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "Docker 容器热升级 (推荐)" : "Docker Update"}</span>
            </button>
            <button
              onClick={() => setActiveTab("reload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "reload"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "运行态动态刷新" : "Hot Reload"}</span>
            </button>
            <button
              onClick={() => setActiveTab("binary")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "binary"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === "zh" ? "预编译二进制包" : "Binary Download"}</span>
            </button>
          </div>

          {/* Tab 1: Docker In-Place Update */}
          {activeTab === "docker" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "zh"
                  ? "当前在 NAS 或服务器上通过 Docker 运行。由于 auths/ 账号凭据与 config.yaml 配置文件均已持久化挂载，拉取新镜像重启后数据 100% 完整保留。"
                  : "Running via Docker. All credentials in auths/ and config.yaml are mounted volumes; updating the image retains 100% of your data."}
              </p>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-slate-200">
                <button
                  onClick={handleCopyCmd}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
                <pre className="pr-16 overflow-x-auto whitespace-pre-wrap leading-relaxed text-slate-300">
                  {dockerUpdateCmd}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Runtime Hot Reload */}
          {activeTab === "reload" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "zh"
                  ? "无需重启服务，立即命令后端主动连接上游重新拉取最新的模型目录（如 Codex 客户端模型表、Devin 列表），并强制刷新账号池中即将过期的 Token。"
                  : "Command the backend core to re-sync upstream model catalogs and refresh credentials without stopping the process."}
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {language === "zh" ? "模型目录与凭据重载" : "Catalogs & Token Refresh"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === "zh" ? "即刻同步 upstream models.json 与 Token 状态" : "Sync upstream models and token states"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerHotReload}
                  disabled={reloading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reloading ? "animate-spin" : ""}`} />
                  <span>{reloading ? (language === "zh" ? "刷新中..." : "Reloading...") : (language === "zh" ? "触发动态刷新" : "Reload Now")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Binary Download */}
          {activeTab === "binary" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === "zh"
                  ? "如果你是在物理机或虚拟机中以独立二进制方式运行，可以直接前往官方 Release 下载最新构建产物替换："
                  : "If running as a standalone binary on Linux, Windows or macOS, download the latest compiled asset from GitHub Releases:"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <a
                  href={`https://github.com/router-for-me/CLIProxyAPI/releases/download/${latestVer}/CLIProxyAPI_${latestVer.replace(/^v/, "")}_linux_amd64.tar.gz`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 flex items-center justify-between text-slate-200 transition"
                >
                  <span>Linux x86_64 (.tar.gz)</span>
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                </a>
                <a
                  href={`https://github.com/router-for-me/CLIProxyAPI/releases/download/${latestVer}/CLIProxyAPI_${latestVer.replace(/^v/, "")}_linux_aarch64.tar.gz`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 flex items-center justify-between text-slate-200 transition"
                >
                  <span>Linux ARM64 (.tar.gz)</span>
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                </a>
                <a
                  href={`https://github.com/router-for-me/CLIProxyAPI/releases/download/${latestVer}/CLIProxyAPI_${latestVer.replace(/^v/, "")}_windows_amd64.zip`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 flex items-center justify-between text-slate-200 transition"
                >
                  <span>Windows 64位 (.zip)</span>
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                </a>
                <a
                  href={`https://github.com/router-for-me/CLIProxyAPI/releases/download/${latestVer}/CLIProxyAPI_${latestVer.replace(/^v/, "")}_darwin_aarch64.tar.gz`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 flex items-center justify-between text-slate-200 transition"
                >
                  <span>macOS Apple Silicon (.tar.gz)</span>
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                </a>
              </div>
            </div>
          )}

          {/* Footer Release Link */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <a
              href={`https://github.com/router-for-me/CLIProxyAPI/releases/tag/${latestVer}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline flex items-center gap-1.5"
            >
              <span>{language === "zh" ? `查看 ${latestVer} 完整发行说明与更新日志` : `View ${latestVer} Release Notes on GitHub`}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {language === "zh" ? "关闭" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
