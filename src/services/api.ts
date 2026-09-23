import {
  AuthFile,
  AuthFilesResponse,
  ConfigData,
  LatestVersionInfo,
  ModelAliasMap,
  ModelsResponse,
  OAuthAuthUrlResponse,
  OAuthStatusResponse,
  RoutingConfig,
  ServerVersionInfo,
} from "../types";

class ApiService {
  private serverUrl: string = localStorage.getItem("cpa_server_url") || "";
  private secretKey: string = localStorage.getItem("cpa_secret_key") ?? "123456";

  constructor() {
    if (!this.serverUrl) {
      // In browser, default to current origin or http://127.0.0.1:8317
      this.serverUrl = window.location.port === "5173" ? "" : window.location.origin;
    }
  }

  getServerUrl(): string {
    return this.serverUrl;
  }

  setServerUrl(url: string) {
    this.serverUrl = url.replace(/\/+$/, "");
    localStorage.setItem("cpa_server_url", this.serverUrl);
  }

  getSecretKey(): string {
    return this.secretKey;
  }

  setSecretKey(key: string) {
    this.secretKey = key;
    localStorage.setItem("cpa_secret_key", key);
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.secretKey) {
      headers["Authorization"] = `Bearer ${this.secretKey}`;
    }
    // extraHeaders must override default headers (e.g. client API key overrides management key)
    return {
      ...headers,
      ...extraHeaders,
    };
  }

  private buildUrl(path: string): string {
    if (!path.startsWith("/")) path = "/" + path;
    if (!this.serverUrl) return path;
    return `${this.serverUrl}${path}`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<{ data: T; headers: Headers; status: number }> {
    const url = this.buildUrl(path);
    const headers = this.getHeaders((options.headers as Record<string, string>) || {});

    const resp = await fetch(url, {
      ...options,
      headers,
    });

    if (!resp.ok) {
      let errMsg = `Request failed (${resp.status})`;
      try {
        const errJson = await resp.json();
        errMsg = errJson.error || errJson.message || errMsg;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    const contentType = resp.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await resp.json();
      return { data, headers: resp.headers, status: resp.status };
    }
    const textData = (await resp.text()) as unknown as T;
    return { data: textData, headers: resp.headers, status: resp.status };
  }

  // Health check
  async checkHealth(): Promise<{ ok: boolean; versionInfo?: ServerVersionInfo; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await this.request<{ status?: string }>("/healthz");
      const latencyMs = Math.round(performance.now() - start);
      const versionInfo: ServerVersionInfo = {
        version: res.headers.get("X-CPA-VERSION") || "dev",
        commit: res.headers.get("X-CPA-COMMIT") || "none",
        buildDate: res.headers.get("X-CPA-BUILD-DATE") || "unknown",
        supportPlugin: res.headers.get("X-CPA-SUPPORT-PLUGIN") === "true",
      };
      return { ok: true, versionInfo, latencyMs };
    } catch {
      return { ok: false, latencyMs: Math.round(performance.now() - start) };
    }
  }

  // Latest version
  async getLatestVersion(): Promise<LatestVersionInfo> {
    const res = await this.request<LatestVersionInfo>("/v0/management/latest-version");
    return res.data;
  }

  // Auth Files
  async listAuthFiles(): Promise<AuthFile[]> {
    const res = await this.request<AuthFilesResponse | AuthFile[]>("/v0/management/auth-files");
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return res.data.files || [];
  }

  async deleteAuthFile(name: string): Promise<void> {
    await this.request(`/v0/management/auth-files?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  async refreshAuthFiles(name?: string, all?: boolean): Promise<{ refreshed: number }> {
    const res = await this.request<{ refreshed: number }>("/v0/management/auth-files/refresh", {
      method: "POST",
      body: JSON.stringify({ name: name || "", all: !!all }),
    });
    return res.data;
  }

  async resetQuota(authIndex: string): Promise<void> {
    await this.request("/v0/management/reset-quota", {
      method: "POST",
      body: JSON.stringify({ auth_index: authIndex }),
    });
  }

  async uploadAuthFile(filename: string, content: string): Promise<void> {
    await this.request("/v0/management/auth-files", {
      method: "POST",
      body: JSON.stringify({ name: filename, content }),
    });
  }

  // OAuth Flows
  async getOAuthUrl(provider: string): Promise<OAuthAuthUrlResponse> {
    const map: Record<string, string> = {
      claude: "/v0/management/anthropic-auth-url?is_webui=true",
      codex: "/v0/management/codex-auth-url?is_webui=true",
      antigravity: "/v0/management/antigravity-auth-url?is_webui=true",
      kimi: "/v0/management/kimi-auth-url?is_webui=true",
      "kimi-ai": "/v0/management/kimi-ai-auth-url?is_webui=true",
      xai: "/v0/management/xai-auth-url?is_webui=true",
      devin: "/v0/management/devin-auth-url?is_webui=true",
      meta: "/v0/management/meta-auth-url?is_webui=true",
    };
    const path = map[provider.toLowerCase()] || map["claude"];
    const res = await this.request<OAuthAuthUrlResponse>(path);
    return res.data;
  }

    async submitOAuthCallback(provider: string, redirectUrl: string): Promise<void> {
    await this.request("/v0/management/oauth-callback", {
      method: "POST",
      body: JSON.stringify({
        provider,
        redirect_url: redirectUrl.trim(),
      }),
    });
  }

  async getAuthStatus(): Promise<OAuthStatusResponse> {
    const res = await this.request<OAuthStatusResponse>("/v0/management/get-auth-status");
    return res.data;
  }

  async cancelOAuthSession(): Promise<void> {
    await this.request("/v0/management/oauth-session", {
      method: "DELETE",
    });
  }

  // Routing Strategy
  async getRoutingStrategy(): Promise<RoutingConfig> {
    const res = await this.request<RoutingConfig>("/v0/management/routing/strategy");
    return res.data;
  }

  async updateRoutingStrategy(strategy: string): Promise<void> {
    await this.request("/v0/management/routing/strategy", {
      method: "PUT",
      body: JSON.stringify({ strategy }),
    });
  }

  // Model Aliases
  async getOAuthModelAlias(): Promise<ModelAliasMap> {
    const res = await this.request<ModelAliasMap>("/v0/management/oauth-model-alias");
    return res.data || {};
  }

  async updateOAuthModelAlias(aliases: ModelAliasMap): Promise<void> {
    await this.request("/v0/management/oauth-model-alias", {
      method: "PUT",
      body: JSON.stringify(aliases),
    });
  }

  // API Keys (Clients)
  async getAPIKeys(): Promise<string[]> {
    const res = await this.request<{ "api-keys"?: string[] } | string[]>("/v0/management/api-keys");
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return res.data["api-keys"] || [];
  }

  async updateAPIKeys(apiKeys: string[]): Promise<void> {
    await this.request("/v0/management/api-keys", {
      method: "PUT",
      body: JSON.stringify({ "api-keys": apiKeys }),
    });
  }

  // Config
  async getConfig(): Promise<ConfigData> {
    const res = await this.request<ConfigData>("/v0/management/config");
    return res.data;
  }

  async getConfigYAML(): Promise<string> {
    const res = await this.request<string>("/v0/management/config.yaml");
    return res.data;
  }

  async updateConfigYAML(yamlStr: string): Promise<void> {
    await this.request("/v0/management/config.yaml", {
      method: "PUT",
      headers: { "Content-Type": "text/yaml" },
      body: yamlStr,
    });
  }

  // Debug
  async getDebug(): Promise<boolean> {
    const res = await this.request<{ debug: boolean }>("/v0/management/debug");
    return !!res.data.debug;
  }

  async setDebug(debug: boolean): Promise<void> {
    await this.request("/v0/management/debug", {
      method: "PUT",
      body: JSON.stringify({ debug }),
    });
  }

  // Models list
  async listModels(clientApiKey?: string): Promise<ModelsResponse> {
    let keyToUse = clientApiKey?.trim() || localStorage.getItem("cpa_playground_key") || "";
    if (!keyToUse || keyToUse === this.secretKey) {
      try {
        const keys = await this.getAPIKeys();
        if (keys && keys.length > 0) {
          keyToUse = keys[0];
          localStorage.setItem("cpa_playground_key", keyToUse);
        }
      } catch {}
    }

    const headers: Record<string, string> = {};
    if (keyToUse) {
      headers["Authorization"] = `Bearer ${keyToUse}`;
    }

    const res = await this.request<ModelsResponse>("/v1/models", { headers });
    return res.data;
  }

  // Stream chat completion tester
  async streamChat(
    model: string,
    prompt: string,
    apiKey: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = this.buildUrl("/v1/chat/completions");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey || this.secretKey}`,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!resp.ok) {
      let errMsg = `Stream failed (${resp.status})`;
      try {
        const errJson = await resp.json();
        errMsg = errJson.error?.message || errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("No response stream body");

    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            accumulated += delta;
            onChunk(delta);
          }
        } catch {
          // ignore partial json
        }
      }
    }

    return accumulated;
  }
}

export const api = new ApiService();




