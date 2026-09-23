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
  User,
  Zap,
} from "lucide-react";

export const PlaygroundTab: React.FC = () => {
  const { addToast } = useApp();
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("claude-3-7-sonnet");
  const [apiKey, setApiKey] = useState<string>("");
  const [prompt, setPrompt] = useState<string>(
    "请写一首关于人工智能与代码的五言绝句，并做简要赏析。"
  );
  const [output, setOutput] = useState<string>("");
  const [streaming, setStreaming] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadModelsAndKeys();
  }, []);

  const loadModelsAndKeys = async () => {
    try {
      const res = await api.listModels();
      if (res.data && res.data.length > 0) {
        setModels(res.data);
        setSelectedModel(res.data[0].id);
      }
    } catch {}

    try {
      const keys = await api.getAPIKeys();
      if (keys && keys.length > 0) {
        setApiKey(keys[0]);
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setStreaming(true);
    setOutput("");
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
          setOutput((prev) => prev + chunk);
        },
        controller.signal
      );
      addToast("success", "响应完成");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setOutput((prev) => prev + `\n\n[错误]: ${e.message}`);
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

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-4">
          <PlaySquare className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">API 连通性与流式对话调试</h3>
            <p className="text-[11px] text-slate-400">
              直接通过当前 CLIProxyAPI 实例发送测试请求，实时验证账号池调度、协议转换与流式响应。
            </p>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              目标测试模型 (Model)
            </label>
            {models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="例如: claude-3-7-sonnet 或 gpt-5-codex"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              客户端鉴权 Key (Authorization Bearer)
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="留空则使用当前配置的管理密钥"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span>用户 Prompt</span>
            <span className="text-[10px] text-slate-500">支持 Markdown 与多行</span>
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
            {streaming && (
              <div className="flex items-center gap-2 text-[11px] text-brand-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>正在流式接收...</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
            {output || <span className="text-slate-600">等待首字返回...</span>}
          </div>
        </div>
      )}
    </div>
  );
};
