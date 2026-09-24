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
  isAuthenticated: boolean;
  currentUser: string;
  login: (username: string, password: string, customServerUrl?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
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
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  updateAdminCredentials: (newUsername: string, newPassword?: string) => Promise<{ ok: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState<string>(() => api.getServerUrl());
  const [secretKey, setSecretKeyState] = useState<string>(() => {
    return localStorage.getItem("cpa_secret_key") || "";
  });
  
  // Login & Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("cpa_is_authenticated") === "true";
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem("cpa_auth_user") || "admin";
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [versionInfo, setVersionInfo] = useState<ServerVersionInfo | undefined>();
  const [latestVersion, setLatestVersion] = useState<LatestVersionInfo | undefined>();
  const [authFiles, setAuthFiles] = useState<AuthFile[]>([]);
  const [isLoadingAuthFiles, setIsLoadingAuthFiles] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

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
      console.warn("Failed to load auth files:", err.message);
    } finally {
      setIsLoadingAuthFiles(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const connected = await checkConnection();
    // CRITICAL SECURITY FIX: Only fetch management endpoints if user is authenticated!
    if (connected && isAuthenticated) {
      await loadAuthFiles();
      try {
        const latest = await api.getLatestVersion();
        setLatestVersion(latest);
      } catch {}
    }
  }, [checkConnection, loadAuthFiles, isAuthenticated]);

  const login = async (
    username: string,
    password: string,
    customUrl?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const prevKey = api.getSecretKey();
    const prevUrl = api.getServerUrl();

    try {
      if (customUrl) {
        api.setServerUrl(customUrl);
      }
      api.setSecretKey(password);

      // 1. Check healthz first (no auth needed, tests basic network connectivity)
      const health = await api.checkHealth();
      if (!health.ok) {
        api.setSecretKey(prevKey);
        api.setServerUrl(prevUrl);
        return { ok: false, error: "服务不可达，请检查服务器地址是否正确" };
      }

      // 2. Test management key authentication once
      try {
        await api.listAuthFiles();
      } catch (authErr: any) {
        api.setSecretKey(prevKey);
        api.setServerUrl(prevUrl);
        if (authErr.message?.includes("IP banned")) {
          return { ok: false, error: authErr.message };
        }
        if (authErr.message?.includes("401") || authErr.message?.includes("invalid")) {
          return { ok: false, error: "管理密码错误，请检查输入的密码是否与后端配置一致" };
        }
        if (authErr.message?.includes("404")) {
          return { ok: false, error: "后端管理功能未启用 (404)，请检查 config.yaml 中已配置 secret-key" };
        }
        return { ok: false, error: `鉴权未通过: ${authErr.message}` };
      }

      // 3. Login Successful!
      setSecretKey(password);
      if (customUrl) setServerUrl(customUrl);
      setCurrentUser(username);
      setIsAuthenticated(true);
      localStorage.setItem("cpa_is_authenticated", "true");
      localStorage.setItem("cpa_auth_user", username);
      localStorage.setItem("cpa_secret_key", password);
      addToast("success", `登录成功，欢迎管理员 ${username}！`);
      return { ok: true };
    } catch (e: any) {
      api.setSecretKey(prevKey);
      api.setServerUrl(prevUrl);
      return { ok: false, error: e.message || "登录出现异常" };
    }
  };

  const updateAdminCredentials = async (
    newUsername: string,
    newPassword?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (newPassword) {
        let currentYaml = await api.getConfigYAML();
        if (currentYaml.includes("remote-management:")) {
          currentYaml = currentYaml.replace(
            /(remote-management:\s*[\s\S]*?secret-key:\s*)([^\r\n]*)/,
            `$1"${newPassword.trim()}"`
          );
        } else {
          currentYaml += `\nremote-management:\n  allow-remote: true\n  secret-key: "${newPassword.trim()}"\n`;
        }
        await api.updateConfigYAML(currentYaml);
        setSecretKey(newPassword.trim());
        localStorage.setItem("cpa_secret_key", newPassword.trim());
      }

      setCurrentUser(newUsername.trim());
      localStorage.setItem("cpa_auth_user", newUsername.trim());
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || "更新配置失败" };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cpa_is_authenticated");
    localStorage.removeItem("cpa_secret_key");
    api.setSecretKey("");
    setSecretKey("");
    addToast("info", "已安全退出控制台");
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
      const interval = setInterval(() => {
        checkConnection();
      }, 15000);
      return () => clearInterval(interval);
    } else {
      // Unauthenticated: only check /healthz for basic server status
      checkConnection();
    }
  }, [isAuthenticated, refreshAll, checkConnection]);

  return (
    <AppContext.Provider
      value={{
        serverUrl,
        setServerUrl,
        secretKey,
        setSecretKey,
        isAuthenticated,
        currentUser,
        login,
        logout,
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
        isAccountModalOpen,
        setIsAccountModalOpen,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        updateAdminCredentials,
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

