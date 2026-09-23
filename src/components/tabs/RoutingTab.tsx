import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { ModelAliasMap, ModelItem } from "../../types";
import {
  GitBranch,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Box,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const RoutingTab: React.FC = () => {
  const { addToast } = useApp();
  const [strategy, setStrategy] = useState<string>("round-robin");
  const [savingStrategy, setSavingStrategy] = useState<boolean>(false);

  const [aliases, setAliases] = useState<[string, string][]>([]);
  const [savingAliases, setSavingAliases] = useState<boolean>(false);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const s = await api.getRoutingStrategy();
      if (s.strategy) setStrategy(s.strategy);
    } catch {}

    try {
      const a = await api.getOAuthModelAlias();
      setAliases(Object.entries(a));
    } catch {}

    loadModels();
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const res = await api.listModels();
      setModels(res.data || []);
    } catch {}
    finally {
      setLoadingModels(false);
    }
  };

  const handleSaveStrategy = async () => {
    setSavingStrategy(true);
    try {
      await api.updateRoutingStrategy(strategy);
      addToast("success", `调度策略已更新为: ${strategy}`);
    } catch (e: any) {
      addToast("error", `保存失败: ${e.message}`);
    } finally {
      setSavingStrategy(false);
    }
  };

  const handleAddAlias = () => {
    setAliases([...aliases, ["", ""]]);
  };

  const handleRemoveAlias = (index: number) => {
    const next = [...aliases];
    next.splice(index, 1);
    setAliases(next);
  };

  const handleAliasChange = (index: number, key: 0 | 1, value: string) => {
    const next = [...aliases];
    next[index][key] = value;
    setAliases(next);
  };

  const handleSaveAliases = async () => {
    setSavingAliases(true);
    try {
      const map: ModelAliasMap = {};
      for (const [k, v] of aliases) {
        if (k.trim() && v.trim()) {
          map[k.trim()] = v.trim();
        }
      }
      await api.updateOAuthModelAlias(map);
      addToast("success", "模型别名映射已成功保存");
    } catch (e: any) {
      addToast("error", `保存模型别名失败: ${e.message}`);
    } finally {
      setSavingAliases(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Routing Strategy Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold text-white text-sm">多账号调度与轮询策略</h3>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          当凭据池中拥有多个同提供商账号时，CLIProxyAPI 会依据该策略分派请求。若遇到限流 (429) 或配额超限，系统会自动转入冷却并将请求快速故障转移至下一账号。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            {
              id: "round-robin",
              name: "轮询调度 (Round Robin)",
              desc: "均匀循环依次调用各可用账号，平衡各账号负载",
            },
            {
              id: "weighted-round-robin",
              name: "加权轮询 (Weighted)",
              desc: "依据每个凭据配置的权重 (weight) 按比例分派请求",
            },
            {
              id: "fill-first",
              name: "顺序占满 (Fill First)",
              desc: "优先使用首个可用账号，直到触发限流后再切换到下一个",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => setStrategy(item.id)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                strategy === item.id
                  ? "bg-brand-600/15 border-brand-500 text-white shadow-sm ring-1 ring-brand-500"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                <span>{item.name}</span>
                {strategy === item.id && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
              </div>
              <div className="text-[11px] text-slate-400 leading-normal">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveStrategy}
            disabled={savingStrategy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
          >
            {savingStrategy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存调度策略
          </button>
        </div>
      </div>

      {/* Model Aliases Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="font-semibold text-white text-sm">模型别名映射 (Model Aliases)</h3>
              <p className="text-[11px] text-slate-400">
                将客户端请求的模型名称自动重写映射至上游真实模型。例如客户端请求 <code className="text-brand-300">gpt-4o</code> 可映射为 <code className="text-brand-300">gpt-5-codex</code>。
              </p>
            </div>
          </div>
          <button
            onClick={handleAddAlias}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5" /> 添加映射
          </button>
        </div>

        {aliases.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            暂无自定义模型别名映射
          </div>
        ) : (
          <div className="space-y-2.5 mb-5">
            {aliases.map(([clientModel, upstreamModel], idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={clientModel}
                  onChange={(e) => handleAliasChange(idx, 0, e.target.value)}
                  placeholder="客户端请求模型名 (Alias)"
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-brand-500 transition"
                />
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={upstreamModel}
                  onChange={(e) => handleAliasChange(idx, 1, e.target.value)}
                  placeholder="真实上游模型名 (Target)"
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-brand-500 transition"
                />
                <button
                  onClick={() => handleRemoveAlias(idx)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveAliases}
            disabled={savingAliases}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
          >
            {savingAliases ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存别名映射
          </button>
        </div>
      </div>

      {/* Available Models from /v1/models */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-white text-sm">
              当前可用模型列表 ({models.length})
            </h3>
          </div>
          <button
            onClick={loadModels}
            disabled={loadingModels}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingModels ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loadingModels ? (
          <div className="py-8 text-center text-slate-500 text-xs">加载模型列表中...</div>
        ) : models.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            暂无模型返回，请检查服务连接与账号池状态
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {models.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between font-mono text-xs"
              >
                <span className="text-slate-200 font-medium truncate">{m.id}</span>
                <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {m.owned_by || "cli-proxy"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
