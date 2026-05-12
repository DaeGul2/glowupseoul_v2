import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import clinicsRoute from './routes/clinics.js';
import matchRoute from './routes/match.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, gpt: !!process.env.OPENAI_API_KEY });
});

app.use('/api/clinics', clinicsRoute);
app.use('/api/match', matchRoute);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(`[server] GPT: ${process.env.OPENAI_API_KEY ? 'on' : 'off (rule-based fallback)'}`);
});
