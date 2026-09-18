import { chromium } from 'playwright'; import fs from 'fs';
const files=fs.readdirSync('../pins').filter(f=>f.endsWith('.jpg')).sort();
fs.writeFileSync('_pin.html',`<style>body{margin:0;background:#2a262e;display:grid;
 grid-template-columns:repeat(4,1fr);gap:10px;padding:10px}img{width:100%;display:block}</style>`
 + files.map(f=>`<img src="../pins/${f}">`).join(''));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:900}});
await p.goto('file://'+process.cwd()+'/_pin.html',{waitUntil:'load'});
await p.waitForTimeout(1500);
await p.screenshot({path:'../previews/_sheet-pins.png',fullPage:true});
await b.close();console.log('ok');
