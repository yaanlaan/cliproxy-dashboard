import React from "react";
import { useApp, TabType } from "../context/AppContext";
import { useI18n } from "../i18n";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  KeyRound,
  PlaySquare,
  Sliders,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface NavItem {
  id: TabType;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, authFiles } = useApp();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    {
      id: "overview",
      labelKey: "nav.overview",
      icon: LayoutDashboard,
    },
    {
      id: "accounts",
      labelKey: "nav.accounts",
      icon: Users,
      badge: authFiles.length > 0 ? authFiles.length : undefined,
    },
    {
      id: "routing",
      labelKey: "nav.routing",
      icon: GitBranch,
    },
    {
      id: "keys",
      labelKey: "nav.keys",
      icon: KeyRound,
    },
    {
      id: "playground",
      labelKey: "nav.playground",
      icon: PlaySquare,
    },
    {
      id: "config",
      labelKey: "nav.config",
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {t("nav.navTitle")}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${isActive ? "text-brand-400" : "text-slate-400"}`}
                />
                <span>{t(item.labelKey)}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-brand-500/20 text-brand-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/60 space-y-2">
        <a
          href="https://github.com/router-for-me/CLIProxyAPI/blob/main/README_CN.md"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition"
          title="GitHub 完整中文手册"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>{t("nav.docs")}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>

        <div className="px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
            <span>{t("nav.links")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs">{t("nav.repoWeb")}</span>
            <a
              href="https://github.com/yaanlaan/cliproxy-dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline font-mono text-[11px] flex items-center gap-1"
            >
              cliproxy-dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
            <span className="text-slate-500 text-[11px]">{t("nav.repoCore")}</span>
            <a
              href="https://github.com/router-for-me/CLIProxyAPI"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200 font-mono text-[11px] flex items-center gap-1"
            >
              CLIProxyAPI v7
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
