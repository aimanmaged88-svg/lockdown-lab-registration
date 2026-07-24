/* ============================================================
   PADEL ONE — app core: helpers, state, router, chrome
   ============================================================ */

/* ---------- tiny helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const money = n => "$" + (Math.round(n*100)/100).toFixed(2);
const viewport = $("#viewport");
function icons(){ try { lucide.createIcons(); } catch(e){} }

const store = {
  get(k,d){ try{ const v=localStorage.getItem("padel_"+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem("padel_"+k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- app state ---------- */
const state = {
  filters: store.get("filters", JSON.parse(JSON.stringify(DEFAULT_FILTERS))),
  favs: store.get("favs", { c_syd:true, c_harbour:true }),
  hidden: store.get("hidden", {}),
  savedSearches: store.get("savedSearches", [{ name:"Bankstown · under $22", when:"Sat" }]),
  recent: store.get("recent", ["c_syd","c_harbour"]),
  joinedMatches: {},
  currentTab: "home",
};

function saveFilters(){ store.set("filters", state.filters); }
function isFav(id){ return !!state.favs[id]; }
function toggleFav(id){ state.favs[id] = !state.favs[id]; store.set("favs", state.favs); }

/* ---------- media helpers ---------- */
function courtImg(id, alt){
  return `<div class="imgwrap"><img src="${unsplash(id,900)}" alt="${(alt||"").replace(/"/g,"")}" loading="lazy"
     onerror="this.remove();this.parentNode.classList.add('ph-grad')"></div>`;
}
function avatar(p, size="m"){
  if(!p) p = { name:"Player", color:"6C7770" };
  const initials = p.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const c = p.color || "6C7770";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23${c}'/><stop offset='1' stop-color='%23${c}99'/></linearGradient></defs><rect width='96' height='96' rx='48' fill='url(%23g)'/><text x='50%' y='53%' dy='.35em' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='40' font-weight='700' fill='white'>${initials}</text></svg>`;
  return `<img class="av ${size}" src="data:image/svg+xml;utf8,${svg}" alt="${p.name}">`;
}

/* ---------- UI atoms ---------- */
function chip(txt, cls="", ico){ return `<span class="chip ${cls}">${ico?`<i data-lucide="${ico}"></i>`:""}${txt}</span>`; }
function levelPill(l, ghost){ return `<span class="lvl ${ghost?"ghost":""}">${(+l).toFixed(2)}</span>`; }
function stars(n){ let s=""; for(let i=0;i<5;i++) s+=`<i data-lucide="star" ${i<Math.round(n)?"":"style='opacity:.25'"}></i>`; return `<span class="stars">${s}</span>`; }
function statusBadge(s){
  const map={ "Confirmed":"green","Pending":"amber","Payment authorised":"blue","Paid":"green",
    "Refund processing":"violet","Match filling":"amber","Automatically protected":"lime",
    "Human support assigned":"blue","Completed":"green","Awaiting confirmation":"amber",
    "Correction requested":"amber","Under review":"blue","Removed":"red","Cancelled":"red" };
  return `<span class="chip ${map[s]||""}">${s}</span>`;
}
function topbar(title, opt={}){
  return `<div class="topbar ${opt.solid?"solid":""}">
    ${opt.back!==false ? `<button class="backbtn" onclick="back()"><i data-lucide="chevron-left"></i></button>`:""}
    <h2>${title}</h2>
    ${opt.actions||""}
  </div>`;
}
function slots(have, need){
  let s=""; for(let i=0;i<need;i++) s+=`<span class="slot ${i<have?"on":""}"></span>`;
  return `<div class="slots">${s}</div>`;
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, ico="check"){
  const t=$("#toast");
  t.innerHTML = `<i data-lucide="${ico}"></i><span>${msg}</span>`;
  t.classList.add("show"); icons();
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"), 2600);
}

/* ---------- sheet ---------- */
function openSheet(title, body, foot){
  $("#sheetTitle").textContent = title;
  $("#sheetBody").innerHTML = body;
  const f=$("#sheetFoot");
  if(foot){ f.innerHTML=foot; f.classList.remove("hidden"); } else f.classList.add("hidden");
  $("#sheetBackdrop").classList.add("show");
  $("#sheet").classList.add("show");
  icons();
}
function closeSheet(){ $("#sheetBackdrop").classList.remove("show"); $("#sheet").classList.remove("show"); }

/* ---------- theme ---------- */
function initTheme(){
  const m = store.get("theme","dark");
  document.documentElement.classList.toggle("light", m==="light");
}
function toggleTheme(){
  const light = !document.documentElement.classList.contains("light");
  document.documentElement.classList.toggle("light", light);
  store.set("theme", light?"light":"dark");
  $("#theme-color") && ($("#theme-color").content = light?"#EEF1EC":"#0B0E0C");
  toast(light?"Light mode on":"Dark mode on", light?"sun":"moon");
  // re-render current screen to refresh any inline swatches
  const top = stack[stack.length-1]; if(top) rerender();
}

/* ---------- router ---------- */
let stack = [{ name:"home", params:{} }];
const NO_NAV = new Set(["setup","courtBooking","bookingSuccess","createMatch","supportChat","matchLobby"]);
const TAB_OF = {
  home:"home", play:"play", clubs:"clubs", community:"community", profile:"profile",
  search:"clubs", clubDetail:"clubs", courtBooking:"clubs", bookingSuccess:"clubs",
  createMatch:"play", matchDetail:"play", matchLobby:"play", results:"play",
  playerProfile:"community", friends:"community", groupDetail:"community", messages:"community",
  compete:"play", tournamentDetail:"play", coaching:"play", coachDetail:"play",
  levelCentre:"profile", bookings:"profile", wallet:"profile", cancellation:"profile",
  refundTracker:"profile", support:"profile", settings:"profile", reliability:"profile",
  safety:"profile", notifications:"home", demoMenu:"home", resultConfirm:"play",
};

