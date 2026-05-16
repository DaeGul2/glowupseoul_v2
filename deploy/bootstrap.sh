#!/usr/bin/env bash
# bootstrap.sh — 1회 실행. Ubuntu 22.04 / 24.04 (Amazon Linux 는 변경 필요).
#
# EC2 에 SSH 접속 후 한 번 실행:
#   curl -fsSL https://raw.githubusercontent.com/DaeGul2/glowupseoul_v2/main/deploy/bootstrap.sh -o bootstrap.sh
#   chmod +x bootstrap.sh
#   ./bootstrap.sh
#
# 또는 로컬에서 SCP 후 실행.

set -euo pipefail

REPO="https://github.com/DaeGul2/glowupseoul_v2.git"
APP_DIR="$HOME/glowupseoul_v2"

echo "── 1. 기본 패키지 ────────────────────────────────────"
sudo apt-get update -y
sudo apt-get install -y curl git nginx ufw build-essential

echo "── 2. Node 20 LTS (NodeSource) ───────────────────────"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

echo "── 3. PM2 (전역) ─────────────────────────────────────"
sudo npm install -g pm2

echo "── 4. 방화벽 (HTTP 80, SSH 22) ───────────────────────"
sudo ufw allow OpenSSH || true
sudo ufw allow 'Nginx HTTP' || true
sudo ufw --force enable || true
sudo ufw status

echo "── 5. 저장소 clone (없으면) ───────────────────────────"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"
git pull --ff-only
mkdir -p "$APP_DIR/logs"

echo "── 6. .env (운영자 SCP 또는 GH Actions 가 작성) ──────"
if [ ! -f "$APP_DIR/server/.env" ]; then
  cat > "$APP_DIR/server/.env" <<'PLACEHOLDER'
# server/.env — GitHub Actions 가 매 배포 시 SERVER_ENV secret 으로 덮어씀.
# 부트스트랩 시점엔 이 placeholder 그대로 두세요.
PORT=3001
NODE_ENV=production
PLACEHOLDER
  chmod 600 "$APP_DIR/server/.env"
fi

echo "── 7. server 의존성 + DB ping ────────────────────────"
cd "$APP_DIR/server"
npm ci --omit=dev
# DB 연결 확인은 GH Actions secret 으로 진짜 .env 들어온 후 실행.

echo "── 8. client 빌드 ─────────────────────────────────────"
cd "$APP_DIR/client"
npm ci
npm run build
# 빌드 결과 = client/dist → nginx 가 서빙

echo "── 9. nginx 설정 적용 ────────────────────────────────"
sudo cp "$APP_DIR/deploy/nginx-glowupseoul.conf" /etc/nginx/sites-available/glowupseoul
sudo ln -sf /etc/nginx/sites-available/glowupseoul /etc/nginx/sites-enabled/glowupseoul
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "── 10. PM2 로 server 시작 ────────────────────────────"
cd "$APP_DIR"
pm2 start deploy/ecosystem.config.cjs --update-env || pm2 reload deploy/ecosystem.config.cjs --update-env
pm2 save
# 부팅 시 자동 시작 등록 (한 번만)
if ! systemctl list-unit-files | grep -q '^pm2-ubuntu'; then
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
fi

echo ""
echo "✓ Bootstrap 완료."
echo "  → 다음: GitHub repo Settings → Secrets and variables → Actions 에 다음 4개 등록"
echo "      EC2_HOST     = 13.124.18.135"
echo "      EC2_USER     = ubuntu"
echo "      EC2_SSH_KEY  = (glowupseoul.pem 전체 내용 PEM 포맷 그대로)"
echo "      SERVER_ENV   = (로컬 server/.env 의 전체 내용 그대로)"
echo "  → 이후 main 에 push 하면 자동 배포."
echo ""
echo "  · 사이트:        http://13.124.18.135/"
echo "  · health:        http://13.124.18.135/healthz"
echo "  · PM2 상태:      pm2 status"
echo "  · 로그:          pm2 logs glowupseoul-server"
echo "  · nginx 로그:    sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log"
