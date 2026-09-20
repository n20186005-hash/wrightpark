import { readFileSync } from 'node:fs';
for (const f of ['dist/en/index.html', 'dist/tl/index.html']) {
  const h = readFileSync(f, 'utf8');
  const heroEnd = h.indexOf('id="info"');
  const hero = h.slice(0, heroEnd);
  const line = [...hero.matchAll(/<p[^>]*text-xs[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  );
  console.log('=====', f);
  line.forEach((l) => console.log('  hero small:', l.slice(0, 220)));
}
