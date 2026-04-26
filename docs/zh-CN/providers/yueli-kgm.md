# Yueli KGM (阅粒知识计算引擎)

Yueli KGM (Knowledge Graph & Model Runtime) 是一个自托管的 OpenAI/Anthropic 兼容网关与编排层，内建进程内 Native 推理与受管模型控制面。

## 核心能力

- **本地推理引擎**: 支持 Qwen、GLM、Gemma、MiniMax、MiMo、vMLX 等模型
- **KGM 扩展**: 工具调用、图谱信号、检索、观测等
- **OpenAI 兼容**: `/v1/chat/completions` 接口
- **混合检索**: BM25 + 向量混合检索
- **图计算**: 社区发现、推理扩展、规则推理

## 支持的模型

| 模型系列             | 支持尺寸        |
| -------------------- | --------------- |
| Qwen 3.5/3.6         | 7B/14B/32B/72B  |
| GLM 5.0/5.1          | 9B/32B          |
| Google Gemma 4       | 2B/4B/9B/27B    |
| MiniMax 2.5/2.7      | 4B/8B/32B/456B  |
| MiMo 2.5             | 1.5B/7B/13B/30B |
| vMLX (Apple Silicon) | M1/M2/M3/M4     |

## 快速开始

### 1. 安装 Yueli KGM

```bash
npm install @haxitag/yueli-kgm-computing
```

### 2. 配置环境变量

```bash
# LLM 配置（必需）
export KGM_LLM_BASE_URL="https://api.openai.com/v1"
export KGM_LLM_API_KEY="sk-your-key"
export KGM_LLM_MODEL="gpt-4o-mini"

# 可选：安全配置
export KGM_HTTP_API_KEY="your-api-key"
export KGM_HTTP_AUTH_EXEMPT="/health,/api"

# 可选：限流配置
export KGM_HTTP_RATE_LIMIT_MAX=100
export KGM_HTTP_RATE_LIMIT_WINDOW_MS=60000
```

### 3. 启动服务

```bash
node ./node_modules/@haxitag/yueli-kgm-computing/dist/server/enhancedStart.js
```

### 4. 在 OpenClaw 中启用

启用 Yueli KGM 最简单的方式是通过环境变量：

```bash
export YUELI_KGM_API_KEY="yueli-kgm-local"
```

或者在配置文件中设置：

```json5
{
  models: {
    providers: {
      "yueli-kgm": {
        baseUrl: "http://127.0.0.1:3000/v1",
        apiKey: "yueli-kgm-local",
        api: "openai-completions",
      },
    },
  },
}
```

## 使用 Yueli KGM 模型

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "yueli-kgm/qwen3.5-32b",
      },
    },
  },
}
```

## 模型发现

当你设置了 `YUELI_KGM_API_KEY`（或认证配置）且**未**定义 `models.providers["yueli-kgm"]` 时，OpenClaw 会从本地 Yueli KGM 实例 `http://127.0.0.1:3000` 发现模型。

查看可用模型：

```bash
openclaw models list
```

## 显式配置（手动模型）

如果 Yueli KGM 运行在不同的主机或端口上：

```json5
{
  models: {
    providers: {
      "yueli-kgm": {
        baseUrl: "http://kgm-host:3000/v1",
        apiKey: "yueli-kgm-local",
        api: "openai-completions",
        models: [
          {
            id: "qwen3.5-32b",
            name: "Qwen 3.5 32B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## KGM 扩展功能

Yueli KGM 提供额外的管理接口：

- `/v1/kgm/graph/communities` - 图谱社区发现
- `/v1/kgm/graph/reason/expand` - 图推理扩展
- `/v1/kgm/graph/reason/rules` - 图推理规则
- `/v1/kgm/multimodal/embed` - 多模态嵌入

这些接口需要配置 `KGM_MULTIMODAL_BASE_URL` 等环境变量。

## 故障排除

### Yueli KGM 未被检测到

确保 Yueli KGM 正在运行：

```bash
curl http://127.0.0.1:3000/health
```

### 没有可用模型

检查 Yueli KGM 服务是否正常响应：

```bash
curl http://127.0.0.1:3000/v1/models
```

## 另请参阅

- [模型提供商](/concepts/model-providers) - 所有提供商概览
- [模型选择](/concepts/models) - 如何选择模型
- [配置](/gateway/configuration) - 完整配置参考
