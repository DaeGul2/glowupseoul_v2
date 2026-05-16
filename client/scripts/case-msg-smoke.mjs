import db from '../src/data/db.js';
import { buildCaseMessage } from '../src/utils/caseMessage.js';

const entries = db.getRecentMatches(2);
for (const e of entries) {
  console.log('\n========== EN ==========');
  console.log(buildCaseMessage({ entry: e, lang: 'en' }));
  console.log('\n========== ZH ==========');
  console.log(buildCaseMessage({ entry: e, lang: 'zh' }));
}
