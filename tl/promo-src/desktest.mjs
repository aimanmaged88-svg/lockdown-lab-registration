import { chromium } from 'playwright';import http from 'http';import fs from 'fs';import path from 'path';
const here=path.dirname(new URL(import.meta.url).pathname);const D=JSON.parse(fs.readFileSync(path.join(here,'demo.json')));
const serve=(root,port)=>http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'image/png'});fs.createReadStream(f).pipe(r)}).listen(4583);
const srv=serve('/home/user/lockdown-lab-registration/tl',4583);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const pg=await ctx.newPage();const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
pg.on('pageerror',e=>out.push('PAGEERR '+e.message));pg.on('dialog',d=>d.accept());
await pg.goto('http://localhost:4583/desk.html');await pg.waitForTimeout(800);
await pg.fill('#lCode',D.code);await pg.fill('#lPin',D.pin);await pg.click('#lGo');await pg.waitForFunction(()=>document.querySelector('#shell').classList.contains('on'),{timeout:30000});await pg.waitForTimeout(1200);
ok('login → shell', true);ok('stats render', (await pg.$$('#oStats .stat')).length===6);await pg.screenshot({path:'desk-over.png'});
await pg.click('[data-s=sched]');await pg.waitForTimeout(800);ok('week columns', (await pg.$$('#week .day')).length===8);await pg.screenshot({path:'desk-sched.png'});
// add an item via editor
await pg.click('#week .day:nth-child(6) [data-add]');await pg.fill('#itTime','16:30');await pg.fill('#itTitle','ZZ Desk test item');await pg.click('#itKinds [data-k="swim"]');await pg.fill('#itPlace','East beach');await pg.click('#itSave');await pg.waitForFunction(()=>[...document.querySelectorAll('.sl b')].some(b=>b.textContent.includes('ZZ Desk test item')),{timeout:20000});ok('item added shows in grid', true);
// edit it → delete
await pg.click('.sl:has-text("ZZ Desk test item")');await pg.waitForTimeout(400);ok('editor loaded item', (await pg.inputValue('#itTitle'))==='ZZ Desk test item');await pg.click('#itDel');await pg.waitForFunction(()=>![...document.querySelectorAll('.sl b')].some(b=>b.textContent.includes('ZZ Desk test item')),{timeout:20000});ok('item deleted', true);
await pg.click('[data-s=ann]');await pg.waitForTimeout(500);ok('announcements listed', (await pg.$$('#aList .ann')).length>=1);await pg.screenshot({path:'desk-ann.png'});
await pg.click('[data-s=chat]');await pg.waitForTimeout(800);ok('chat messages', (await pg.$$('#chat .msg')).length>5);await pg.screenshot({path:'desk-chat.png'});
await pg.click('[data-s=mu]');await pg.waitForTimeout(500);ok('meetups', (await pg.$$('#muList .mu')).length>=1);await pg.screenshot({path:'desk-mu.png'});
await pg.click('[data-s=bro]');await pg.waitForTimeout(500);ok('brothers table rows', (await pg.$$('#bRows tr')).length>=10);await pg.screenshot({path:'desk-bro.png'});
await pg.click('[data-s=map]');await pg.waitForTimeout(2500);ok('map pins', (await pg.$$('#dmap .leaflet-marker-icon')).length>=5);await pg.screenshot({path:'desk-map.png'});
await pg.click('[data-s=share]');await pg.waitForTimeout(800);ok('share code', (await pg.textContent('#shCode')).trim()===D.code);ok('qr link points to index', (await pg.textContent('#shLink')).includes('index.html?join='+D.code));await pg.screenshot({path:'desk-share.png'});
await pg.click('[data-s=set]');await pg.waitForTimeout(500);ok('settings prefilled', (await pg.inputValue('#rName')).includes('Gili Air'));await pg.screenshot({path:'desk-set.png'});
// reload keeps session
await pg.reload();await pg.waitForFunction(()=>document.querySelector('#shell').classList.contains('on'),{timeout:30000});ok('session survives reload', true);
// narrow
await pg.setViewportSize({width:800,height:900});await pg.waitForTimeout(500);ok('no h-overflow narrow', !(await pg.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)));await pg.screenshot({path:'desk-narrow.png'});
console.log(out.join('\n'));await b.close();process.exit(0);
