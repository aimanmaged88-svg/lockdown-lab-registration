import { chromium } from 'playwright';
const [src, out, cols=4, scale=0.34] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1500,height:900} });
await p.goto('file://' + process.cwd() + '/' + src, { waitUntil:'load' });
await p.waitForFunction(()=>document.documentElement.dataset.ready==='1',null,{timeout:15000});
await p.waitForTimeout(500);
await p.addStyleTag({ content:`
  body{background:#57505a!important;display:grid;
    grid-template-columns:repeat(${cols},min-content);gap:10px;
    justify-content:center;padding:14px!important}
  .page{transform:scale(${scale});transform-origin:top left;
    width:210mm!important;height:297mm!important;margin:0!important;
    box-shadow:0 2px 10px rgba(0,0,0,.5)}
  .page-wrap{}` });
await p.evaluate((s)=>{ document.querySelectorAll('.page').forEach(el=>{
  const w=document.createElement('div');
  w.style.width=(el.offsetWidth*s)+'px'; w.style.height=(el.offsetHeight*s)+'px';
  el.parentNode.insertBefore(w,el); w.appendChild(el); }); }, Number(scale));
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage:true });
console.log('wrote', out);
await b.close();
