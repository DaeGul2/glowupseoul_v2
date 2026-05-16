#!/usr/bin/env bash
# deploy_fast.sh — EC2 측 배포 스크립트 (GitHub Actions 가 호출).
#
# 환경 변수 (Actions 가 export):
#   CLIENT_CHANGED  true/false  — client/ 변경 있었나
#   SERVER_CHANGED  true/false  — server/ 변경 있었나
#   DEPLOY_CHANGED  true/false  — deploy/ (nginx·pm2 config) 변경 있었나
# 모두 미지정 시 기본 true.
#
# git pull / .env 주입은 워크플로우가 이미 처리. 이 스크립트는:
#   npm ci 조건부 → client build 조건부 → pm2 reload → nginx reload 조건부 → sanity check.

set -euo pipefail

# ===== Config =====
APP_DIR="$HOME/glowupseoul_v2"
SERVER_DIR="$APP_DIR/server"
CLIENT_DIR="$APP_DIR/client"
PM2_ECOSYSTEM="$APP_DIR/deploy/ecosystem.config.cjs"
PM2_NAME="glowupseoul-server"
NGINX_SITE_SRC="$APP_DIR/deploy/nginx-glowupseoul.conf"
NGINX_SITE_DST="/etc/nginx/sites-available/glowupseoul"

CLIENT_CHANGED="${CLIENT_CHANGED:-true}"
SERVER_CHANGED="${SERVER_CHANGED:-true}"
DEPLOY_CHANGED="${DEPLOY_CHANGED:-true}"

step() { echo -e "\033[1;34m$*\033[0m"; }
ok()   { echo -e "\033[1;32m$*\033[0m"; }
warn() { echo -e "\033[1;33m$*\033[0m"; }
err()  { echo -e "\033[1;31m$*\033[0m"; }

step "[A] Deploy start  (client=${CLIENT_CHANGED}, server=${SERVER_CHANGED}, deploy=${DEPLOY_CHANGED})"

# ── PATH 보정 (non-interactive shell 에서 nvm / pm2 안 잡히는 환경 대비) ──
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi
export PATH="$HOME/.npm-global/bin:$HOME/.pnpm-global/bin:$HOME/bin:/usr/local/bin:$PATH"

# pm2 없으면 설치
if ! command -v pm2 >/dev/null 2>&1; then
  warn "pm2 not found, installing globally..."
  npm i -g pm2
fi

mkdir -p "$APP_DIR/logs"

# ===== Server deps =====
step "[B] Server deps"
if [ "$SERVER_CHANGED" = "true" ] || [ ! -d "$SERVER_DIR/node_modules" ]; then
  ( cd "$SERVER_DIR" && npm ci --omit=dev --no-audit --no-fund )
else
  echo "  -> skip server npm ci (no server changes)"
fi

# ===== DB schema extend (idempotent) =====
# server 변경 또는 schema 파일 변경 시 db:extend 실행. 새 ALTER/CREATE 적용.
step "[B-2] DB schema extend (idempotent)"
if [ "$SERVER_CHANGED" = "true" ] || [ "$DEPLOY_CHANGED" = "true" ]; then
  ( cd "$SERVER_DIR" && npm run db:extend 2>&1 | tail -20 ) || warn "db:extend skipped/failed (check logs)"
else
  echo "  -> skip db:extend"
fi

# ===== Client deps + build =====
step "[C] Client deps"
if [ "$CLIENT_CHANGED" = "true" ] || [ ! -d "$CLIENT_DIR/node_modules" ]; then
  ( cd "$CLIENT_DIR" && npm ci --no-audit --no-fund --legacy-peer-deps || npm ci --no-audit --no-fund )
else
  echo "  -> skip client npm ci (no client changes)"
fi

step "[D] Client build"
if [ "$CLIENT_CHANGED" = "true" ] || [ ! -d "$CLIENT_DIR/dist" ]; then
  ( cd "$CLIENT_DIR" && npm run build )
else
  echo "  -> skip client build (no client changes)"
fi

# ===== PM2 reload (zero-downtime) =====
step "[E] PM2 reload — name=${PM2_NAME}"
# 과거 이름 중복 방지
pm2 delete glowupseoul >/dev/null 2>&1 || true

if [ -f "$PM2_ECOSYSTEM" ]; then
  pm2 startOrReload "$PM2_ECOSYSTEM" --update-env
else
  warn "ecosystem missing — fallback to direct start"
  ( cd "$SERVER_DIR" && pm2 startOrReload index.js --name "$PM2_NAME" --update-env )
fi
pm2 save

# 부팅 시 자동시작 — 최초 한 번만 (idempotent)
if ! systemctl list-unit-files 2>/dev/null | grep -q '^pm2-'; then
  warn "pm2 systemd not registered — running pm2 startup (once)"
  sudo env PATH=$PATH:/usr/bin $(which pm2) startup systemd -u "$USER" --hp "$HOME" || true
  pm2 save || true
fi

# ===== Nginx =====
step "[F] Nginx config"
if command -v nginx >/dev/null 2>&1; then
  if [ -f "$NGINX_SITE_SRC" ]; then
    if [ "$DEPLOY_CHANGED" = "true" ] || ! sudo cmp -s "$NGINX_SITE_SRC" "$NGINX_SITE_DST"; then
      sudo cp "$NGINX_SITE_SRC" "$NGINX_SITE_DST"
      sudo ln -sf "$NGINX_SITE_DST" /etc/nginx/sites-enabled/glowupseoul
      sudo rm -f /etc/nginx/sites-enabled/default
      sudo nginx -t
      sudo systemctl reload nginx
      ok "  nginx reloaded"
    else
      echo "  -> nginx config unchanged"
    fi
  else
    warn "  $NGINX_SITE_SRC missing — skip nginx update"
  fi
else
  warn "nginx not installed — skip"
fi

# ===== Sanity check =====
step "[G] Health check"
sleep 2
HTTP=$(curl -sS -o /tmp/gs_health.json -w '%{http_code}' http://127.0.0.1:3001/api/health || echo "000")
echo "  /api/health → HTTP $HTTP"
head -c 400 /tmp/gs_health.json 2>/dev/null || true
echo

if [ "$HTTP" != "200" ]; then
  err "Health check failed (HTTP $HTTP). Recent server logs:"
  pm2 logs "$PM2_NAME" --lines 30 --nostream || true
  exit 1
fi

ok "✅ Deploy done — $(git -C "$APP_DIR" log -1 --pretty='%h %s')"
