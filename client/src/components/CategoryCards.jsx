import db from '../data/db.js';
import { navigate } from '../App.jsx';

const SYMS = { face: '◈', eyes: '◇', nose: '⬡', body: '☽', skin: '✦', hair: '◎', wellness: '✿', dental: '⬩' };

export default function CategoryCards() {
  return (
    <div className="gs-cat-grid">
      {db.procedureCategories.map((c) => {
        const procs = db.proceduresByCategory(c.slug);
        const offerings = procs.reduce((sum, p) => sum + db.hospitalCountForProcedure(p.id), 0);
        return (
          <button key={c.slug} className="gs-cat-card" onClick={() => navigate(`/category/${c.slug}`)}>
            <span className="sym">{SYMS[c.slug] || '✦'}</span>
            <span className="gs-cat-arrow">↗</span>
            <span className="name-en">{c.name_en}</span>
            <span className="name-ko">{c.name_ko}</span>
            <span className="count">{procs.length} treatments · {offerings} offerings</span>
          </button>
        );
      })}
    </div>
  );
}
