import { chromium } from 'playwright'; import fs from 'fs';
const b=await chromium.launch();
for (const [w,h,tag] of [[1200,900,'desk'],[390,844,'phone']]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.cwd()+'/../p/sideshow.html',{waitUntil:'load'});
  await p.waitForTimeout(1100);
  const r=await p.evaluate(()=>({
    title:document.title,
    og:document.querySelector('meta[property="og:type"]')?.content,
    price:document.querySelector('meta[property="product:price:amount"]')?.content,
    ld:(()=>{try{const j=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
      return j['@type']+'/'+j.offers.price+'/'+j.offers.priceCurrency}catch(e){return 'LD BROKEN: '+e.message}})(),
    hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),
  }));
  console.log(tag, JSON.stringify(r), errs.length?('ERR '+errs[0]):'no js errors');
  if(tag==='desk') await p.screenshot({path:'../previews/_lp-sideshow.png',fullPage:true});
  await p.close();
}
// pin contact sheet
const files=fs.readdirSync('../pins').filter(f=>f.endsWith('.jpg')).sort();
fs.writeFileSync('_pin.html',`<style>body{margin:0;background:#2a262e;display:grid;
 grid-template-columns:repeat(6,1fr);gap:8px;padding:8px}img{width:100%;display:block}</style>`
 + files.map(f=>`<img src="../pins/${f}">`).join(''));
const p2=await b.newPage({viewport:{width:1600,height:900}});
await p2.goto('file://'+process.cwd()+'/_pin.html',{waitUntil:'load'});
await p2.waitForTimeout(1600);
await p2.screenshot({path:'../previews/_sheet-pins.png',fullPage:true});
console.log('pin sheet:',files.length,'pins');
await b.close();
