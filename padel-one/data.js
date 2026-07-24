/* ============================================================
   PADEL ONE — mock data (all local, no backend)
   ============================================================ */

// Local photo assets (bundled — works offline / on Netlify with no CDN dependency).
const IMG = {
  court1: "court1", court2: "court2", court3: "court3", court4: "court4", court5: "court5",
  hero:   "court1",
  ob1:    "ob1", ob2: "ob2", ob3: "ob3",
  club1:  "court2", club2: "court4",
  community1: "community1", community2: "community2",
};
function unsplash(id, w) { return `assets/${id}.jpg`; }

// Simple deterministic avatars (DiceBear-free — use ui-avatars-style svg data uri fallback in app.js)
const ME = {
  id: "u_aiman",
  name: "Aiman",
  first: "Aiman",
  level: 3.25,
  confidence: "Medium",
  reliability: 96,
  streak: 4,
  side: "Right",
  suburb: "Bankstown",
  style: "Competitive & social",
  matches: 68,
  sportsmanship: 4.8,
  verified: true,
  color: "6C5CE7",
};

const PLAYERS = [
  { id:"p_omar", name:"Omar Hassan", level:3.10, reliability:94, side:"Left", style:"Competitive", matches:52, suburb:"Lakemba", color:"E17055", rel:"Highly reliable", sport:4.7, mutual:5 },
  { id:"p_sarah", name:"Sarah Nguyen", level:3.35, reliability:98, side:"Right", style:"Both", matches:88, suburb:"Marrickville", color:"00B894", rel:"Highly reliable", sport:4.9, mutual:8 },
  { id:"p_daniel", name:"Daniel Costa", level:3.40, reliability:91, side:"Either", style:"Competitive", matches:120, suburb:"Parramatta", color:"0984E3", rel:"Consistent player", sport:4.6, mutual:3 },
  { id:"p_mia", name:"Mia Wilson", level:2.95, reliability:89, side:"Right", style:"Social", matches:31, suburb:"Newtown", color:"E84393", rel:"Building history", sport:4.8, mutual:2 },
  { id:"p_lucas", name:"Lucas Ferreira", level:3.20, reliability:95, side:"Left", style:"Both", matches:64, suburb:"Bankstown", color:"FDCB6E", rel:"Highly reliable", sport:4.7, mutual:6 },
  { id:"p_zara", name:"Zara Ali", level:3.30, reliability:97, side:"Either", style:"Competitive", matches:73, suburb:"Auburn", color:"6C5CE7", rel:"Highly reliable", sport:4.9, mutual:4 },
  { id:"p_jack", name:"Jack Thompson", level:2.80, reliability:85, side:"Right", style:"Social", matches:19, suburb:"Ashfield", color:"00CEC9", rel:"New player", sport:4.5, mutual:1 },
  { id:"p_layla", name:"Layla Haddad", level:3.45, reliability:99, side:"Left", style:"Competitive", matches:104, suburb:"Strathfield", color:"FF7675", rel:"Highly reliable", sport:5.0, mutual:7 },
];
function player(id){ return PLAYERS.find(p=>p.id===id) || ME; }

const CLUBS = [
  {
    id:"c_syd", name:"Sydney Padel Centre", suburb:"Alexandria", postcode:"2015",
    dist:3.2, rating:4.8, reviews:214, type:"Indoor & outdoor", price:22.5, courts:6,
    img:IMG.court1, verified:true, instant:true, cancel:"Free up to 24h before",
    amenities:["Pro shop","Café","Showers","Parking","Racket hire","Lights"],
    open:"6:00 AM – 11:00 PM", phone:"(02) 9555 0123", address:"14 Bourke Rd, Alexandria NSW 2015",
    next:"Today 7:30 PM", fav:true,
  },
  {
    id:"c_bankstown", name:"Bankstown Padel Club", suburb:"Bankstown", postcode:"2200",
    dist:1.1, rating:4.6, reviews:98, type:"Indoor", price:20, courts:4,
    img:IMG.court2, verified:true, instant:true, cancel:"Free up to 12h before",
    amenities:["Café","Showers","Parking","Racket hire"],
    open:"6:30 AM – 10:30 PM", phone:"(02) 9722 4400", address:"88 Chapel Rd, Bankstown NSW 2200",
    next:"Today 8:00 PM", fav:false,
  },
  {
    id:"c_parra", name:"Parramatta Racquet Hub", suburb:"Parramatta", postcode:"2150",
    dist:9.4, rating:4.7, reviews:156, type:"Outdoor", price:24, courts:8,
    img:IMG.court4, verified:true, instant:false, cancel:"Free up to 48h before",
    amenities:["Pro shop","Café","Bar","Showers","Parking","Coaching","Lights"],
    open:"5:30 AM – 11:00 PM", phone:"(02) 9633 7788", address:"2 Church St, Parramatta NSW 2150",
    next:"Tomorrow 6:00 AM", fav:false,
  },
  {
    id:"c_innerwest", name:"Inner West Padel", suburb:"Marrickville", postcode:"2204",
    dist:5.6, rating:4.5, reviews:72, type:"Indoor & outdoor", price:21, courts:3,
    img:IMG.court3, verified:false, instant:true, cancel:"Free up to 24h before",
    amenities:["Café","Showers","Racket hire","Lights"],
    open:"7:00 AM – 10:00 PM", phone:"(02) 9569 1200", address:"31 Sydenham Rd, Marrickville NSW 2204",
    next:"Today 9:00 PM", fav:false,
  },
  {
    id:"c_harbour", name:"Harbour Padel Courts", suburb:"Rozelle", postcode:"2039",
    dist:7.8, rating:4.9, reviews:188, type:"Outdoor", price:28, courts:5,
    img:IMG.court5, verified:true, instant:true, cancel:"Free up to 24h before",
    amenities:["Pro shop","Café","Bar","Showers","Parking","Coaching","Lights","Waterfront"],
    open:"6:00 AM – 10:30 PM", phone:"(02) 9810 5566", address:"3 Terry St, Rozelle NSW 2039",
    next:"Today 7:00 PM", fav:true,
  },
];
function club(id){ return CLUBS.find(c=>c.id===id) || CLUBS[0]; }

