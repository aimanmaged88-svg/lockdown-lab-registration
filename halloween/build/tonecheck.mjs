import { chromium } from 'playwright';
import { CATALOG } from './catalog.js';
const slug = s => s.replace(/<br>/g,' ').replace(/&amp;/g,'and').toLowerCase()
  .replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-');
const want = CATALOG.flatMap(p=>p.pins.map((pin,i)=>({
  file:`${p.key}-${i+1}_${slug(pin.h)}.jpg`, t:pin.t })));
const b=await chromium.launch({args:['--allow-file-access-from-files']});
const pg=await b.newPage();
// need a real file:// origin, and same-origin file reads, to sample canvas pixels
await pg.goto('file://'+process.cwd()+'/pins.html');
let bad=0;
for (const w of want){
  const lum = await pg.evaluate(async (src)=>{
    const img=new Image(); img.src=src;
    await new Promise(r=>{img.onload=r;img.onerror=r});
    const c=document.createElement('canvas'); c.width=40;c.height=40;
    const x=c.getContext('2d');
    // sample the middle of the left edge — always background, never type or ribbon
    x.drawImage(img,0,700,40,40,0,0,40,40);
    const d=x.getImageData(0,0,40,40).data; let s=0;
    for(let i=0;i<d.length;i+=4) s+=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
    return s/(d.length/4);
  }, 'file://'+process.cwd()+'/../pins/'+w.file);
  const got = lum > 128 ? 'lt' : 'dk';
  const ok = got === w.t;
  if(!ok) bad++;
  console.log(`${ok?'ok  ':'WRONG'} ${w.file.padEnd(44)} want ${w.t}  got ${got}  (lum ${lum.toFixed(0)})`);
}
await b.close();
console.log(bad ? `\n${bad} pins have the wrong tone` : '\nall tones correct');
