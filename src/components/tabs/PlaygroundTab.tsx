import React, { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { ModelItem } from "../../types";
import {
  PlaySquare,
  Send,
  Square,
  RefreshCw,
  Sparkles,
  Bot,
  Trash2,
  Copy,
  Check,
  Edit3,
  List,
  Layers,
} from "lucide-react";

const TEMPLATES = [
  { label: "五言绝句", prompt: "请写一首关于人工智能与代码的五言绝句，并做简要赏析。" },
  { label: "代码编写", prompt: "用 Go 语言写一个高性能带超时控制与重试的 HTTP GET 请求函数。" },
  { label: "逻辑推理", prompt: "有三个箱子，分别装有苹果、橙子、以及两者的混合。箱子上的标签全部贴错。你只能从其中一个箱子拿出一个水果，如何判断三个箱子分别装了什么？" },
  { label: "系统探活", prompt: "请回复：Pong! 当前时间戳并简述你的模型身份与基础能力。" },
];

export const PlaygroundTab: React.FC = () => {
  const { addToast } = useApp();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);

  // Initialize from localStorage so even hard refresh preserves state
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("cpa_playground_model") || "";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("cpa_playground_key") || "";
  });
  const [prompt, setPrompt] = useState<string>(() => {
    const saved = localStorage.getItem("cpa_playground_prompt");
    return saved !== null ? saved : "请写一首关于人工智能与代码的五言绝句，并做简要赏析。";
  });
  const [output, setOutput] = useState<string>(() => {
    return sessionStorage.getItem("cpa_playground_output") || "";
  });

  const [streaming, setStreaming] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  // Sync to localStorage
  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    localStorage.setItem("cpa_playground_model", val);
  };

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("cpa_playground_key", val);
  };

  const handlePromptChange = (val: string) => {
    setPrompt(val);
    localStorage.setItem("cpa_playground_prompt", val);
  };

  const updateOutput = (newOutput: string | ((prev: string) => string)) => {
    setOutput((prev) => {
      const val = typeof newOutput === "function" ? newOutput(prev) : newOutput;
      sessionStorage.setItem("cpa_playground_output", val);
      return val;
    });
  };

  useEffect(() => {
    loadModelsAndKeys();
  }, []);

  const loadModelsAndKeys = async () => {
    setLoadingModels(true);
    let activeKey = apiKey?.trim() || localStorage.getItem("cpa_playground_key") || "";

    try {
      const keys = await api.getAPIKeys();
      if (keys && keys.length > 0) {
        if (!activeKey || activeKey === api.getSecretKey()) {
          activeKey = keys[0];
          handleKeyChange(keys[0]);
        }
      }
    } catch (e: any) {
      console.warn("Failed to load API keys:", e);
    }

    try {
      const res = await api.listModels(activeKey);
      if (res.data && res.data.length > 0) {
        setModels(res.data);
        const savedModel = localStorage.getItem("cpa_playground_model");
        const modelExists = res.data.some((m) => m.id === savedModel);
        if (!savedModel || !modelExists) {
          handleModelChange(res.data[0].id);
        }
      }
    } catch (e: any) {
      console.warn("Failed to load models list:", e);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleManualRefreshModels = async () => {
    setLoadingModels(true);
    try {
      let keyToUse = apiKey?.trim();
      if (!keyToUse || keyToUse === api.getSecretKey()) {
        const keys = await api.getAPIKeys();
        if (keys && keys.length > 0) {
          keyToUse = keys[0];
          handleKeyChange(keys[0]);
        }
      }

      const res = await api.listModels(keyToUse);
      if (res.data && res.data.length > 0) {
        setModels(res.data);
        addToast("success", `已同步获取 ${res.data.length} 个可用模型`);
        if (!selectedModel) {
          handleModelChange(res.data[0].id);
        }
      } else {
        addToast("info", "暂未获取到模型，请检查账号池是否有可用凭据");
      }
    } catch (e: any) {
      addToast("error", `获取模型列表失败: ${e.message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setStreaming(true);
    updateOutput("");
    setElapsedMs(0);

    const start = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - start));
    }, 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await api.streamChat(
        selectedModel,
        prompt,
        apiKey,
        (chunk) => {
          updateOutput((prev) => prev + chunk);
        },
        controller.signal
      );
      addToast("success", "响应完成");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        updateOutput((prev) => prev + `\n\n[错误]: ${e.message}`);
        addToast("error", `请求失败: ${e.message}`);
      }
    } finally {
      setStreaming(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedMs(Math.round(performance.now() - start));
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreaming(false);
    if (timerRef.current) clearInterval(timerRef.current);
    addToast("info", "已停止接收");
  };

  const handleClearOutput = () => {
    updateOutput("");
    setElapsedMs(0);
  };

  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopiedOutput(true);
      addToast("success", "输出已复制到剪贴板");
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-4">
          <PlaySquare className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">API 连通性与流式对话调试</h3>
            <p className="text-[11px] text-slate-400">
              模型列表会自动从后端同步，输入的内容会自动保存在浏览器中，切换页面不丢失。
            </p>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                目标测试模型 (Model)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModel(!isCustomModel)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                >
                  {isCustomModel ? (
                    <>
                      <List className="w-2.5 h-2.5" /> 下拉列表选择
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-2.5 h-2.5" /> 手动自定义输入
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleManualRefreshModels}
                  disabled={loadingModels}
                  className="text-[10px] text-brand-400 hover:underline flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${loadingModels ? "animate-spin" : ""}`} />
                  刷新模型
                </button>
              </div>
            </div>

            {!isCustomModel && models.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition appearance-none cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} {m.owned_by ? `(${m.owned_by})` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 text-xs">
                  ▼
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="输入或选择模型名 (例如: gemini-3.8-flash-high 或 claude-3-7-sonnet)"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
              />
            )}

            {!isCustomModel && models.length === 0 && !loadingModels && (
              <p className="mt-1 text-[11px] text-amber-400">
                尚未从接口获取到模型，请点击上方“刷新模型”或切换为“手动自定义输入”。
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
              <span>客户端鉴权 Key (Authorization Bearer)</span>
              <span className="text-[10px] text-slate-500 font-mono">从管理端自动获取</span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="例如: sk-cpa-master-key"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" /> 快捷模板：
          </span>
          {TEMPLATES.map((t, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptChange(t.prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800 text-[11px] text-slate-300 shrink-0 transition"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-400">用户 Prompt</label>
            <button
              onClick={() => handlePromptChange("")}
              className="text-[10px] text-slate-500 hover:text-rose-400 transition"
            >
              清空 Prompt
            </button>
          </div>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="输入发送给模型的 Prompt..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-y font-sans leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {elapsedMs > 0 && <span>耗时: {elapsedMs}ms</span>}
          </div>

          <div className="flex items-center gap-2.5">
            {streaming ? (
              <button
                onClick={handleStop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
              >
                <Square className="w-3.5 h-3.5" /> 停止生成
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> 发送请求 (Stream)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output Stream Result Window */}
      {(output || streaming) && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Bot className="w-4 h-4 text-brand-400" />
              <span>模型实时输出</span>
            </div>
            <div className="flex items-center gap-2">
              {streaming ? (
                <div className="flex items-center gap-1.5 text-[11px] text-brand-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>正在流式接收...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {copiedOutput ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> 已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> 复制输出
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearOutput}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 清空
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {output || <span className="text-slate-600">等待首字返回...</span>}
          </div>
        </div>
      )}
    </div>
  );
};


