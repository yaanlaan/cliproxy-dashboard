import React from "react";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { TrafficAnalyticsChart } from "../TrafficAnalyticsChart";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Server,
  Zap,
  ArrowRight,
  ShieldAlert,
  Key,
  Flame,
  Layers,
} from "lucide-react";

export const OverviewTab: React.FC<{ onOpenOAuthModal: () => void }> = ({ onOpenOAuthModal }) => {
  const { authFiles, isConnected, latencyMs, versionInfo, setActiveTab, secretKey, setIsConnectionModalOpen } =
    useApp();
  const { t } = useI18n();

  const totalAccounts = authFiles.length;
  const activeAccounts = authFiles.filter(
    (a) => !a.disabled && !a.unavailable && (!a.cooldowns || Object.keys(a.cooldowns).length === 0)
  ).length;
  const cooldownAccounts = authFiles.filter(
    (a) => a.cooldowns && Object.keys(a.cooldowns).length > 0
  ).length;
  const disabledOrError = authFiles.filter((a) => a.disabled || a.unavailable).length;

  // Provider counts
  const providerCounts = authFiles.reduce((acc, a) => {
    const p = (a.provider || a.type || "other").toLowerCase();
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Warning banner if not connected or no secret key */}
      {!secretKey && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <div className="text-xs">
              <span className="font-semibold text-amber-200">
                {t("overview.noSecretWarning")}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsConnectionModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium transition"
          >
            {t("overview.setNow")}
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t("overview.totalAccounts")}</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{totalAccounts}</div>
          <p className="text-xs text-slate-500">{t("overview.totalAccountsDesc")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t("overview.activeAccounts")}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">{activeAccounts}</div>
          <p className="text-xs text-slate-500">{t("overview.activeAccountsDesc")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t("overview.cooldownAccounts")}</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{cooldownAccounts}</div>
          <p className="text-xs text-slate-500">{t("overview.cooldownAccountsDesc")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">{t("overview.errorAccounts")}</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mb-1">{disabledOrError}</div>
          <p className="text-xs text-slate-500">{t("overview.errorAccountsDesc")}</p>
        </div>
      </div>

      {/* Traffic Analytics Chart Card */}
      <TrafficAnalyticsChart authFiles={authFiles} />

      {/* Main Content Grid: System Info & Providers Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Providers Breakdown & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <h3 className="font-semibold text-white text-sm">{t("overview.providerDist")}</h3>
              </div>
              <button
                onClick={() => setActiveTab("accounts")}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
              >
                {t("overview.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {totalAccounts === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-3">{t("overview.emptyPool")}</p>
                <button
                  onClick={onOpenOAuthModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition"
                >
                  <Zap className="w-3.5 h-3.5" /> {t("overview.addFirstAccount")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(providerCounts).map(([provider, count]) => {
                  let badgeColor = "bg-slate-800 text-slate-300";
                  if (provider.includes("claude")) badgeColor = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                  else if (provider.includes("codex") || provider.includes("openai"))
                    badgeColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                  else if (provider.includes("gemini") || provider.includes("antigravity"))
                    badgeColor = "bg-sky-500/10 text-sky-300 border-sky-500/20";
                  else if (provider.includes("xai"))
                    badgeColor = "bg-purple-500/10 text-purple-300 border-purple-500/20";
                  else if (provider.includes("kimi"))
                    badgeColor = "bg-blue-500/10 text-blue-300 border-blue-500/20";

                  return (
                    <div
                      key={provider}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="capitalize text-xs font-semibold text-slate-200 block">
                          {provider}
                        </span>
                        <span className="text-[11px] text-slate-500">{t("overview.authorizedCreds")}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <h3 className="font-semibold text-white text-sm mb-4">{t("overview.quickActions")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onOpenOAuthModal}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-900 transition text-left group"
              >
                <Zap className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("overview.qaOAuthTitle")}</div>
                <div className="text-[11px] text-slate-500">{t("overview.qaOAuthDesc")}</div>
              </button>

              <button
                onClick={() => setActiveTab("keys")}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-900 transition text-left group"
              >
                <Key className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("overview.qaKeyTitle")}</div>
                <div className="text-[11px] text-slate-500">{t("overview.qaKeyDesc")}</div>
              </button>

              <button
                onClick={() => setActiveTab("playground")}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-900 transition text-left group"
              >
                <Flame className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition" />
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("overview.qaPlaygroundTitle")}</div>
                <div className="text-[11px] text-slate-500">{t("overview.qaPlaygroundDesc")}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Service & Environment Status */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" />
              <h3 className="font-semibold text-white text-sm">{t("overview.envStatus")}</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">{t("overview.commStatus")}</span>
                <span className={`font-medium ${isConnected ? "text-emerald-400" : "text-rose-400"}`}>
                  {isConnected ? t("overview.commNormal") : t("overview.commFailed")}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">{t("overview.latency")}</span>
                <span className="font-mono text-slate-200">{latencyMs} ms</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">{t("overview.serverVersion")}</span>
                <span className="font-mono text-brand-400 font-semibold">
                  v{versionInfo?.version || "dev"}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">{t("overview.buildCommit")}</span>
                <span className="font-mono text-slate-300">
                  {versionInfo?.commit ? versionInfo.commit.substring(0, 8) : "none"}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">{t("overview.buildTime")}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {versionInfo?.buildDate || "unknown"}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">{t("overview.pluginAbi")}</span>
                <span className="font-medium text-slate-300">
                  {versionInfo?.supportPlugin ? t("overview.enabled") : t("overview.disabledLabel")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
