import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { AuthFile } from "../../types";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Zap,
} from "lucide-react";

export const AccountsTab: React.FC<{ onOpenOAuthModal: () => void }> = ({ onOpenOAuthModal }) => {
  const { authFiles, isLoadingAuthFiles, refreshAll, addToast } = useApp();
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = authFiles.filter((auth) => {
    const p = (auth.provider || auth.type || "").toLowerCase();
    if (providerFilter !== "all" && !p.includes(providerFilter)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (auth.name || "").toLowerCase().includes(q);
      const matchId = (auth.id || "").toLowerCase().includes(q);
      const matchProvider = p.includes(q);
      return matchName || matchId || matchProvider;
    }
    return true;
  });

  const handleDelete = async (auth: AuthFile) => {
    if (!confirm(`确定要从凭据池中删除账号【${auth.name || auth.id}】吗？此操作无法撤销。`)) {
      return;
    }
    setActionLoading(`del-${auth.id}`);
    try {
      await api.deleteAuthFile(auth.name || auth.id);
      addToast("success", `已删除账号 ${auth.name || auth.id}`);
      await refreshAll();
    } catch (e: any) {
      addToast("error", `删除失败: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshToken = async (auth: AuthFile) => {
    setActionLoading(`ref-${auth.id}`);
    try {
      await api.refreshAuthFiles(auth.name || auth.id);
      addToast("success", `Token 刷新成功: ${auth.name || auth.id}`);
      await refreshAll();
    } catch (e: any) {
      addToast("error", `刷新 Token 失败: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetQuota = async (auth: AuthFile) => {
    setActionLoading(`reset-${auth.id}`);
    try {
      const indexStr = auth.auth_index !== undefined ? String(auth.auth_index) : auth.id;
      await api.resetQuota(indexStr);
      addToast("success", `已重置配额/解除冷却: ${auth.name || auth.id}`);
      await refreshAll();
    } catch (e: any) {
      addToast("error", `重置配额失败: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshAllTokens = async () => {
    setActionLoading("refresh-all");
    try {
      const res = await api.refreshAuthFiles("", true);
      addToast("success", `批量刷新完成 (已刷新 ${res.refreshed ?? "全部"} 个账号)`);
      await refreshAll();
    } catch (e: any) {
      addToast("error", `批量刷新失败: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const categories = [
    { id: "all", label: "全部账号" },
    { id: "claude", label: "Claude" },
    { id: "codex", label: "Codex / OpenAI" },
    { id: "antigravity", label: "Antigravity / Gemini" },
    { id: "xai", label: "xAI Grok" },
    { id: "kimi", label: "Kimi" },
    { id: "devin", label: "Devin" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索账号名称、ID 或提供商..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshAllTokens}
            disabled={actionLoading === "refresh-all"}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${actionLoading === "refresh-all" ? "animate-spin" : ""}`}
            />
            批量刷新 Token
          </button>
          <button
            onClick={onOpenOAuthModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-lg shadow-brand-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            添加 OAuth 账号
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setProviderFilter(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
              providerFilter === c.id
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Accounts List / Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
        {isLoadingAuthFiles ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            <p className="text-xs">加载账号列表中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs">未找到符合条件的账号凭据</p>
            <button
              onClick={onOpenOAuthModal}
              className="text-xs text-brand-400 hover:underline"
            >
              点击添加新账号
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <tr>
                  <th className="py-3.5 px-4">状态</th>
                  <th className="py-3.5 px-4">提供商</th>
                  <th className="py-3.5 px-4">账号凭据名称 / ID</th>
                  <th className="py-3.5 px-4 text-center">调用统计 (成功/失败)</th>
                  <th className="py-3.5 px-4">冷却详情 / 消息</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((auth) => {
                  const isCooldown = auth.cooldowns && Object.keys(auth.cooldowns).length > 0;
                  const isError = auth.disabled || auth.unavailable;

                  return (
                    <tr key={auth.id} className="hover:bg-slate-850/50 transition">
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isError ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium text-[11px]">
                            <AlertCircle className="w-3 h-3" /> 禁用/不可用
                          </span>
                        ) : isCooldown ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[11px]">
                            <Clock className="w-3 h-3" /> 冷却中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> 正常就绪
                          </span>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {auth.provider || auth.type}
                        </span>
                      </td>

                      {/* Name / ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{auth.name || auth.id}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {auth.id.slice(0, 16)}...
                        </div>
                      </td>

                      {/* Requests stats */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-emerald-400 font-mono font-medium">
                          {auth.success ?? 0}
                        </span>
                        <span className="text-slate-600 mx-1.5">/</span>
                        <span className="text-rose-400 font-mono font-medium">
                          {auth.failed ?? 0}
                        </span>
                      </td>

                      {/* Status message or cooldown */}
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {isCooldown ? (
                          <span className="text-amber-300 font-mono text-[11px]">
                            {JSON.stringify(auth.cooldowns)}
                          </span>
                        ) : (
                          auth.status_message || "-"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCooldown && (
                            <button
                              onClick={() => handleResetQuota(auth)}
                              disabled={actionLoading === `reset-${auth.id}`}
                              title="解除冷却 / 重置配额"
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleRefreshToken(auth)}
                            disabled={actionLoading === `ref-${auth.id}`}
                            title="刷新此账号 Token"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                actionLoading === `ref-${auth.id}` ? "animate-spin text-brand-400" : ""
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => handleDelete(auth)}
                            disabled={actionLoading === `del-${auth.id}`}
                            title="删除凭据"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
