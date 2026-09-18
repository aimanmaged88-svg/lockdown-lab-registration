import { chromium } from 'playwright';
import fs from 'fs/promises';
const OUT = '../products/gaslight-wallpapers';
const SIZES = [[1290,2796,'iphone'],[1440,3120,'android']];
await fs.mkdir(OUT,{recursive:true});
const b = await chromium.launch();
const probe = await b.newPage();
await probe.goto('file://'+process.cwd()+'/p6-wallpapers.html?i=0&w=1290&h=2796',{waitUntil:'load'});
await probe.waitForFunction(()=>document.documentElement.dataset.ready==='1');
const names = await probe.evaluate(()=>window.WALLS.map(w=>
  w.big.replace(/<br>/g,' ').toLowerCase().replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-')));
await probe.close();
let n=0;
for (const [w,h,tag] of SIZES){
  const p = await b.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  for (let i=0;i<names.length;i++){
    await p.goto(`file://${process.cwd()}/p6-wallpapers.html?i=${i}&w=${w}&h=${h}`,{waitUntil:'load'});
    await p.waitForFunction(()=>document.documentElement.dataset.ready==='1');
    await p.waitForTimeout(220);
    const f = `${OUT}/${String(i+1).padStart(2,'0')}_${names[i]}_${tag}_${w}x${h}.jpg`;
    await p.screenshot({ path:f, type:'jpeg', quality:95 }); n++;
  }
  await p.close();
  console.log(tag, w+'x'+h, 'done');
}
await b.close();
console.log('wrote', n, 'wallpapers');
