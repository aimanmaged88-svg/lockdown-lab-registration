import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { seed, api, tzParts } from './seed.mjs';
const here=path.dirname(new URL(import.meta.url).pathname);
const serve=(root,port)=>http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';const f=path.join(root,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}const ext=path.extname(f);r.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/json'}[ext]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(f).pipe(r)}).listen(port);
const app='/home/user/lockdown-lab-registration/tl';
const s1=serve(app,4581),s2=serve(app,4582),s3=serve(here,4590);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ev=[];let T0=0;const mark=(k,extra)=>ev.push({t:+((Date.now()-T0)/1000).toFixed(2),k,...extra});

// 1) seed (or reuse)
let D;const cache=path.join(here,'demo.json');
if(process.env.REUSE&&fs.existsSync(cache))D=JSON.parse(fs.readFileSync(cache));else{D=await seed();fs.writeFileSync(cache,JSON.stringify(D));}
console.log('retreat',D.code,'today',D.today);
// reset leftovers from earlier takes so the demo reads clean
async function resetDemo(){const st=await api({action:'state',token:D.LT});
  const dupes=st.members.filter(m=>m.name==='Muhammad');for(const m of dupes)await api({action:'member_remove',token:D.LT,id:m.id});
  const ids=new Set(dupes.map(m=>m.id));
  for(const p of st.posts){if(ids.has(p.member_id)||/^Muhammad joined/.test(p.text)||/^Muhammad! you made it|^Welcome akhi|^Fajr walk leaves/.test(p.text))await api({action:'post_del',token:D.LT,id:p.id})}
  for(const it of st.schedule){if(it.title==='Archery on the beach')await api({action:'schedule_del',token:D.LT,id:it.id})}
  console.log('reset: removed',dupes.length,'dupes');}
await resetDemo();

const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1,timezoneId:'Asia/Makassar',locale:'en-AU',
  recordVideo:{dir:path.join(here,'vid'),size:{width:1080,height:1920}},geolocation:{latitude:-8.3596,longitude:116.0831,accuracy:12},permissions:['geolocation']});
await ctx.addInitScript(()=>{ if(window===window.top)return;
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.zoom='1.7';const st=document.createElement('style');st.textContent=`::-webkit-scrollbar{display:none}*{scrollbar-width:none}.tapfx{position:fixed;width:56px;height:56px;border-radius:50%;border:3px solid #E9C46A;background:rgba(233,196,106,.28);transform:translate(-50%,-50%) scale(.4);pointer-events:none;z-index:99999;animation:tapfx .55s ease-out forwards}@keyframes tapfx{to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}`;document.head.appendChild(st)});
  window.addEventListener('pointerdown',e=>{const d=document.createElement('div');d.className='tapfx';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),700)},true);
});
await ctx.grantPermissions(['geolocation'],{origin:'http://localhost:4581'});await ctx.grantPermissions(['geolocation'],{origin:'http://localhost:4582'});await ctx.grantPermissions(['geolocation'],{origin:'http://localhost:4590'});
const pg=await ctx.newPage();T0=Date.now();process.on('uncaughtException',async e=>{console.log('FAIL',String(e.message).split('\n')[0],(e.stack.match(/promo\.mjs:(\d+)/)||[])[1]);try{await pg.screenshot({path:'fail.png'})}catch{}process.exit(1)});pg.on('pageerror',e=>console.log('PAGEERR',e.message));
await pg.goto('http://localhost:4590/stage.html');await pg.waitForTimeout(400);
await pg.evaluate(()=>document.fonts.ready);
const F1=()=>pg.frames().find(f=>f.url().startsWith('http://localhost:4581'));
const F2=()=>pg.frames().find(f=>f.url().startsWith('http://localhost:4582'));
const tap=async(f,sel,ms=900)=>{await f.click(sel);mark('tap');await pg.waitForTimeout(ms)};
const scrollTo=async(f,y,ms=1200)=>{await f.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),y);await pg.waitForTimeout(ms)};
const cap=async(k,t,s)=>{await pg.evaluate(a=>cap(...a),[k,t,s]);mark('cap')};
const card=async(o,ms)=>{await pg.evaluate(o=>card(o),o);mark('card');await pg.waitForTimeout(ms);await pg.evaluate(()=>cardOff());await pg.waitForTimeout(400)};