// Mutable booking store
let BOOKINGS = [
  {
    id:"PDL-8842-QX", clubId:"c_syd", court:"Court 3", date:"Wed, 29 Jul",
    time:"7:30 PM – 9:00 PM", duration:"90 min", status:"Confirmed",
    players:["u_aiman","p_sarah","p_lucas","p_zara"], perPerson:22.5, total:90,
    paid:22.5, method:"Visa •• 4291", cancelBy:"Tue 28 Jul, 7:30 PM", refund:"Full refund before deadline",
    tab:"upcoming",
  },
  {
    id:"PDL-8790-RM", clubId:"c_harbour", court:"Court 2", date:"Sat, 26 Jul",
    time:"9:00 AM – 10:30 AM", duration:"90 min", status:"Payment authorised",
    players:["u_aiman","p_omar"], perPerson:28, total:56, paid:0, authorised:28,
    method:"Visa •• 4291", cancelBy:"Fri 25 Jul, 9:00 AM", refund:"No charge until match fills",
    tab:"awaiting", matchFill:{have:2,need:4,deadline:"Fri 25 Jul, 6:00 PM"},
  },
  {
    id:"PDL-8611-KT", clubId:"c_bankstown", court:"Court 1", date:"Sat, 19 Jul",
    time:"6:00 PM – 7:30 PM", duration:"90 min", status:"Completed",
    players:["u_aiman","p_daniel","p_mia","p_jack"], perPerson:20, total:80,
    paid:20, method:"Visa •• 4291", cancelBy:"—", refund:"—", tab:"completed",
  },
  {
    id:"PDL-8402-ZP", clubId:"c_innerwest", court:"Court 2", date:"Sun, 13 Jul",
    time:"8:00 PM – 9:30 PM", duration:"90 min", status:"Refund processing",
    players:["u_aiman","p_lucas"], perPerson:21, total:42, paid:0, refundAmt:21,
    method:"Visa •• 4291", cancelBy:"—", refund:"Refund expected by 16 Jul", tab:"refunds",
  },
];

