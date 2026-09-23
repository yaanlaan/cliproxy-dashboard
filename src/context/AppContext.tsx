import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { AuthFile, LatestVersionInfo, ServerVersionInfo } from "../types";

export type TabType = "overview" | "accounts" | "routing" | "keys" | "playground" | "config";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface AppContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  secretKey: string;
  setSecretKey: (key: string) => void;
  isConnected: boolean;
  latencyMs: number;
  versionInfo?: ServerVersionInfo;
  latestVersion?: LatestVersionInfo;
  authFiles: AuthFile[];
  isLoadingAuthFiles: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  refreshAll: () => Promise<void>;
  toasts: Toast[];
  addToast: (type: "success" | "error" | "info", message: string) => void;
  removeToast: (id: string) => void;
  isConnectionModalOpen: boolean;
  setIsConnectionModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState<string>(() => api.getServerUrl());
  const [secretKey, setSecretKeyState] = useState<string>(() => api.getSecretKey() || "123456");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [versionInfo, setVersionInfo] = useState<ServerVersionInfo | undefined>();
  const [latestVersion, setLatestVersion] = useState<LatestVersionInfo | undefined>();
  const [authFiles, setAuthFiles] = useState<AuthFile[]>([]);
  const [isLoadingAuthFiles, setIsLoadingAuthFiles] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setServerUrl = (url: string) => {
    api.setServerUrl(url);
    setServerUrlState(url);
  };

  const setSecretKey = (key: string) => {
    api.setSecretKey(key);
    setSecretKeyState(key);
  };

  const checkConnection = useCallback(async () => {
    const res = await api.checkHealth();
    setIsConnected(res.ok);
    setLatencyMs(res.latencyMs);
    if (res.ok && res.versionInfo) {
      setVersionInfo(res.versionInfo);
    }
    return res.ok;
  }, []);

  const loadAuthFiles = useCallback(async () => {
    setIsLoadingAuthFiles(true);
    try {
      const files = await api.listAuthFiles();
      setAuthFiles(files);
    } catch (err: any) {
      // If management key isn't provided or invalid
      console.warn("Failed to load auth files:", err.message);
    } finally {
      setIsLoadingAuthFiles(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const connected = await checkConnection();
    if (connected) {
      await loadAuthFiles();
      try {
        const latest = await api.getLatestVersion();
        setLatestVersion(latest);
      } catch {}
    }
  }, [checkConnection, loadAuthFiles]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      checkConnection();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshAll, checkConnection]);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        setServerUrl,
        secretKey,
        setSecretKey,
        isConnected,
        latencyMs,
        versionInfo,
        latestVersion,
        authFiles,
        isLoadingAuthFiles,
        activeTab,
        setActiveTab,
        refreshAll,
        toasts,
        addToast,
        removeToast,
        isConnectionModalOpen,
        setIsConnectionModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

