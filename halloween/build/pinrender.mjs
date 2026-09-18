import { chromium } from 'playwright';
import fs from 'fs/promises';
const OUT='../pins';
await fs.mkdir(OUT,{recursive:true});
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1000,height:1500},deviceScaleFactor:1});
await p.goto('file://'+process.cwd()+'/pins.html?i=0',{waitUntil:'load'});
await p.waitForFunction(()=>document.documentElement.dataset.ready==='1');
const n=await p.evaluate(()=>window.PINS.length);
const slugs=await p.evaluate(()=>window.PINS.map(x=>
  x.h.replace(/<br>/g,' ').replace(/&amp;/g,'and').toLowerCase()
   .replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-')));
for(let i=0;i<n;i++){
  await p.goto(`file://${process.cwd()}/pins.html?i=${i}`,{waitUntil:'load'});
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='1');
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(450);
  const f=`${OUT}/pin-${String(i+1).padStart(2,'0')}_${slugs[i]}.jpg`;
  await p.screenshot({path:f,type:'jpeg',quality:92});
}
await b.close();
console.log('wrote',n,'pins');