let MATCHES = [
  {
    id:"m_1", clubId:"c_syd", date:"Tonight", time:"7:30 PM", dist:3.2, type:"Competitive",
    have:3, need:4, levelMin:3.1, levelMax:3.5, avgRel:95, perPlayer:22.5, court:"Indoor",
    players:["p_sarah","p_lucas","p_zara"], organiser:"p_sarah", cancelBy:"Today 5:30 PM",
    tags:["Excellent level match","Reliable organiser","You've played here before"], side:"Any",
    approval:false, gender:"No preference", note:"Fast-paced, want a solid 4th. Winners stay on.",
  },
  {
    id:"m_2", clubId:"c_bankstown", date:"Tomorrow", time:"8:00 PM", dist:1.1, type:"Social",
    have:2, need:4, levelMin:2.8, levelMax:3.3, avgRel:90, perPlayer:20, court:"Indoor",
    players:["p_lucas","p_jack"], organiser:"p_lucas", cancelBy:"Tomorrow 6:00 PM",
    tags:["Friends are playing","Matches your availability"], side:"Any",
    approval:false, gender:"No preference", note:"Chill social hit, all welcome.",
  },
  {
    id:"m_3", clubId:"c_harbour", date:"Sat 26 Jul", time:"9:00 AM", dist:7.8, type:"Competitive",
    have:3, need:4, levelMin:3.2, levelMax:3.6, avgRel:97, perPlayer:28, court:"Outdoor",
    players:["p_daniel","p_layla","p_zara"], organiser:"p_layla", cancelBy:"Fri 25 Jul, 8:00 PM",
    tags:["Excellent level match","Reliable organiser"], side:"Left preferred",
    approval:true, gender:"No preference", note:"Ladder practice. Approval required.",
  },
  {
    id:"m_4", clubId:"c_parra", date:"Sun 27 Jul", time:"6:00 PM", dist:9.4, type:"Social",
    have:1, need:4, levelMin:2.6, levelMax:3.4, avgRel:88, perPlayer:24, court:"Outdoor",
    players:["p_mia"], organiser:"p_mia", cancelBy:"Sun 27 Jul, 4:00 PM",
    tags:["Matches your availability"], side:"Any",
    approval:false, gender:"No preference", note:"New-ish group, super friendly.",
  },
];
function match(id){ return MATCHES.find(m=>m.id===id); }

const RESULTS = [
  { id:"r_1", date:"Sat 19 Jul", clubId:"c_bankstown", partner:"p_daniel", opp1:"p_mia", opp2:"p_jack",
    score:"6-3, 6-4", win:true, status:"Confirmed", delta:"+0.03" },
  { id:"r_2", date:"Wed 16 Jul", clubId:"c_syd", partner:"p_sarah", opp1:"p_zara", opp2:"p_layla",
    score:"4-6, 6-7", win:false, status:"Confirmed", delta:"-0.01" },
  { id:"r_3", date:"Sun 13 Jul", clubId:"c_innerwest", partner:"p_lucas", opp1:"p_omar", opp2:"p_daniel",
    score:"7-5, 6-2", win:true, status:"Awaiting confirmation", delta:"pending" },
];

const NOTIFS = [
  { id:1, cat:"Match nearly full", icon:"users", color:"lime", t:"Sarah's match at Sydney Padel Centre needs 1 more player", tm:"12 min ago", unread:true },
  { id:2, cat:"Payment confirmation", icon:"check-circle", color:"green", t:"Your booking PDL-8842-QX is confirmed — $22.50 charged", tm:"1 hr ago", unread:true },
  { id:3, cat:"Player joined", icon:"user-plus", color:"blue", t:"Lucas Ferreira joined your Wednesday match", tm:"3 hr ago", unread:true },
  { id:4, cat:"Cancellation deadline", icon:"clock", color:"amber", t:"Reminder: free cancellation for Saturday's match ends in 6 hours", tm:"5 hr ago", unread:false },
  { id:5, cat:"Result confirmation", icon:"trophy", color:"violet", t:"Confirm the score from your match with Lucas — tap to review", tm:"Yesterday", unread:false },
  { id:6, cat:"Refund update", icon:"rotate-ccw", color:"green", t:"Refund of $21.00 is on its way — expected by 16 Jul", tm:"Yesterday", unread:false },
  { id:7, cat:"Club announcement", icon:"megaphone", color:"blue", t:"Harbour Padel Courts added 2 new outdoor courts", tm:"2 days ago", unread:false },
  { id:8, cat:"Friend activity", icon:"heart", color:"red", t:"Zara Ali and 3 others are playing this week", tm:"2 days ago", unread:false },
];

const COMMUNITY = [
  { id:"cm_1", author:"p_sarah", type:"Looking for player", time:"20 min ago",
    text:"Need 1 more for a competitive hit tonight at Sydney Padel Centre, 7:30 PM. Level ~3.3. Who's in? 🎾",
    likes:12, comments:5, img:null, tag:"Looking for player" },
  { id:"cm_2", author:"p_layla", type:"Match photo", time:"2 hr ago",
    text:"Ladder night at Harbour was 🔥 — thanks for the games everyone!",
    likes:48, comments:11, img:IMG.community1, tag:"Match" },
  { id:"cm_3", author:"p_daniel", type:"Coaching tip", time:"Yesterday",
    text:"Tip: on the bandeja, keep contact out in front and brush up-and-through. Control > power at our level.",
    likes:34, comments:8, img:null, tag:"Coaching tip" },
  { id:"cm_4", author:"p_mia", type:"Club update", time:"2 days ago",
    text:"First time playing at Inner West Padel and loved it — courts are spotless and staff super friendly! 💚",
    likes:21, comments:3, img:IMG.community2, tag:"Review" },
];
function post(id){ return COMMUNITY.find(p=>p.id===id); }

