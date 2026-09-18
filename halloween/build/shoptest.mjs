import { chromium } from 'playwright';
const b=await chromium.launch();
for (const [w,h,name] of [[1200,900,'desk'],[390,844,'phone']]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
  p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.cwd()+'/index.html',{waitUntil:'load'});
  await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>({
    cards:document.querySelectorAll('.card').length,
    disabled:document.querySelectorAll('.btn[aria-disabled="true"]').length,
    banner:!document.getElementById('setup').hidden,
    hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    brokenImgs:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),
  }));
  console.log(name, JSON.stringify(r), errs.length?('ERRORS: '+errs.slice(0,3)):'no js errors');
  await p.screenshot({path:`previews/_shop-${name}.png`,fullPage:name==='desk'});
  await p.close();
}
await b.close();
