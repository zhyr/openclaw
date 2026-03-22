#!/usr/bin/env bash
set -e

# 如果没有 .tmp-libsignal 目录或压缩包不存在，则下载打包
# 用于规避 pnpm 从 GitHub Codeload 安装依赖时的 404 错误
if [ ! -f .tmp-libsignal/whiskeysockets-libsignal-node-2.0.1.tgz ]; then
  echo "    [Setup] 准备 libsignal 本地包..."
  mkdir -p .tmp-libsignal
  cd .tmp-libsignal
  
  if [ ! -d .git ]; then
    git clone https://github.com/WhiskeySockets/libsignal-node.git .
  fi
  
  git checkout 1c30d7d7e76a3b0aa120b04dc6a26f5a12dccf67
  npm pack
  cd ..
fi