// ---- INTRO
await pg.evaluate(()=>card({k:'Traditional Legacies',t:'The Retreat Companion',s:'One app for the whole brotherhood — schedule, chat, meetups and a live map of every brother.',u:'Strength · Purpose · Legacy'}));mark('intro');
await pg.waitForTimeout(4600);
// load member phone behind the card
await pg.evaluate(()=>{document.querySelector('#ph1').src='http://localhost:4581/index.html'});
await pg.waitForTimeout(1200);await pg.evaluate(()=>cardOff());await pg.waitForTimeout(500);
await pg.evaluate(()=>phone(true));mark('phone');await pg.waitForTimeout(900);
await cap('Joining','Brothers are in within a minute','Yousof shares a 6-letter code. Type your name, pick your mark — done. No accounts, no app store.');
const f=F1();await f.waitForSelector('#jCode');await pg.waitForTimeout(800);
await f.click('#jCode');await f.type('#jCode',D.code,{delay:115});mark('type');await f.waitForSelector('#jPeek b',{timeout:15000});await pg.waitForTimeout(1200);
await f.click('#jName');await f.type('#jName','Muhammad',{delay:70});await pg.waitForTimeout(500);
await tap(f,'[data-av="🧔"]',500);
await f.click('#jBio');await f.type('#jBio','Sydney · first retreat',{delay:50});await pg.waitForTimeout(600);
await scrollTo(f,500,900);
await tap(f,'#jGo',400);await f.waitForFunction(()=>typeof S!=="undefined"&&S&&S.me,{timeout:30000});mark('joined');await pg.waitForTimeout(1200);
// ---- TODAY
await cap('Today','The day at a glance','Day of the retreat, the latest announcement, what\'s up next and today\'s full plan.');
await pg.waitForTimeout(2000);await scrollTo(f,420,1300);await scrollTo(f,900,1400);await scrollTo(f,0,700);
// ---- SCHEDULE
await tap(f,'[data-v=sched]',500);await cap('Schedule','Yousof sets it once. Everyone sees it live.','Prayer, archery, freediving, horses, boats, meals — day by day, with the where and the what-to-bring.');
await pg.waitForTimeout(2000);
if(await f.locator('#sDays button').count()>3){await f.locator('#sDays button').nth(3).click();mark('tap');await pg.waitForTimeout(1800)}
await scrollTo(f,350,1200);await scrollTo(f,0,500);
// ---- CHAT
await tap(f,'[data-v=chat]',500);await cap('Group chat','One thread for the brotherhood','Everyone\'s in it. The leader\'s announcements get pinned so nobody misses the boat.');
await pg.waitForTimeout(2000);
await f.click('#q');await f.type('#q','Just landed brothers, on my way to the villa 🙌',{delay:35});mark('type');await pg.waitForTimeout(400);
await tap(f,'#send',500);await f.evaluate(()=>poll(true));await pg.waitForTimeout(1100);
await api({action:'post',token:D.members.Ahmed,text:'Muhammad! you made it 🔥 see you at Fajr'});await f.evaluate(()=>poll(true));await pg.waitForTimeout(1000);
await api({action:'post',token:D.members.Hamza,text:'Welcome akhi 🤝 villa\'s the white one past the harbour'});await f.evaluate(()=>poll(true));await pg.waitForTimeout(2000);
// ---- MEETUPS
await tap(f,'[data-v=mu]',500);await cap('Meetups','"Sunset at Mowie\'s — who\'s in?"','Any brother can call one. I\'m in / can\'t make it. The leader can cancel anything.');
await pg.waitForTimeout(2000);
if(await f.locator('#muList [data-rsvp$="|in"]').count()){await f.locator('#muList [data-rsvp$="|in"]').first().click();mark('tap');await f.evaluate(()=>poll(true));await pg.waitForTimeout(2000)}
// ---- MAP
await tap(f,'[data-v=bro]',700);await cap('Live location','Every brother on the map','Opt-in on each phone. Yousof sees who\'s at the harbour, who\'s at the beach, who\'s drifted.');
await f.waitForFunction(()=>typeof LMAP!=="undefined"&&LMAP,{timeout:15000});await pg.waitForTimeout(1600);
await tap(f,'#locTog',400);await f.waitForFunction(()=>(S.locs||[]).some(l=>l.member_id===S.me.id),{timeout:20000});mark('loc');await pg.waitForTimeout(1200);
await tap(f,'#locFit',1500);
// tap a pin → popup
if(await f.locator('.leaflet-marker-icon').count()>1){await f.locator('.leaflet-marker-icon').nth(1).click({force:true});mark('tap');await pg.waitForTimeout(2000)}
await scrollTo(f,700,1100);await pg.waitForTimeout(400);
// ---- LEADER
await pg.evaluate(()=>{document.querySelector('#ph2').src='http://localhost:4582/index.html';});
await card({k:'For Yousof',t:'The Leader\'s Desk',s:'Everything the brothers see comes from here.'},3600);
await pg.evaluate(()=>swap(2));
await cap('Leader login','Code + PIN. Only the leader gets in.','Create a retreat, get the code, set your PIN. New retreat every couple of months — clean slate each time.');
const g=F2();await g.waitForSelector('[data-e=leader]');await pg.waitForTimeout(600);
await tap(g,'[data-e=leader]',700);await g.click('#lCode');await g.type('#lCode',D.code,{delay:105});await g.click('#lPin');await g.type('#lPin',D.pin,{delay:140});mark('type');await pg.waitForTimeout(400);
await tap(g,'#lGo',300);await g.waitForFunction(()=>typeof S!=="undefined"&&S&&S.me&&S.me.role==='leader',{timeout:30000});mark('leader');await pg.waitForTimeout(1200);
await tap(g,'[data-v=lead]',600);await cap('Share','Code, QR, link — the group\'s in fast','Drop the link in the WhatsApp group. They open it, type their name, they\'re in.');
await pg.waitForTimeout(2600);
// announce
await tap(g,'[data-l=ann]',500);await cap('Announce','Lands on every phone','Top of everyone\'s Today screen, pinned in the chat, buzzes their phone.');
await pg.waitForTimeout(1100);await g.click('#lAnnText');await g.type('#lAnnText','Fajr walk leaves the villa 4:30am. Wear something warm, we sit on the beach after.',{delay:26});mark('type');await pg.waitForTimeout(500);
await tap(g,'#lAnnGo',2000);
// schedule add
await cap('Build the days','Add, edit, copy a whole day','Tap a day, add what\'s on. Copy Day 2 onto Day 5 in one tap.');
await tap(g,'[data-v=sched]',800);
if(await g.locator('#sDays button').count()>4){await g.locator('#sDays button').nth(4).click();mark('tap');await pg.waitForTimeout(1000)}
await tap(g,'#sAddBtn',800);
await g.fill('#itTime','06:30');await g.click('#itTitle');await g.type('#itTitle','Archery on the beach',{delay:45});mark('type');
await g.locator('#itKinds [data-k="archery"]').click();mark('tap');
await g.click('#itPlace');await g.type('#itPlace','North field',{delay:45});await pg.waitForTimeout(400);
await tap(g,'#itSave',400);await pg.waitForTimeout(1800);
// people
await tap(g,'[data-v=lead]',500);await tap(g,'[data-l=people]',300);await cap('People','The whole brotherhood in one list','See everyone who joined. Remove anyone with one tap — their phone loses access instantly.');
await pg.waitForTimeout(1800);await scrollTo(g,300,1200);await pg.waitForTimeout(500);
// today as leader shows the announcement
await tap(g,'[data-v=today]',500);await cap('All in sync','Every phone updates on its own','Announcement at the top, the brothers below. Installs to the home screen like a real app.');
await pg.waitForTimeout(2800);
await pg.evaluate(()=>{capOff();phone(false)});await pg.waitForTimeout(800);
// ---- OUTRO
await pg.evaluate(()=>card({k:'Built for Traditional Legacies',t:'Ready today.',s:'Live now. Your retreat, your code, your brothers.',u:'traditional-legacies.netlify.app'}));mark('outro');
await pg.waitForTimeout(4800);
const vid=await pg.video();await ctx.close();const p=await vid.path();await b.close();s1.close();s2.close();s3.close();
fs.writeFileSync(path.join(here,'events.json'),JSON.stringify(ev));
console.log('video',p,'dur',((Date.now()-T0)/1000).toFixed(1));
