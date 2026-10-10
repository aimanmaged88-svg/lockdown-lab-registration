import { chromium } from 'playwright';import http from 'http';import fs from 'fs';import path from 'path';
const serve=(root,port)=>http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.json')||f.endsWith('.webmanifest')?'application/json':'image/png'});fs.createReadStream(f).pipe(r)}).listen(4585);
const srv=serve('/home/user/lockdown-lab-registration/lombok',4585);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const pg=await ctx.newPage();const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
pg.on('pageerror',e=>out.push('PAGEERR '+e.message));pg.on('dialog',d=>d.accept());
await pg.route('**/api/ai',r=>{const b=JSON.parse(r.request().postData()||'{}');const map={'Where is the harbour':'Di mana pelabuhan?','Lurus saja':'Just go straight'};r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({t:map[b.text]||'xx',p:b.to==='Indonesian'?'dee MAH-nah':'',n:''})})});
await ctx.addInitScript(()=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');const T=new Date();const k=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)};const today=k(T);
  localStorage.setItem('lombok_v1',JSON.stringify({v:2,name:'Aiman',dest:'Gili Air, Lombok, Indonesia',home:'AUD',local:'IDR',lang:'id',start:k(new Date(T-2*864e5)),end:k(new Date(T.getTime()+11*864e5)),budget:2500,buffer:150,rate:12443,rateAuto:false,rateAt:0,fixed:[{id:'f1',name:'Flights',amt:620}],dayPlan:{},tx:[{id:'a4',ts:Date.now()-3e6,d:today,type:'spend',cat:'food',pay:'cash',idr:120000,aud:9.64,note:'Breakfast'}],chat:[],plans:{},pins:[],journal:[],setup:true,mapOff:false,todos:[],jump:{start:null,done:{},base:'',retest:''},seeds:{}}))});
await pg.goto('http://localhost:4585/index.html');await pg.waitForTimeout(2000);
const st=await pg.evaluate(()=>({tx:S.tx.length,budget:S.budget,fixed:S.fixed.length,flag:S.seeds.moneyReset1,open:document.querySelector('#ovMoney').classList.contains('on')}));
ok('one-time wipe: tx 0 / budget 0 / fixed 0', st.tx===0&&st.budget===0&&st.fixed===0&&st.flag===true);ok('money sheet opened', st.open);
await pg.screenshot({path:'m-sheet.png'});
await pg.fill('#mCash','2000000');await pg.fill('#mBank','1000');await pg.fill('#mBuffer','150');
await pg.click('#incAdd');await pg.fill('#incRows .incrow:last-child [data-k=label]','Pay from Dre');await pg.fill('#incRows .incrow:last-child [data-k=aud]','500');
const d3=await pg.evaluate(()=>addDays(todayKey(),3));await pg.fill('#incRows .incrow:last-child [data-k=d]',d3);
await pg.click('#incAdd');await pg.fill('#incRows .incrow:last-child [data-k=label]','Refund');await pg.fill('#incRows .incrow:last-child [data-k=aud]','200');await pg.click('#incRows .incrow:last-child [data-k=sure]');
await pg.click('#mSave');await pg.waitForTimeout(500);
const c=await pg.evaluate(()=>{const c=calc();const ds=c.days;const i=ds.indexOf(c.cur);return {dbg:[c.cur,i,ds.length,JSON.stringify(c.plan).slice(0,200),S.start,S.end],budget:S.budget,remaining:c.remaining,cash:c.cashIdr,pend:c.incPending.length,landed:c.incLanded,p2:c.plan[ds[i+2]],p3:c.plan[ds[i+3]],inc:S.incoming.length,potInc:document.querySelector('#potInc').textContent,sheetClosed:!document.querySelector('#ovMoney').classList.contains('on')}});
console.log(JSON.stringify(c.dbg));ok('budget = bank + cash ('+c.budget+')', Math.abs(c.budget-(1000+2000000/12443))<0.05);
ok('cash pocket = 2,000,000', Math.abs(c.cash-2000000)<1);
ok('remaining = budget + sure 200 − buffer ('+c.remaining.toFixed(2)+')', Math.abs(c.remaining-(c.budget+200-150))<0.05);
ok('pending 1 / landed 200', c.pend===1&&c.landed===200);
ok('projection jumps on day +3 ('+c.p2.toFixed(0)+' → '+c.p3.toFixed(0)+')', c.p3>c.p2+350);
ok('hero shows expected line', /500/.test(c.potInc)&&/still to land/.test(c.potInc));ok('sheet closed', c.sheetClosed);
await pg.screenshot({path:'m-today.png'});
await pg.click('#goPlan');await pg.waitForTimeout(400);ok('plan view lists 2 expected', (await pg.$$('#incList .row')).length===2);await pg.screenshot({path:'m-plan.png'});
// talk
await pg.click('#planBack');await pg.click('.nav [data-v=tr]');await pg.waitForTimeout(300);await pg.click('#trTalk');await pg.waitForTimeout(300);ok('talk overlay open', await pg.$eval('#ovTalk',e=>e.classList.contains('on')));
await pg.fill('#tkIn','Where is the harbour');await pg.click('#tkSendMe');await pg.waitForFunction(()=>document.querySelector('.tb.me .t')&&document.querySelector('.tb.me .t').textContent.includes('pelabuhan'),{timeout:8000});ok('me turn → Indonesian bubble + pronunciation', (await pg.textContent('.tb.me .p')).includes('dee MAH'));
await pg.fill('#tkIn','Lurus saja');await pg.click('#tkSendThem');await pg.waitForFunction(()=>document.querySelector('.tb.them .t')&&document.querySelector('.tb.them .t').textContent.includes('Just go straight'),{timeout:8000});ok('them turn → English bubble', true);
await pg.click('#tkFlip');ok('flip toggles', await pg.$eval('#ovTalk',e=>e.classList.contains('flip')));await pg.click('#tkFlip');
await pg.screenshot({path:'m-talk.png'});
ok('talk persisted', await pg.evaluate(()=>JSON.parse(localStorage.getItem('lombok_v1')).talk.length===2));
await pg.click('#tkClose');ok('talk closed', !(await pg.$eval('#ovTalk',e=>e.classList.contains('on'))));
// classic translate still works
await pg.fill('#trIn','Where is the harbour');await pg.click('#trGo');await pg.waitForFunction(()=>document.querySelector('#trOut').textContent.includes('pelabuhan'),{timeout:8000});ok('classic translate still works', true);
// reload: no second wipe
await pg.reload();await pg.waitForTimeout(1500);ok('no re-wipe on reload', await pg.evaluate(()=>S.budget>0&&!document.querySelector('#ovMoney').classList.contains('on')));
console.log(out.join('\n'));await b.close();srv.close();process.exit(0);
