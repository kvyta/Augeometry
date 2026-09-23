const { chromium } = require('playwright');
const PAGE = 'file://' + require('path').resolve(__dirname, '../preview.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--headless=new'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(PAGE);
  let good = 0, bad = 0, wrongOK = 0;
  for (let i = 0; i < 25; i++) {
    const a = await pg.evaluate(() => window.SGD.problem.answer);
    await pg.fill('#ans', String(BigInt(a) + 7n));           // deliberately wrong
    await pg.click('#checkBtn');
    if (await pg.locator('#verdict.bad').count()) wrongOK++;
    await pg.fill('#ans', a);                                 // now correct
    await pg.click('#checkBtn');
    if (await pg.locator('#verdict.good').count()) good++; else bad++;
    await pg.click('#newBtn');
  }
  const d = await pg.evaluate(() => window.SGD.data);
  console.log('correct-answer accepted:', good, ' rejected wrongly:', bad, ' wrong-answer rejected:', wrongOK);
  console.log('recorded attempts:', d.total, 'correct:', d.correct, '(each counted as a miss on first try — expected 25/0)');
  console.log('page errors:', errs.length ? errs : 'none');
  // overflow check across several problems and widths
  for (const w of [360, 390, 430]) {
    await pg.setViewportSize({ width: w, height: 800 });
    const over = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    console.log('width', w, 'horizontal overflow:', over);
  }
  await b.close();
})();
