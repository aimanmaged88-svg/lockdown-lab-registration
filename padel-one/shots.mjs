import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');
const out = path.join(dir, 'shots');
import fs from 'fs';
fs.mkdirSync(out, { recursive: true });

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const launch = { headless: true };
if (proxy) launch.proxy = { server: proxy };

const browser = await chromium.launch(launch);
const ctx = await browser.newContext({
  viewport: { width: 460, height: 920 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()); });
await page.goto(url, { waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(1500);

async function shot(name, setup) {
  if (setup) { await page.evaluate(setup); }
  await page.waitForTimeout(1400); // let transition + images settle
  await page.screenshot({ path: path.join(out, name + '.png') });
  console.log('shot', name);
}

// 1. Onboarding (shown on first load)
await shot('01-onboarding');

// hide onboarding for the rest
await page.evaluate(() => { document.getElementById('onboarding').style.display = 'none'; });

// 2. Home
await shot('02-home', () => { tab('home'); });

// 3. Court discovery
await shot('03-clubs', () => { tab('clubs'); });

// 4. Club profile
await shot('04-club', () => { go('clubDetail', { id: 'c_syd' }); });

// 5. Find a match
await shot('05-play', () => { tab('play'); });

// 6. Match detail
await shot('06-match', () => { go('matchDetail', { id: 'm_1' }); });

// 7. Match lobby
await shot('07-lobby', () => { go('matchLobby', { id: 'm_1' }); });

// 8. Booking review (step 4)
await shot('08-booking', () => {
  go('courtBooking', { id: 'c_syd' });
  bk.step = 4; bk.agreed = true;
  bk.players = ['u_aiman','p_sarah','p_lucas','p_zara'];
  mount('courtBooking', {}, 'tab');
});

// 9. Booking success
await shot('09-success', () => { go('bookingSuccess', { ref:'PDL-8842-QX', cid:'c_syd', total:24.40 }); });

// 10. Level centre
await shot('10-level', () => { go('levelCentre'); });

// 11. Community
await shot('11-community', () => { tab('community'); });

// 12. Coaching
await shot('12-coaching', () => { go('coaching'); });

await browser.close();
console.log('done');
