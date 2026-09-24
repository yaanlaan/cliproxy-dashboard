import { copyToClipboard } from "../../utils/clipboard";
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Sparkles,
  Save,
  RefreshCw,
  Terminal,
} from "lucide-react";

export const ApiKeysTab: React.FC = () => {
  const { addToast, serverUrl } = useApp();
  const [keys, setKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<string>("cursor");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.getAPIKeys();
      setKeys(res || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedText(label);
      addToast("success", `已复制 ${label}`);
      setTimeout(() => setCopiedText(null), 2000);
    } else {
      addToast("error", "复制失败，请手动选中文本复制");
    }
  };

  const handleGenerateKey = () => {
    const random = "sk-cpa-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNewKey(random);
  };

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    if (keys.includes(newKey.trim())) {
      addToast("error", "该 Key 已存在");
      return;
    }
    setKeys([...keys, newKey.trim()]);
    setNewKey("");
  };

  const handleRemoveKey = (idx: number) => {
    const next = [...keys];
    next.splice(idx, 1);
    setKeys(next);
  };

  const handleSaveKeys = async () => {
    setSaving(true);
    try {
      await api.updateAPIKeys(keys);
      addToast("success", "客户端 API Key 已成功保存");
    } catch (e: any) {
      addToast("error", `保存失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentBaseUrl = (serverUrl || "http://127.0.0.1:8317") + "/v1";
  const sampleKey = keys[0] || "your-api-key";

  const snippets: Record<string, { label: string; code: string }> = {
    cursor: {
      label: "Cursor",
      code: `// Cursor 设置 -> Models -> OpenAI API Key
API Key: ${sampleKey}
Base URL: ${currentBaseUrl}

// 推荐模型填写：
claude-3-7-sonnet
gpt-5-codex
gemini-2.5-flash
grok-4.5`,
    },
    claudeCode: {
      label: "Claude Code CLI",
      code: `# 终端中配置 Claude Code 指向本地代理
export ANTHROPIC_BASE_URL="${serverUrl || "http://127.0.0.1:8317"}"
export ANTHROPIC_API_KEY="${sampleKey}"

# 启动 Claude Code
claude`,
    },
    python: {
      label: "Python (OpenAI SDK)",
      code: `from openai import OpenAI

client = OpenAI(
    base_url="${currentBaseUrl}",
    api_key="${sampleKey}"
)

response = client.chat.completions.create(
    model="claude-3-7-sonnet",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
    },
    curl: {
      label: "cURL",
      code: `curl ${currentBaseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -d '{
    "model": "claude-3-7-sonnet",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`,
    },
  };

  return (
    <div className="space-y-6">
      {/* Client API Keys Management */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="font-semibold text-white text-sm">下游客户端访问密钥 (API Keys)</h3>
              <p className="text-[11px] text-slate-400">
                供 Cursor、Continue、Cline、脚本等第三方应用调用 CLIProxyAPI 时的身份验证。
              </p>
            </div>
          </div>
          <button
            onClick={loadKeys}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Add Key Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-5">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="输入自定义 API Key 或点击生成..."
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-brand-500 transition"
          />
          <button
            onClick={handleGenerateKey}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" /> 随机生成
          </button>
          <button
            onClick={handleAddKey}
            disabled={!newKey.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> 添加到列表
          </button>
        </div>

        {/* Keys List */}
        {keys.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl mb-4">
            尚未配置任何 API Key。如需对下游调用鉴权，请至少添加一个密钥。
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {keys.map((k, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 group hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-xs w-6 text-center">{idx + 1}</span>
                  <span className="font-mono text-xs text-slate-200">{k}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(k, `Key #${idx + 1}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="复制 Key"
                  >
                    {copiedText === `Key #${idx + 1}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveKey(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="删除 Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveKeys}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存全部密钥
          </button>
        </div>
      </div>

      {/* Quickstart Integration Guide */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-semibold text-white text-sm">客户端接入示例与快捷配置</h3>
            <p className="text-[11px] text-slate-400">
              只需将 Base URL 与 API Key 填入支持 OpenAI / Anthropic 协议的应用中即可无缝使用。
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          {Object.entries(snippets).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setActiveSnippetTab(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeSnippetTab === key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Code block with copy button */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto">
          <button
            onClick={() => handleCopy(snippets[activeSnippetTab].code, snippets[activeSnippetTab].label)}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
          >
            {copiedText === snippets[activeSnippetTab].label ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> 已复制
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> 复制代码
              </>
            )}
          </button>
          <pre className="pr-20 whitespace-pre-wrap">{snippets[activeSnippetTab].code}</pre>
        </div>
      </div>
    </div>
  );
};

