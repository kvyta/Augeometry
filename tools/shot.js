const { chromium } = require('playwright') ;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--headless=new'] });
  const pg = await b.newPage({ viewport: { width: 400, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await pg.goto(PAGE);
  await pg.waitForTimeout(1200);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/shot1.png', fullPage: true });
  // solve it correctly, then open the solution
  const ans = await pg.evaluate(() => { const s = document.getElementById('pStmt').textContent; return s; });
  await pg.evaluate(() => { window.__a = null; });
  // grab the answer from the app's internal state via a fresh identical problem is not possible; use Solution instead
  await pg.click('#solBtn');
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/shot2.png', fullPage: true });
  await pg.click('#tab-progress'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/shot3.png', fullPage: true });
  await pg.click('#tab-lemmas'); await pg.waitForTimeout(300);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/shot4.png', fullPage: true });
  console.log('statement:', ans.slice(0,90));
  console.log('console errors:', errs.length ? errs : 'none');
  await b.close();
})();
