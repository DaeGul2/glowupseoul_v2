// PM2 ecosystem for the Express API server.
//   pm2 start deploy/ecosystem.config.cjs
//   pm2 reload glowupseoul-server   (zero-downtime)
//   pm2 logs glowupseoul-server
//   pm2 save                          (after first start, persist via pm2-startup)
module.exports = {
  apps: [
    {
      name: 'glowupseoul-server',
      cwd: '/home/ubuntu/glowupseoul_v2/server',
      script: 'index.js',
      // .env is loaded by the server itself via dotenv (server/index.js).
      // We don't pass env vars through PM2 — single source of truth = server/.env.
      instances: 1,              // simple — one process, no cluster (DB pool is fine)
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '600M',
      watch: false,
      time: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: '/home/ubuntu/glowupseoul_v2/logs/server.out.log',
      error_file: '/home/ubuntu/glowupseoul_v2/logs/server.err.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};
