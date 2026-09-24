import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useI18n } from "../i18n";
import {
  Server,
  RefreshCw,
  Settings,
  ExternalLink,
  Zap,
  Globe,
  LogOut,
  User,
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    isConnected,
    latencyMs,
    versionInfo,
    latestVersion,
    refreshAll,
    setIsConnectionModalOpen,
    setIsAccountModalOpen,
    serverUrl,
    currentUser,
    logout,
  } = useApp();

  const { language, setLanguage, t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh");
  };

  const hasNewVersion =
    latestVersion?.tag_name &&
    versionInfo?.version &&
    versionInfo.version !== "dev" &&
    !latestVersion.tag_name.includes(versionInfo.version);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-base">
            <Zap className="w-5 h-5 fill-white text-transparent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tight font-mono">panel4cliproxyapi</h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {serverUrl || window.location.origin}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">
                {t("common.online")} ({latencyMs}ms)
              </span>
              {versionInfo && (
                <span className="text-slate-500 border-l border-slate-800 pl-2 font-mono">
                  v{versionInfo.version}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-rose-400 font-medium">{t("common.offline")}</span>
            </>
          )}
        </div>

        {/* Update notification */}
        {hasNewVersion && (
          <a
            href={latestVersion?.html_url || "https://github.com/router-for-me/CLIProxyAPI/releases"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition"
          >
            {t("common.newVersion")} {latestVersion?.tag_name}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          title="切换语言 / Switch Language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-mono font-medium"
        >
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <span>{language === "zh" ? "EN" : "中"}</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title={t("common.refresh")}
          className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-brand-400" : ""}`} />
        </button>

        {/* Connection Settings */}
        <button
          onClick={() => setIsConnectionModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-medium"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {t("common.connectionSettings")}
        </button>

                {/* User Badge & Logout */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            title={language === "zh" ? "点击修改账户与密码" : "Click to change username & password"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-xs font-medium text-brand-300 transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-mono">{currentUser}</span>
          </button>

          <button            onClick={logout}
            title={language === "zh" ? "退出登录" : "Sign Out"}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


