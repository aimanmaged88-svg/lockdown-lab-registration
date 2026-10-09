// Seeds a realistic demo retreat on the live tl-api for the promo video. Exports seed() → {code,pin,LT,members,today}
const U='https://ymuwuhvqqftgpxwhzoub.supabase.co/functions/v1/tl-api';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdXd1aHZxcWZ0Z3B4d2h6b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjUyMzgsImV4cCI6MjA5OTI0MTIzOH0.sOkWQpulWj_ZSqMNSV7YP55T70UFSm2mP5e5xapQyQo';
export const api=async(b)=>{const r=await fetch(U,{method:'POST',headers:{'content-type':'application/json',apikey:K,Authorization:'Bearer '+K},body:JSON.stringify(b)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.action+' '+r.status+' '+(j.error||''));return j};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const TZ='Asia/Makassar';
export function tzParts(d=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,h:+p.hour%24,m:+p.minute}}
const addDays=(iso,n)=>{const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const pad=n=>String(n).padStart(2,'0');

export const MEMBERS=[
 ['Ahmed','🏹','Lakemba · second retreat'],['Omar','🤿','Bankstown · freediver'],['Bilal','🐎','Punchbowl · electrician'],
 ['Hamza','🦁','Auburn · personal trainer'],['Ibrahim','🌙','Greenacre · first retreat'],['Khalid','🌊','Liverpool · surf coach'],
 ['Zayd','🔥','Campsie · barber'],['Musa','🛡️','Lakemba · teacher'],['Abdullah','⚓','Roselands · sparky'],['Tariq','🌴','Granville · chef']];
// pins around Gili Air (harbour / beaches / village)
const LOCS=[[-8.3622,116.0848],[-8.3560,116.0872],[-8.3584,116.0752],[-8.3522,116.0802],[-8.3601,116.0812],[-8.3575,116.0855],[-8.3640,116.0790],[-8.3548,116.0838],[-8.3595,116.0770],[-8.3612,116.0828]];

export async function seed({pin='1446'}={}){
  const now=tzParts();const today=now.date;const start=addDays(today,-2),end=addDays(today,5);
  const c=await api({action:'retreat_create',name:'Gili Air Retreat · October',start,end,location:'Gili Air · Lombok',pin,leader_name:'Yousof (Brother Dib)',welcome:"This isn't a holiday. Step away from the noise. Pray together, train together, eat together — and go home a better man."});
  const code=c.retreat.code,LT=c.token;
  const members={};
  for(const [name,avatar,bio] of MEMBERS){const j=await api({action:'join',code,name,avatar,bio});members[name]=j.token}
  // schedule
  const S=(day,t,title,kind,place,details)=>api({action:'schedule_add',token:LT,day,t,title,kind,place,details});
  const d1=start,d2=addDays(today,-1),d3=today,d4=addDays(today,1),d5=addDays(today,2);
  await S(d1,'14:00','Boats from Bangsal · settle into the villa','travel','Bangsal harbour','Passports, cash for the boat. Phones away once we land.');
  await S(d1,'18:00','Maghrib + opening circle','talk','Villa deck','Why we came. Intentions for the week.');
  await S(d2,'04:50','Fajr at the mosque','prayer','Gili Air mosque','');
  await S(d2,'06:00','Horse ride on the beach','horse','South beach','Long pants. Hamza leads.');
  await S(d2,'09:30','Freediving · breath-hold basics','freedive','Harbour pool','Omar + the instructors. Nothing to eat 2h before.');
  await S(d2,'17:30','Sunset circle','talk','West side','');
  await S(d3,'04:45','Fajr at the mosque','prayer','Gili Air mosque','Walk together from the villa at 4:30.');
  await S(d3,'05:30','Sunrise swim','swim','East beach','Towels, reef shoes.');
  await S(d3,'07:00','Breakfast at the villa','meal','Villa','');
  await S(d3,'09:00','Archery session','archery','North field','Khalid vs Bilal rematch. Bring water, long sleeves.');
  await S(d3,'12:30','Dhuhr + lunch','meal','Warung Muslim · harbour','');
  await S(d3,'14:00','Freediving · line training','freedive','Harbour','Buddy pairs. Never alone in the water.');
  await S(d3,'17:30','Sunset circle · brotherhood','talk','West side','Tonight: what are you going home to change?');
  await S(d3,'19:30','Dinner + Isha','meal','Villa','');
  await S(d4,'04:50','Fajr at the mosque','prayer','Gili Air mosque','');
  await S(d4,'06:00','Beach workout','workout','East beach','Hamza runs it. 45 min.');
  await S(d4,'09:00','Boat to Gili Meno','boat','Harbour','9am SHARP. Water, sunscreen, no phones on the boat.');
  await S(d4,'13:00','Lunch on Meno','meal','Gili Meno','');
  await S(d4,'16:00','Snorkel the statues','swim','Nest · Gili Meno','Masks provided.');
  await S(d4,'18:30','Maghrib + reflections','talk','Villa deck','');
  await S(d5,'04:50','Fajr','prayer','Gili Air mosque','');
  await S(d5,'08:00','Archery · final shoot-off','archery','North field','');
  await S(d5,'15:00','Free afternoon','free','','Rest. Call home.');
  // chat (≥800ms between posts)
  const P=async(who,text,kind)=>{await api({action:'post',token:who==='L'?LT:members[who],text,kind});await sleep(900)};
  await P('Ahmed','Salam brothers 👋 who\'s up for the sunrise swim?');
  await P('Omar','I\'m in. East beach 5:30, don\'t be late');
  await P('Hamza','Legs are cooked from the horses yesterday 😂');
  await P('Bilal','Archery at 9 — Khalid you still owe me that rematch');
  await P('Khalid','Bring it 🏹🏹');
  await P('Ibrahim','Anyone got spare reef shoes? Mine fell apart');
  await P('Zayd','Got a pair, grab them from the villa before we go');
  await P('L','Boat to Gili Meno leaves the harbour 9am SHARP tomorrow. Bring water. No phones on the boat.','announce');
  await P('Musa','JazakAllah khair Brother Dib 🙏');
  await P('Abdullah','That sunset circle last night… needed that');
  await P('Tariq','Same. Different energy out here wallahi');
  await P('Ahmed','Alhamdulillah 🤲');
  // meetups later today (local), relative to now
  const at=(h,m)=>`${today}T${pad(h)}:${pad(m)}:00+08:00`;
  const sunset=now.h<16?at(17,30):at(Math.min(now.h+1,23),30),coffee=now.h<7?at(8,15):at(Math.min(now.h+2,23),0);
  const m1=await api({action:'meetup_add',token:members.Omar,title:'Sunset at Mowie\'s',place:'West side',at:sunset,note:'Coconuts after. Bring a towel.'});
  for(const w of ['Ahmed','Bilal','Hamza','Khalid','Zayd'])await api({action:'rsvp',token:members[w],id:m1.meetup.id,status:'in'});
  await api({action:'rsvp',token:members.Musa,id:m1.meetup.id,status:'out'});
  const m2=await api({action:'meetup_add',token:members.Hamza,title:'Coffee before archery',place:'Villa kitchen',at:coffee,note:'Proper coffee. 10 minutes, then we walk up together.'});
  for(const w of ['Ibrahim','Musa','Abdullah'])await api({action:'rsvp',token:members[w],id:m2.meetup.id,status:'in'});
  // live locations
  await api({action:'loc_set',token:LT,lat:-8.3590,lon:116.0820,acc:9});
  let i=0;for(const [name] of MEMBERS){const [lat,lon]=LOCS[i++];await api({action:'loc_set',token:members[name],lat,lon,acc:10+i})}
  return {code,pin,LT,members,today,d3:today,d4,start,end};
}
if(process.argv[1]&&process.argv[1].endsWith('seed.mjs')){const r=await seed();console.log(JSON.stringify({code:r.code,pin:r.pin,today:r.today,LT:r.LT,members:r.members}));}
