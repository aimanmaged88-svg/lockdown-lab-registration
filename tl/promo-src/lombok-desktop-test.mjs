import { chromium } from 'playwright';import http from 'http';import fs from 'fs';import path from 'path';
const serve=(root,port)=>http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.json')||f.endsWith('.webmanifest')?'application/json':'image/png'});fs.createReadStream(f).pipe(r)}).listen(4584);
const srv=serve('/home/user/lockdown-lab-registration/lombok',4584);
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const pg=await ctx.newPage();const out=[];const ok=(n,c)=>out.push((c?'PASS ':'FAIL ')+n);
pg.on('pageerror',e=>out.push('PAGEERR '+e.message));
// seed a realistic state before load
await ctx.addInitScript(()=>{const T=new Date();const k=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)};const today=k(T);const y=k(new Date(T-864e5));
  const st={v:2,name:'Aiman',dest:'Gili Air, Lombok, Indonesia',home:'AUD',local:'IDR',lang:'id',start:k(new Date(T-2*864e5)),end:k(new Date(T+11*864e5)),budget:2500,buffer:150,rate:12443,rateManual:false,tx:[
   {id:'a1',ts:Date.now()-9e7,d:y,type:'atm',idr:2000000,aud:160.7,fee:50000,note:'BNI ATM harbour'},
   {id:'a2',ts:Date.now()-8e7,d:y,type:'spend',cat:'food',pay:'cash',idr:85000,aud:6.83,note:'Nasi campur Warung Muslim'},
   {id:'a3',ts:Date.now()-7e7,d:y,type:'spend',cat:'transport',pay:'cash',idr:150000,aud:12.05,note:'Public boat Bangsal'},
   {id:'a4',ts:Date.now()-3e6,d:today,type:'spend',cat:'food',pay:'cash',idr:120000,aud:9.64,note:'Breakfast + coconut'},
   {id:'a5',ts:Date.now()-2e6,d:today,type:'spend',cat:'activity',pay:'card',idr:450000,aud:36.16,note:'Snorkel trip deposit'}],
   journal:[{id:'j2',d:today,ts:Date.now()-3e6,title:'Snorkel deposit paid',mood:'🤿',place:'',text:'Booked the 3-island trip for tomorrow. Turtles, statues, Trawangan sunset.',photos:[]},{id:'j1',ts:Date.now()-8e7,d:y,title:'First night on the island',mood:'🌅',place:'East beach',text:'Landed, boat was chaos, island is silent. Ate at the warung by the harbour. No motorbikes, just the sound of the sea.',photos:[]}],
   fixed:[{id:'f1',name:'Flights',amt:620},{id:'f2',name:'Bungalow deposit',amt:180}],dayPlan:{},chat:[],rateAuto:false,rateAt:0,mapOff:false,setup:true,todos:[],jump:{start:null,done:{},base:'',retest:''},seeds:{},days:{},pins:[],plans:{}};
  localStorage.setItem('lombok_v1',JSON.stringify(st));});
await pg.goto('http://localhost:4584/index.html');await pg.waitForTimeout(2500);
ok('setup sheet not shown', !(await pg.evaluate(()=>document.querySelector('#ovSetup')&&document.querySelector('#ovSetup').classList.contains('on'))));
await pg.screenshot({path:'lw-today.png'});
for(const v of ['log','map','tr','journal','ai']){await pg.click(`.nav [data-v=${v}]`);await pg.waitForTimeout(v==='map'?2500:800);await pg.screenshot({path:`lw-${v}.png`});ok('no h-overflow '+v, !(await pg.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1)))}
await pg.click('.nav [data-v=today]');await pg.waitForTimeout(500);await pg.click('#goPlan');await pg.waitForTimeout(800);await pg.screenshot({path:'lw-plan.png'});
await pg.click('#planBack');await pg.waitForTimeout(400);await pg.click('#qmOut');await pg.waitForTimeout(600);await pg.screenshot({path:'lw-sheet.png'});
console.log(out.join('\n'));await b.close();process.exit(0);
