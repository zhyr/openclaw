# 安装 OpenClaw 后完成一个任务：发消息并收到回复

本指南帮助你在安装并启动 OpenClaw 后，**在聊天里发一条消息并成功收到 Agent 回复**。若你看到红色报错 **「Ollama API error 400: gemma3:12b does not support tools」** 或发消息后一直不回复，按下面步骤处理即可。

---

## 目标

- 在 **Dashboard → 聊天** 里输入一条消息（例如「hello」），点击发送。
- Agent 使用**支持工具调用**的模型正常回复，不再报错、不卡住。

---

## 第一步：确认 Gateway 与 Dashboard 已启动

- 已执行 `./start.sh` 或先 `pnpm gateway:dev` 再 `pnpm openclaw --dev dashboard`。
- 浏览器已打开带 token 的链接（如 `http://127.0.0.1:19001/#token=...`），左侧显示「聊天」「控制」「设置」等，顶部健康状况为「正常」。

---

## 第二步：解决「不回复」或「does not support tools」

发消息不回复或出现 **「gemma3:12b does not support tools」**，是因为当前默认模型（gemma3:12b）**不支持工具调用**，而 OpenClaw 对话会使用工具，导致请求失败。需要做两件事：

1. **让 OpenClaw 识别到你本机的 Ollama 模型**（若发现失败，就显式写进配置）。
2. **把默认模型改成支持工具的模型**（如 qwen3.5、gpt-oss、deepseek-r1、phi4-reasoning 等）。

### 方式 A：在 Dashboard 界面里改配置（推荐）

1. 左侧点击 **设置** → **配置**（即 Configuration）。
2. 在配置页**左侧**一列（All Settings、环境、代理、频道等）的**最下方**，有两个标签：**Form**（当前多为红色高亮）和 **Raw**。点击 **Raw**，中间区域会变为整份 JSON 文本，即可直接编辑。
3. 在 **`~/.openclaw-dev/openclaw.json`**（dev）对应的内容里做两处修改（若已有同名 key，则合并或覆盖对应字段）：

   **（1）显式配置 Ollama，避免「没识别出来」**

   在根对象下增加或合并 `models.providers.ollama`（注意不要重复写顶层的 `gateway`、`agents` 等，只加/改 `models` 这一段）：

   ```json
   "models": {
     "providers": {
       "ollama": {
         "baseUrl": "http://127.0.0.1:11434",
         "apiKey": "ollama-local",
         "api": "ollama",
         "models": [
           { "id": "qwen3.5:latest", "name": "qwen3.5", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 },
           { "id": "gpt-oss:latest", "name": "gpt-oss", "reasoning": false, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 },
           { "id": "deepseek-r1:1.5b", "name": "deepseek-r1:1.5b", "reasoning": true, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 },
           { "id": "phi4-reasoning:latest", "name": "phi4-reasoning", "reasoning": true, "input": ["text"], "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }, "contextWindow": 32768, "maxTokens": 8192 }
         ]
       }
     }
   }
   ```

   `id` 用你本机 `ollama list` 里的 **NAME**（如 `qwen3.5:latest`）。`baseUrl` 不要加 `/v1`。

   **（2）把默认模型改为上面列表里支持工具的某一个**

   在根对象下增加或修改 `agents`，例如：

   ```json
   "agents": {
     "defaults": {
       "model": { "primary": "ollama/qwen3.5:latest" }
     },
     "list": [
       {
         "id": "dev",
         "default": true,
         "model": { "primary": "ollama/qwen3.5:latest" }
       }
     ]
   }
   ```

   若你已有 `agents.list`，只改第一个 agent 的 `model.primary` 为 `ollama/qwen3.5:latest`（或 `ollama/gpt-oss:latest` 等）即可。

4. 点击 **Save** / **Apply** 保存并应用。配置会热加载，**无需重启** Gateway。

**若改完配置后仍然报 gemma3:12b：** 说明**当前会话**里还保存着之前选过的模型，优先级高于配置里的默认模型。任选其一即可：

- **新建会话**：在 Dashboard 左侧聊天里新建一个会话，在新会话里发消息（新会话会使用配置默认 qwen3.5）。
- **在当前会话切模型**：在输入框里只发一条：`/model ollama/qwen3.5:latest`，发送后再发普通消息。
- **清空会话模型覆盖**：关闭 Gateway 后，删除或编辑会话存储文件（默认路径：`~/.openclaw/agents/dev/sessions/sessions.json`）。删除该文件后，所有会话会重新用配置默认模型；若只想去掉覆盖，可打开该 JSON，把对应会话 key 下的 `modelOverride`、`providerOverride`、`model`、`modelProvider` 字段删掉后保存。

### 方式 B：用命令行改（与界面等效）

在仓库根目录执行（dev 配置会写入 `~/.openclaw-dev/openclaw.json`）：

```bash
# 将默认模型改为支持工具的 Ollama 模型（按你本机 ollama list 的 NAME 替换）
pnpm openclaw --dev config set agents.defaults.model.primary "ollama/qwen3.5:latest"
pnpm openclaw --dev config set agents.list.0.model.primary "ollama/qwen3.5:latest"
```

若 Ollama 模型此前未被发现，仍需在 **设置 → 配置 → Raw** 里按方式 A 的（1）补全 `models.providers.ollama`。

---

## 第三步：回到聊天再发一条消息

1. 左侧点 **聊天**，回到当前会话（或选默认会话）。
2. 在底部输入框输入任意一句话（例如「hello」或「简单介绍一下你自己」），回车或点 **Send**。
3. 若配置正确，Agent 会开始流式输出回复；若仍报错，检查：
   - `agents.defaults.model.primary` / `agents.list[0].model.primary` 是否已改为 `ollama/qwen3.5:latest` 等**支持工具**的模型；
   - `models.providers.ollama` 是否包含该模型且 `baseUrl` 为 `http://127.0.0.1:11434`（无 `/v1`）。

至此，**「安装 OpenClaw 后完成一个任务」** 即：配置好模型 → 在聊天里发消息 → 收到回复。更多启动方式、多模型与外部服务（OpenAI/Claude/Gemini 等）配置见 **手工启动运行.md**。

---

## 可选：Bot 名称与回复语言

- **聊天里显示的 Bot 名称**：在 Raw 配置的 **agents.list[].identity.name** 中填写（例如 `"identity": { "name": "我的助手", "theme": "...", "emoji": "🤖" }`）。Chat 会优先使用该名称；若仍不对，可去掉或清空 **ui.assistant.name** 后刷新页面或切换会话再试。
- **让 Bot 用中文回复**：在 Raw 的 **agents.defaults** 下增加 **replyLanguage: "zh-Hans"**（或 `"zh-CN"`），保存后新对话会带上「优先用简体中文回复」的 system 指令；已有会话需新建会话或重新发消息才会生效。
