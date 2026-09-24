export interface AuthFile {
  id: string;
  auth_index?: number;
  name: string;
  type: string;
  provider: string;
  label?: string;
  status: string;
  status_message?: string;
  disabled?: boolean;
  unavailable?: boolean;
  runtime_only?: boolean;
  success?: number;
  failed?: number;
  size?: number;
  cooldowns?: Record<string, string> | null;
  quota?: Record<string, any> | null;
  model_quotas?: Record<string, any> | null;
  supports_quota?: boolean;
  next_retry_after?: string;
}

export interface AuthFilesResponse {
  files?: AuthFile[];
  total?: number;
  page?: number;
  page_size?: number;
}

export interface ServerVersionInfo {
  version: string;
  commit: string;
  buildDate: string;
  supportPlugin: boolean;
}

export interface LatestVersionInfo {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  body?: string;
}

export interface RoutingConfig {
  strategy: "round-robin" | "weighted-round-robin" | "fill-first" | string;
}

export interface ModelAliasMap {
  [alias: string]: string;
}

export interface ModelItem {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  data: ModelItem[];
  object: string;
}

export interface ConfigData {
  host?: string;
  port?: number;
  debug?: boolean;
  "api-keys"?: string[];
  routing?: {
    strategy?: string;
  };
  "remote-management"?: {
    "allow-remote"?: boolean;
    "secret-key"?: string;
  };
  [key: string]: any;
}

export interface OAuthAuthUrlResponse {
  url?: string;
  auth_url?: string;
  session_id?: string;
  user_code?: string;
  flow?: string;
  state?: string;
  error?: string;
}

export interface OAuthStatusResponse {
  status: "pending" | "success" | "failed" | "error" | string;
  message?: string;
  error?: string;
}


