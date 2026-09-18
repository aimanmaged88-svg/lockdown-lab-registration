import { chromium } from 'playwright'; import fs from 'fs/promises';
const OUT='../shop-img'; await fs.mkdir(OUT,{recursive:true});
const JOBS=[['p1-sideshow','the-sideshow-set',0],['p2-poison','poison-apothecary-labels',0],
 ['p3-party','haunted-carnival-party-pack',0],['p4-tickets','admit-one-tickets-and-tags',0],
 ['p5-table','the-mourning-table',4],
 ['p3-party','party-pennants',1],['p3-party','party-menu',7],['p4-tickets','gift-tags',1],
 ['p1-sideshow','poster-vesper',1],['p2-poison','labels-sheet-2',1]];
const b=await chromium.launch();
// 560px wide: fine on screen, far too soft to print — previews should not be products
const p=await b.newPage({viewport:{width:560,height:792},deviceScaleFactor:1});
for(const [src,name,idx] of JOBS){
  await p.goto('file://'+process.cwd()+'/'+src+'.html',{waitUntil:'load'});
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='1',null,{timeout:15000});
  await p.addStyleTag({content:`.page{width:560px!important;height:792px!important;
    padding:9px!important;margin:0!important;box-shadow:none!important}
    :root{--safe:9px;--rule:0.6px;--hair:0.4px}`});
  await p.waitForTimeout(350);
  await p.locator('.page').nth(idx).screenshot({path:`${OUT}/${name}.jpg`,type:'jpeg',quality:88});
}
await b.close(); console.log('wrote',JOBS.length,'shop images');
