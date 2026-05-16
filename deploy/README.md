# EC2 배포 + GitHub Actions CI/CD

```
┌─ push to main ──┐    ┌─ GitHub Actions ──────────────┐    ┌─ EC2 (13.124.18.135) ──────┐
│                 │ →  │ diff client/server/deploy/    │ →  │ git pull + .env from secret │
│                 │    │ ssh → deploy_fast.sh          │    │ npm ci (conditional)        │
│                 │    └───────────────────────────────┘    │ client build (conditional)  │
│                 │                                          │ pm2 reload + nginx reload   │
└─────────────────┘                                          │ /api/health sanity check    │
                                                             └─────────────────────────────┘
```

## 한 번만 — 부트스트랩 (Windows 로컬에서 시작)

### ① 로컬 PowerShell 에서 PEM 권한 정리 + SSH 접속

```powershell
$key = "C:\Users\PC_1M\Downloads\glowupseoul.pem"
icacls $key /inheritance:r /grant:r "$($env:USERNAME):R"
ssh -i $key ubuntu@13.124.18.135
```

처음 접속 시 fingerprint 묻으면 `yes`.

### ② EC2 안에서 부트스트랩 스크립트 받아 실행

```bash
curl -fsSL https://raw.githubusercontent.com/DaeGul2/glowupseoul_v2/main/deploy/bootstrap.sh -o bootstrap.sh
chmod +x bootstrap.sh
./bootstrap.sh
```

이 스크립트가 하는 일:
- Node 20 LTS, PM2, nginx, ufw 설치
- `~/glowupseoul_v2` 에 git clone
- 80/22 포트 방화벽 열기
- nginx 설정 적용 (`deploy/nginx-glowupseoul.conf` → `/etc/nginx/sites-enabled/glowupseoul`)
- client build → PM2 로 server 기동
- 부팅 시 자동 시작 등록

5~10 분 소요. 끝나면 `http://13.124.18.135/` 접속 가능 (단 .env placeholder 라 DB 응답은 503).

> ⚠ Security Group 에 **TCP 80** 인바운드가 열려 있어야 합니다. AWS 콘솔 → EC2 → 보안 그룹 → 인바운드 → HTTP(80) Source 0.0.0.0/0 추가.

---

## 한 번만 — GitHub Secrets 등록

repo 의 **Settings → Secrets and variables → Actions → New repository secret** 에 4개:

| Secret 이름 | 값 |
|---|---|
| `EC2_HOST` | `13.124.18.135` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | `glowupseoul.pem` 의 **전체 내용** (BEGIN/END 라인 포함). PowerShell: `Get-Content "C:\Users\PC_1M\Downloads\glowupseoul.pem" \| Set-Clipboard` |
| `SERVER_ENV` | 로컬 `server/.env` 의 **전체 내용**. PowerShell: `Get-Content .\server\.env \| Set-Clipboard` |

> `SERVER_ENV` 는 줄바꿈 그대로 붙여넣기. 워크플로우가 heredoc 으로 `server/.env` 에 쓰고 `chmod 600` 함.

---

## 평상 운영 — push 한 번이면 끝

```
git push origin main
```

→ GitHub Actions 가 자동으로:
1. 어떤 폴더 변경됐는지 감지 (client / server / deploy)
2. EC2 SSH 진입
3. `server/.env` 를 secret 값으로 매 배포 덮어쓰기
4. `git reset --hard origin/main`
5. 바뀐 쪽만 `npm ci` (안 바뀐 쪽은 skip)
6. client 바뀌었으면 `npm run build`
7. `pm2 startOrReload` (zero-downtime)
8. nginx config 바뀌었으면 reload
9. `/api/health` HTTP 200 검증
10. 실패 시 PM2 최근 30줄 로그 출력 + Actions 실패

전체 소요 ~ **2~4분**. Actions 탭에서 실시간 로그 확인.

---

## 트러블슈팅

### Actions 가 SSH 못 함
- `EC2_SSH_KEY` 가 ssh-keygen 호환 OpenSSH 포맷인지 확인 (`-----BEGIN RSA PRIVATE KEY-----` 또는 `-----BEGIN OPENSSH PRIVATE KEY-----`)
- AWS 보안 그룹 인바운드 22번이 GitHub Actions runner IP 범위 (전세계) 에 열려있는지 — 안전 정책 강한 환경이면 0.0.0.0/0 으로 22번 잠시 열기 또는 self-hosted runner.

### `/api/health` 실패 (HTTP 503)
- `SERVER_ENV` secret 에 DB 자격증명이 누락. 로컬 `server/.env` 다시 복사해 secret 갱신.
- `pm2 logs glowupseoul-server` 로 직접 확인.

### nginx 502 Bad Gateway
- PM2 가 죽었거나 포트 3001 안 잡힘. `pm2 status` 확인.

### Static assets 404
- client build 실패. Actions 로그의 "Client build" 단계 확인.
- 또는 nginx root 경로 오류 — `ls /home/ubuntu/glowupseoul_v2/client/dist`.

### 강제 재배포 (코드 변경 없이)
- repo Actions 탭 → "Deploy to EC2" → "Run workflow" → main → Run.

### 로그 확인 (SSH 후)
```bash
pm2 status                            # 프로세스 상태
pm2 logs glowupseoul-server           # 실시간 로그 (Ctrl-C 종료)
pm2 logs glowupseoul-server --lines 100
tail -f ~/glowupseoul_v2/logs/server.{out,err}.log
sudo tail -f /var/log/nginx/{access,error}.log
```

---

## 다음 단계 (선택)

- **도메인 + HTTPS**: `glowupseoul.com` 연결 후 `sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d glowupseoul.com -d www.glowupseoul.com`
- **모니터링**: PM2 Plus (무료 4 프로세스) 또는 CloudWatch agent
- **RDS Security Group**: EC2 의 보안그룹만 inbound 허용 (현재 0.0.0.0/0 → tighten)
- **로그 백업**: `logs/` 가 무한 증가 — logrotate 설정