function updateChrome(name){
  const nav=$("#bottomnav"), fab=$("#demoFab");
  if(NO_NAV.has(name)){ nav.classList.add("hidden"); fab.classList.add("hidden"); }
  else { nav.classList.remove("hidden"); fab.classList.remove("hidden"); }
  const tabName = TAB_OF[name] || state.currentTab;
  state.currentTab = tabName;
  $$(".navitem").forEach(n=>n.classList.toggle("active", n.dataset.tab===tabName));
}

function mount(name, params, dir){
  const old = $(".screen.active", viewport);
  const scr = document.createElement("div");
  scr.className = "screen";
  scr.dataset.name = name;
  scr.innerHTML = (screens[name]||screens.notfound)(params||{});
  if(dir==="pop"){ scr.style.transform="translateX(-24%)"; scr.style.opacity=".5"; }
  else if(dir==="tab"){ scr.classList.add("tabmode"); }
  viewport.appendChild(scr);
  icons();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    scr.style.transform=""; scr.style.opacity="";
    scr.classList.add("active");
    if(old){
      if(dir==="push"){ old.classList.remove("active"); old.classList.add("behind"); }
      else if(dir==="pop"){ old.classList.remove("active"); old.style.transform="translateX(100%)"; old.style.opacity="0"; }
      else { old.classList.remove("active"); old.style.opacity="0"; }
      setTimeout(()=>old.remove(), 360);
    }
    if(screens["after_"+name]) screens["after_"+name](params||{}, scr);
  }));
  updateChrome(name);
}

function go(name, params={}){ stack.push({name,params}); mount(name,params,"push"); }
function back(){
  if(stack.length<=1){ return; }
  stack.pop();
  const top=stack[stack.length-1];
  mount(top.name, top.params, "pop");
}
function tab(name){ stack=[{name,params:{}}]; mount(name,{},"tab"); }
function rerender(){ const top=stack[stack.length-1]; mount(top.name, top.params, "tab"); }

/* ---------- onboarding ---------- */
let obIndex=0;
const OB = [
  { kicker:"Welcome to Padel One", img:IMG.ob1, h:"Everything padel. Finally in one place.", p:"Courts, players, clubs, competitions and coaching — one beautifully simple app. Walk onto the court, we handle the rest." },
  { kicker:"Smart matchmaking", img:IMG.ob2, h:"Find the right game — not just any game.", p:"We recommend players and matches at your level, near you, when you're free. No more mismatched hits or no-shows." },
  { kicker:"No surprises", img:IMG.ob3, h:"Book with confidence.", p:"Transparent prices, secure bookings, automatic match protection and real human support whenever you need it." },
];
function renderOnboarding(){
  const ob=$("#onboarding");
  ob.innerHTML = `
    ${OB.map((s,i)=>`
      <div class="ob-slide ${i===0?"on":""}" data-i="${i}">
        <div class="ob-hero">${courtImg(s.img, s.h)}</div>
        <div class="ob-body">
          <div class="ob-kicker">${s.kicker}</div>
          <h1>${s.h}</h1>
          <p>${s.p}</p>
        </div>
      </div>`).join("")}
    <div class="ob-dots">${OB.map((_,i)=>`<span class="${i===0?"on":""}"></span>`).join("")}</div>
    <div class="ob-actions">
      <button class="btn primary" id="obNext">Continue</button>
      <div class="btnrow">
        <button class="btn line" onclick="finishOnboarding('signin')">Sign in</button>
        <button class="btn line" onclick="startSetup()">Create account</button>
      </div>
      <button class="btn" style="background:transparent" onclick="exploreDemo()"><i data-lucide="play"></i> Explore demo</button>
      <button class="btn" style="background:transparent;color:var(--dim)" onclick="exploreDemo()">Skip</button>
    </div>`;
  $("#obNext").onclick = ()=>{
    if(obIndex<OB.length-1){ setOb(obIndex+1); }
    else startSetup();
  };
  icons();
}
function setOb(i){
  obIndex=i;
  $$(".ob-slide").forEach(s=>s.classList.toggle("on", +s.dataset.i===i));
  $$(".ob-dots span").forEach((d,di)=>d.classList.toggle("on", di===i));
  $("#obNext").textContent = i===OB.length-1 ? "Get started" : "Continue";
}
function exploreDemo(){ finishOnboarding("demo"); }
function finishOnboarding(mode){
  store.set("seen", true);
  $("#onboarding").style.display="none";
  tab("home");
  if(mode==="demo") setTimeout(()=>toast("Demo mode — explore freely","play"), 500);
}
function startSetup(){
  $("#onboarding").style.display="none";
  stack=[{name:"home",params:{}}]; // base
  go("setup");
}

/* ---------- global wiring ---------- */
function wireChrome(){
  $$(".navitem").forEach(n=> n.onclick = ()=> tab(n.dataset.tab));
  $("#demoFab").onclick = ()=> go("demoMenu");
  $("#sheetClose").onclick = closeSheet;
  $("#sheetBackdrop").onclick = closeSheet;
}

/* ---------- boot ---------- */
window.addEventListener("DOMContentLoaded", ()=>{
  initTheme();
  wireChrome();
  renderOnboarding();
  // first screen behind onboarding
  mount("home", {}, "tab");
  if(store.get("seen", false)){ $("#onboarding").style.display="none"; }
  icons();
});
