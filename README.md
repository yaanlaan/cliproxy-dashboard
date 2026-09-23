# CLIProxy Dashboard

<div align="center">

<br />

**现代、高颜值、易用的 [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) 专属 Web 管理控制台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[功能特性](#-功能特性) • [快速启动](#-快速启动) • [Docker 部署](#-docker-容器化部署) • [客户端接入指南](#-客户端接入指南) • [开源许可](#-开源许可)

<br />

</div>

---

## 📖 项目简介

**CLIProxy Dashboard** 是专为开源反向代理服务 [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) 量身打造的现代化 Web 控制台。

它通过直观的可视化界面，彻底摆脱繁琐的手动编辑配置文件，支持**多账号池监控、全平台 OAuth 网页授权、局域网/跨设备登录辅助、多调度策略切换、客户端 API Key 管理、在线 YAML 热更新以及原生 SSE 流式 API 连通性测试**。

---

## ✨ 核心特性

- ⚡ **开箱即用 & 毫秒级探测**：自动检测 CLIProxyAPI 服务存活、Ping 延迟、Git 提交版本与最新 Release 更新。
- 👥 **多账号与凭据池统一管理**：
  - 分类直观查看 **Claude Code**、**OpenAI Codex**、**Google Antigravity / Gemini**、**xAI Grok**、**Moonshot Kimi**、**Devin** 账号状态。
  - 实时识别凭据健康（正常就绪、限流冷却 Cooldown、异常或禁用），统计各凭据成功/失败调用次数。
  - 支持单账号 / 批量强制刷新 Token，一键重置配额与解除冷却。
- 🔑 **一键 OAuth 网页授权 & 局域网跨设备辅助**：
  - 在网页中一键唤起官方 OAuth 授权，前端全自动轮询授权状态。
  - **特色「局域网授权辅助」**：在远程设备或手机端登录时，即使浏览器跳转到无法访问的 `localhost` 页面，只需一键复制地址栏网址粘贴到面板，即可秒级完成授权换码！
  - 完整支持 Kimi 等平台的 Device Code 8 位设备码登录。
- 🔀 **智能调度与模型别名映射 (Model Aliases)**：
  - 自由切换 **轮询调度 (Round Robin)**、**加权轮询 (Weighted)**、**顺序填满 (Fill First)**。
  - 可视化编辑客户端请求模型与真实上游模型的映射规则（如 `gpt-4o` ➔ `gpt-5-codex`）。
  - 实时从 `/v1/models` 同步当前可用的模型清单。
- 🛡️ **客户端 API Key 统一管理**：
  - 便捷添加、随机生成与删除供 Cursor、Continue、Cline 等客户端调用的访问 Key。
  - 内置全套快捷接入代码模板（Cursor、Claude Code CLI、Python OpenAI SDK、cURL 等）。
- 🧪 **API 在线连通性调试台 (Playground)**：
  - 在线选择模型并发送 Prompt，实时查看打字机式 **SSE 流式响应**、延迟及耗时，支持随时中断。
- ⚙️ **在线 YAML 配置热更新**：
  - 直接在浏览器中查看与修改 `config.yaml`，保存即自动触发后端 Hot-Reload，**无需重启服务进程**。

---

## 🚀 快速启动

### 本地开发与调试

```bash
# 1. 克隆本仓库
git clone https://github.com/yaanlaan/cliproxy-dashboard.git
cd cliproxy-dashboard

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

启动后访问 `http://localhost:5173`（或配置的端口）。Vite 已内置反向代理，默认自动转发请求至本地 `http://127.0.0.1:8317`。

---

## 🐳 Docker 容器化部署

### 方案 1：前后端一键全家桶部署 (推荐)

在项目根目录下使用 `docker-compose.yml`，一键同时拉取运行后端 `cli-proxy-api` 与前端 `cliproxy-dashboard`：

```yaml
services:
  cli-proxy-api:
    image: eceasy/cli-proxy-api:latest
    container_name: cli-proxy-api
    ports:
      - "8317:8317"
      # OAuth 回调端口
      - "1455:1455"
      - "54545:54545"
      - "51121:51121"
      - "11451:11451"
    volumes:
      - ./config.yaml:/CLIProxyAPI/config.yaml
      - ./auths:/root/.cli-proxy-api
      - ./logs:/CLIProxyAPI/logs
    restart: unless-stopped
    networks:
      - cpa-network

  cliproxy-dashboard:
    build: .
    image: cliproxy-dashboard:latest
    container_name: cliproxy-dashboard
    ports:
      - "12345:80"
    environment:
      - BACKEND_HOST=cli-proxy-api
      - BACKEND_PORT=8317
    depends_on:
      - cli-proxy-api
    restart: unless-stopped
    networks:
      - cpa-network

networks:
  cpa-network:
    driver: bridge
```

运行：
```bash
docker compose up -d
```
- **控制台访问**：`http://<服务器IP>:12345/`
- **代理接口地址**：`http://<服务器IP>:8317/v1`

---

### 方案 2：独立前端容器部署

若后端已在宿主机或其他服务器上运行：

```bash
docker build -t cliproxy-dashboard .

docker run -d \
  --name cliproxy-dashboard \
  -p 12345:80 \
  -e BACKEND_HOST=host.docker.internal \
  -e BACKEND_PORT=8317 \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  cliproxy-dashboard
```

---

## 📦 构建单文件 `management.html`

本控制台支持直接编译为**单个纯 HTML 文件**（全量 CSS 与 JS 深度内联打包），用于直接替代 CLIProxyAPI 自带的控制台：

```bash
npm run build:singlefile
```
构建生成的文件位于 `dist/index.html`（大小仅 ~260KB）。将其重命名为 `management.html` 放入 CLIProxyAPI 根目录，即可直接通过原生的 `http://127.0.0.1:8317/management.html` 访问！

---

## 💻 客户端接入指南

通过控制台配置好账号后，在支持 OpenAI 或 Anthropic 协议的工具中填入以下配置即可开箱即用：

### Cursor
- **Base URL**：`http://<服务器IP>:8317/v1`
- **API Key**：控制台中配置的客户端 Key（如 `sk-cpa-master-key`）
- **推荐模型**：`claude-3-7-sonnet`、`gpt-5-codex`、`gemini-2.5-flash`

### Claude Code CLI
```bash
export ANTHROPIC_BASE_URL="http://<服务器IP>:8317"
export ANTHROPIC_API_KEY="sk-cpa-master-key"
claude
```

---

## 🤝 鸣谢与生态

- 核心代理引擎：感谢 [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) 团队打造的优秀基础设施。
- 图标库：[Lucide React](https://lucide.dev/)
- 样式库：[Tailwind CSS](https://tailwindcss.com/)

---

## 📄 开源许可

本项目遵循 [MIT License](LICENSE) 开源许可证。
