#!/usr/bin/env bash
# 在仓库根目录执行：自动完成编译并启动 Gateway + Control UI（Dashboard）
# 用法: ./start.sh  或  bash start.sh

set -e
cd "$(dirname "$0")"

echo "==> 1. 安装依赖（若无 node_modules 或需更新）"
bash scripts/setup-libsignal.sh
pnpm install --no-optional || pnpm install

echo "==> 2. 编译主项目"
pnpm build

echo "==> 3. 编译 Control UI（Dashboard 需要）"
pnpm ui:build

echo "==> 4. 启动 Gateway（与 Dashboard 同 session，使用 dev 端口 19001）"
export OPENCLAW_SKIP_BUILD=1
export OPENCLAW_SKIP_CHANNELS=1
export CLAWDBOT_SKIP_CHANNELS=1
export OLLAMA_API_KEY="${OLLAMA_API_KEY:-ollama-local}"
# 与 pnpm openclaw --dev dashboard 一致：dev 下 Gateway 使用 19001，避免端口冲突
export OPENCLAW_PROFILE=dev
export OPENCLAW_GATEWAY_PORT=19001

# Brave Search API key for web_search tool（.env 已 gitignore，可安全存放 key）
[ -f .env ] && set -a && source .env && set +a
export BRAVE_API_KEY="${BRAVE_API_KEY:-}"

# 将 key 写入默认 + dev 配置，确保无论用哪个 Gateway（本脚本或 Mac 应用）都能读到
if [ -n "$BRAVE_API_KEY" ]; then
  pnpm openclaw config set tools.web.search.apiKey "$BRAVE_API_KEY" || true
  pnpm openclaw --profile dev config set tools.web.search.apiKey "$BRAVE_API_KEY" || true
fi

# 将系统时区仅传入 Gateway 进程，使日志时间为本地时间（不修改系统或当前 shell）
GATEWAY_TZ=""
if [ -L /etc/localtime ]; then
  GATEWAY_TZ=$(readlink /etc/localtime 2>/dev/null | sed 's|.*/zoneinfo/||')
fi
# 显式把 BRAVE_API_KEY 传给子进程，避免被 pnpm 或 node 子进程丢掉
if [ -n "$GATEWAY_TZ" ]; then
  env TZ="$GATEWAY_TZ" BRAVE_API_KEY="${BRAVE_API_KEY}" pnpm gateway:dev &
else
  env BRAVE_API_KEY="${BRAVE_API_KEY}" pnpm gateway:dev &
fi
GATEWAY_PID=$!

cleanup() {
  echo ""
  echo "==> 关闭 Gateway (PID $GATEWAY_PID)"
  kill "$GATEWAY_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "==> 5. 等待 Gateway 就绪 (http://127.0.0.1:19001)..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:19001/ 2>/dev/null | grep -qE '200|401|302'; then
    echo "    Gateway 已就绪。"
    break
  fi
  sleep 1
done

echo "==> 6. 打开 Control UI（Dashboard，默认中文；与 Gateway 同用端口 19001）"
pnpm openclaw --dev dashboard

echo ""
echo "    Gateway 仍在后台运行。按 Enter 关闭 Gateway 并退出；或关闭此终端将一并结束进程。"
read -r

cleanup