const GROUPS = [
  { id:"g_wed", name:"Wednesday Night Padel", members:8, next:"Wed 29 Jul, 7:30 PM", clubId:"c_syd",
    memberIds:["u_aiman","p_sarah","p_lucas","p_zara","p_omar","p_daniel","p_mia","p_layla"],
    split:"3 of 4 paid", poll:"6 available Wed" },
  { id:"g_sat", name:"Saturday Squad", members:5, next:"Sat 26 Jul, 9:00 AM", clubId:"c_harbour",
    memberIds:["u_aiman","p_omar","p_layla","p_daniel","p_zara"],
    split:"Fully paid", poll:"4 available Sat" },
];

const TOURNAMENTS = [
  { id:"t_1", name:"Winter Americano", clubId:"c_syd", format:"Americano", date:"Sat 2 Aug",
    fee:35, spots:4, total:16, level:"3.0 – 3.5", prizes:"Pro shop vouchers", eligibility:"Open, mixed" },
  { id:"t_2", name:"Bankstown Club Ladder", clubId:"c_bankstown", format:"Ladder league", date:"Ongoing · Aug",
    fee:20, spots:2, total:24, level:"All levels", prizes:"Trophy + $200", eligibility:"Members" },
  { id:"t_3", name:"Harbour Knockout Cup", clubId:"c_harbour", format:"Knockout", date:"Sun 10 Aug",
    fee:40, spots:6, total:32, level:"3.2+", prizes:"$500 prize pool", eligibility:"Competitive" },
  { id:"t_4", name:"Sunday Social Round Robin", clubId:"c_innerwest", format:"Round robin", date:"Sun 3 Aug",
    fee:18, spots:8, total:12, level:"2.5 – 3.2", prizes:"Coffee + medals", eligibility:"Social, open" },
];
function tournament(id){ return TOURNAMENTS.find(t=>t.id===id); }

const STANDINGS = [
  { pos:1, id:"p_layla", pts:28, played:9 },
  { pos:2, id:"p_zara", pts:24, played:9 },
  { pos:3, id:"u_aiman", pts:22, played:8 },
  { pos:4, id:"p_daniel", pts:19, played:9 },
  { pos:5, id:"p_sarah", pts:17, played:8 },
];

const COACHES = [
  { id:"co_1", name:"Ricardo Alves", color:"0984E3", rating:4.9, reviews:64, price:70, suburb:"Alexandria",
    quals:["FIP Level 2","10+ yrs pro"], specialties:["Advanced tactics","Match analysis"], langs:["English","Portuguese","Spanish"],
    bio:"Former pro from São Paulo. Focus on positioning and shot selection.", intro:true },
  { id:"co_2", name:"Emma Clarke", color:"E84393", rating:4.8, reviews:41, price:60, suburb:"Rozelle",
    quals:["FIP Level 1","Junior specialist"], specialties:["Beginners","Junior coaching"], langs:["English"],
    bio:"Patient, encouraging coach who loves building confidence in new players.", intro:false },
  { id:"co_3", name:"Marco Bianchi", color:"00B894", rating:5.0, reviews:88, price:85, suburb:"Parramatta",
    quals:["FIP Level 3","National coach"], specialties:["Competitive","Serve & smash"], langs:["English","Italian"],
    bio:"High-performance coach. Works with ladder and tournament players.", intro:true },
];
function coach(id){ return COACHES.find(c=>c.id===id); }

// default saved search filters (persisted in localStorage)
const DEFAULT_FILTERS = {
  distance: 10, date: "Any", time: "Any", indoor: "Any", courtType: "Any",
  priceMax: 40, levelMin: 2.5, levelMax: 4.0, play: "Any", gender: "No preference",
  amenities: [], instant: false, cancel: "Any", favOnly: false,
};

const FAQS = [
  { q:"When am I actually charged for a match?", a:"For open matches, we only place an authorisation hold. You're charged when the match fills before its deadline. If it doesn't fill, the hold is released and you pay nothing." },
  { q:"How do I get a refund?", a:"Cancel before the club's deadline for a full refund. You can track every refund in Wallet → Refunds, with an expected arrival date." },
  { q:"Can I speak to a real person?", a:"Always. Every support screen has a 'Speak to a person' button — live chat, phone callback or email. The bot only helps if you want it to." },
  { q:"How is my level calculated?", a:"From your match results, opponent strength, competition format and a confidence rating. Open the Level Centre for a plain-English breakdown of every change." },
  { q:"A result is wrong — what do I do?", a:"Every result needs confirmation from all players. You can reject, request a correction, add evidence or ask for human review. Nothing is locked without a path to fix it." },
];
