import { chromium } from 'playwright';
const b = await chromium.launch();
for (const f of ['p1-sideshow','p2-poison','p3-party','p4-tickets','p5-table']) {
  const p = await b.newPage({ viewport:{width:900,height:1200} });
  await p.goto('file://'+process.cwd()+'/'+f+'.html',{waitUntil:'load'});
  await p.waitForFunction(()=>document.documentElement.dataset.ready==='1',null,{timeout:15000});
  await p.waitForTimeout(400);
  const bad = await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('.page').forEach((pg,i)=>{
      const pr=pg.getBoundingClientRect();
      // anything sticking out of its sheet by more than 1px
      pg.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(!r.width&&!r.height) return;
        if(r.right>pr.right+1||r.left<pr.left-1||r.bottom>pr.bottom+1||r.top<pr.top-1){
          const t=(el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:el.tagName);
          out.push(`sheet ${i+1} ${t}`);
        }
      });
      if(pg.scrollHeight>pg.clientHeight+1) out.push(`sheet ${i+1} CONTENT TALLER THAN SHEET`);
    });
    return [...new Set(out)];
  });
  console.log(f.padEnd(12), bad.length? 'OVERFLOW: '+bad.slice(0,6).join(', ') : 'clean');
  await p.close();
}
await b.close();
