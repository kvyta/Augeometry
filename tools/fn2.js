const { chromium } = require('playwright');
const PAGE = 'file://' + require('path').resolve(__dirname, '../preview.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--headless=new'] });
  const pg = await b.newPage({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await pg.goto(PAGE);
  await pg.waitForTimeout(900);
  // switch to Wild
  await pg.click('#setbar > summary');
  await pg.waitForTimeout(150);
  const chips = await pg.locator('#tierChips .chip').allTextContents();
  await pg.locator('#tierChips .chip', { hasText: 'Wild' }).click();
  await pg.waitForTimeout(400);
  await pg.click('#setbar > summary');
  let good = 0, wrongRejected = 0, ptsSeen = 0;
  for (let i = 0; i < 20; i++) {
    const info = await pg.evaluate(() => ({ a: window.SGD.problem.answer, id: window.SGD.problem.cfgId,
      st: window.SGD.problem.statement, n: window.SGD.problem.figure.filter(o => o.t === 'pt').length }));
    if (info.id !== 'wild') { console.log('NOT WILD:', info.id); break; }
    ptsSeen += info.n;
    await pg.fill('#ans', String(BigInt(info.a) + 3n));
    await pg.click('#checkBtn');
    if (await pg.locator('#verdict.bad').count()) wrongRejected++;
    await pg.fill('#ans', info.a);
    await pg.click('#checkBtn');
    if (await pg.locator('#verdict.good').count()) good++;
    if (i === 0) console.log('sample:', info.st);
    await pg.click('#newBtn');
    await pg.waitForTimeout(60);
  }
  console.log('tier chips:', chips.join(' | '));
  console.log('wild: correct accepted', good, '/20; wrong rejected', wrongRejected, '/20; avg labelled points', (ptsSeen/20).toFixed(1));
  // screenshot a solved wild problem with solution open
  await pg.click('#solBtn'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/wild1.png', fullPage: true });
  for (const w of [360, 400, 430]) {
    await pg.setViewportSize({ width: w, height: 800 });
    const over = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (over) console.log('OVERFLOW at', w);
  }
  console.log('page errors:', errs.length ? errs.slice(0,3) : 'none');
  await b.close();
})();
