import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import {
  Sliders,
  KeyRound,
  Save,
  RefreshCw,
  Globe,
  ShieldCheck,
  RotateCw,
  Bug,
  FileCode,
  FormInput,
  Eye,
  EyeOff,
} from "lucide-react";

export const ConfigTab: React.FC = () => {
  const { addToast, setIsAccountModalOpen, currentUser } = useApp();
  const { t } = useI18n();

  const [mode, setMode] = useState<"form" | "yaml">("form");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [proxyUrl, setProxyUrl] = useState<string>("");
  const [port, setPort] = useState<number>(8317);
  const [host, setHost] = useState<string>("");
  const [allowRemote, setAllowRemote] = useState<boolean>(true);
  const [secretKey, setSecretKey] = useState<string>("");
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [requestRetry, setRequestRetry] = useState<number>(3);
  const [routingStrategy, setRoutingStrategy] = useState<string>("round-robin");
  const [disableCooling, setDisableCooling] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [loggingToFile, setLoggingToFile] = useState<boolean>(false);

  // Raw YAML state
  const [yamlContent, setYamlContent] = useState<string>("");

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const yaml = await api.getConfigYAML();
      setYamlContent(yaml || "");
    } catch {}

    try {
      const cfg = await api.getConfig();
      if (cfg) {
        if (cfg["proxy-url"] !== undefined) setProxyUrl(cfg["proxy-url"] || "");
        if (cfg.port !== undefined) setPort(cfg.port);
        if (cfg.host !== undefined) setHost(cfg.host || "");
        if (cfg["request-retry"] !== undefined) setRequestRetry(cfg["request-retry"]);
        if (cfg["disable-cooling"] !== undefined) setDisableCooling(!!cfg["disable-cooling"]);
        if (cfg["logging-to-file"] !== undefined) setLoggingToFile(!!cfg["logging-to-file"]);
        if (cfg.debug !== undefined) setDebugMode(!!cfg.debug);
        if (cfg.routing && cfg.routing.strategy) setRoutingStrategy(cfg.routing.strategy);
        if (cfg["remote-management"]) {
          if (cfg["remote-management"]["allow-remote"] !== undefined) {
            setAllowRemote(!!cfg["remote-management"]["allow-remote"]);
          }
          // Do not load backend bcrypt hash into secretKey form state
        }
      }
    } catch {}

    setLoading(false);
  };

  const handleSaveForm = async () => {
    setSaving(true);
    try {
      let currentYaml = yamlContent;
      if (!currentYaml) {
        currentYaml = await api.getConfigYAML();
      }

      // Update fields in YAML cleanly
      currentYaml = updateYamlField(currentYaml, "proxy-url", `"${proxyUrl.trim()}"`);
      currentYaml = updateYamlField(currentYaml, "port", String(port));
      currentYaml = updateYamlField(currentYaml, "host", `"${host.trim()}"`);
      currentYaml = updateYamlField(currentYaml, "request-retry", String(requestRetry));
      currentYaml = updateYamlField(currentYaml, "disable-cooling", String(disableCooling));
      currentYaml = updateYamlField(currentYaml, "logging-to-file", String(loggingToFile));
      currentYaml = updateYamlField(currentYaml, "debug", String(debugMode));

      // Update nested remote-management
      if (currentYaml.includes("remote-management:")) {
        currentYaml = currentYaml.replace(
          /(remote-management:\s*[\s\S]*?allow-remote:\s*)(true|false)/,
          `$1${allowRemote}`
        );
        if (secretKey.trim() && !secretKey.trim().startsWith("$2")) {
          currentYaml = currentYaml.replace(
            /(remote-management:\s*[\s\S]*?secret-key:\s*)([^\r\n]*)/,
            `$1"${secretKey.trim()}"`
          );
          api.setSecretKey(secretKey.trim());
        }
      }

      // Update nested routing
      if (currentYaml.includes("routing:")) {
        currentYaml = currentYaml.replace(
          /(routing:\s*[\s\S]*?strategy:\s*)([^\r\n]*)/,
          `$1"${routingStrategy}"`
        );
      }

      await api.updateConfigYAML(currentYaml);
      setYamlContent(currentYaml);
      addToast("success", t("common.saveSuccess"));
    } catch (e: any) {
      addToast("error", `保存配置失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRawYaml = async () => {
    setSaving(true);
    try {
      await api.updateConfigYAML(yamlContent);
      addToast("success", t("common.saveSuccess"));
      await loadAllConfigs();
    } catch (e: any) {
      addToast("error", `更新失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateYamlField = (yaml: string, key: string, val: string) => {
    const regex = new RegExp(`(^|\\n)(${key}:\\s*)([^\\r\\n]*)`, "g");
    if (regex.test(yaml)) {
      return yaml.replace(regex, `$1${key}: ${val}`);
    }
    return yaml + `\n${key}: ${val}`;
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            {t("config.title")}
          </h2>
          <p className="text-[11px] text-slate-400">
            {t("config.desc")}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode("form")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "form"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FormInput className="w-3.5 h-3.5" />
            <span>{t("config.formModeBtn")}</span>
          </button>
          <button
            onClick={() => setMode("yaml")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "yaml"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{t("config.yamlModeBtn")}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          {t("common.loading")}
        </div>
      ) : mode === "form" ? (
        /* Visual Form Mode */
        <div className="space-y-6">
          {/* Card 1: Outbound Proxy Settings */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Globe className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">{t("config.proxyTitle")}</h3>
                <p className="text-[11px] text-slate-400">
                  {t("config.proxyDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                {t("config.proxyUrlLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder={t("config.proxyPlaceholder")}
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"
                />
                {proxyUrl && (
                  <button
                    type="button"
                    onClick={() => setProxyUrl("")}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition shrink-0"
                  >
                    {t("common.directConnection")}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {t("config.proxyHelp")}
              </p>
            </div>
          </div>

          {/* Card 2: Security & Management */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{t("config.secTitle")}</h3>
                  <p className="text-[11px] text-slate-400">
                    {t("config.secDesc")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-xs font-semibold text-brand-300 transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                <span>{t("config.changeCredsBtn")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t("config.allowRemoteLabel")}</span>
                  <span className="text-[11px] text-slate-500">{t("config.allowRemoteDesc")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowRemote(!allowRemote)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    allowRemote ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {allowRemote ? t("config.allowRemoteYes") : t("config.allowRemoteNo")}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("config.secretKeyLabel")}
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={t("config.secretKeyPlaceholder")}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-3.5 pr-10 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Scheduling & Fault Tolerance */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <RotateCw className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">{t("config.routeTitle")}</h3>
                <p className="text-[11px] text-slate-400">
                  {t("config.routeDesc")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("config.strategyLabel")}
                </label>
                <select
                  value={routingStrategy}
                  onChange={(e) => setRoutingStrategy(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="round-robin">{t("routing.strategyRR")}</option>
                  <option value="weighted-round-robin">{t("routing.strategyWRR")}</option>
                  <option value="fill-first">{t("routing.strategyFF")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t("config.retryLabel")}
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={requestRetry}
                  onChange={(e) => setRequestRetry(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t("config.coolingLabel")}</span>
                  <span className="text-[10px] text-slate-500">{t("config.coolingDesc")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDisableCooling(!disableCooling)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !disableCooling ? "bg-emerald-600 text-white" : "bg-rose-950 text-rose-300"
                  }`}
                >
                  {!disableCooling ? t("config.coolingEnabled") : t("config.coolingDisabled")}
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Diagnostics & Logging */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Bug className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">{t("config.logTitle")}</h3>
                <p className="text-[11px] text-slate-400">
                  {t("config.logDesc")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t("config.debugModeLabel")}</span>
                  <span className="text-[11px] text-slate-500">{t("config.debugModeDesc")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDebugMode(!debugMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    debugMode ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {debugMode ? t("config.debugOn") : t("config.debugOff")}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t("config.logToFileLabel")}</span>
                  <span className="text-[11px] text-slate-500">{t("config.logToFileDesc")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLoggingToFile(!loggingToFile)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    loggingToFile ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {loggingToFile ? t("config.debugOn") : t("config.debugOff")}
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={loadAllConfigs}
              disabled={loading || saving}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
            >
              {t("config.resetBtn")}
            </button>
            <button
              onClick={handleSaveForm}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t("config.saveFormBtn")}
            </button>
          </div>
        </div>
      ) : (
        /* Raw YAML Editor Mode */
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-brand-400" />
              <div>
                <h3 className="font-semibold text-white text-sm">{t("config.yamlTitle")}</h3>
                <p className="text-[11px] text-slate-400">{t("config.yamlDesc")}</p>
              </div>
            </div>
            <button
              onClick={handleSaveRawYaml}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t("config.saveYamlBtn")}
            </button>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <textarea
              rows={22}
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              className="w-full bg-transparent p-4 text-slate-200 font-mono text-xs focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
