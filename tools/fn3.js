const { chromium } = require('playwright');
const PAGE = 'file://' + require('path').resolve(__dirname, '../preview.html');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--headless=new'] });
  const errs = [];
  // overflow sweep across phone widths, curated AND wild, with solutions open
  for (const w of [320, 360, 390, 430]) {
    const pg = await b.newPage({ viewport: { width: w, height: 800 } });
    pg.on('pageerror', e => errs.push(w + ': ' + e.message));
    await pg.goto(PAGE);
    await pg.waitForTimeout(700);
    let worst = 0;
    for (let i = 0; i < 24; i++) {
      await pg.click('#solBtn');                       // worst case: hints + solution + coords
      await pg.waitForTimeout(40);
      const over = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > worst) worst = over;
      await pg.click('#newBtn');
    }
    // wild mode too
    await pg.click('#setbar > summary'); await pg.waitForTimeout(100);
    await pg.locator('#tierChips .chip', { hasText: 'Wild' }).click(); await pg.waitForTimeout(300);
    await pg.click('#setbar > summary');
    for (let i = 0; i < 24; i++) {
      await pg.click('#solBtn'); await pg.waitForTimeout(40);
      const over = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > worst) worst = over;
      await pg.click('#newBtn');
    }
    console.log('width ' + w + ' -> max horizontal overflow: ' + worst + 'px');
    await pg.close();
  }
  // zoom control
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await pg.goto(PAGE);
  await pg.waitForTimeout(600);
  await pg.click('#setbar > summary'); await pg.waitForTimeout(150);
  for (let i = 0; i < 3; i++) await pg.click('#zIn');
  const z = await pg.evaluate(() => [getComputedStyle(document.documentElement).getPropertyValue('--ui').trim(),
                                     document.getElementById('zVal').textContent]);
  console.log('after 3 taps of +:', z.join('  label='));
  await pg.click('#setbar > summary'); await pg.waitForTimeout(200);
  await pg.screenshot({ path: require('path').resolve(__dirname, '../') + '/zoom.png', fullPage: false });
  console.log('page errors:', errs.length ? errs : 'none');
  await b.close();
})();
