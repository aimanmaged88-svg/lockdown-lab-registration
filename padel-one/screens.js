/* ============================================================
   PADEL ONE — screen renderers
   ============================================================ */
const screens = {};

/* small local helpers */
function heroImg(id, alt){
  return `<div class="imgwrap" style="position:absolute;inset:0">${courtImg(id,alt).replace('<div class="imgwrap">','').replace(/<\/div>$/,'')}</div>`;
}
function amenityChips(list){ return list.map(a=>chip(a)).join(""); }

/* ---------------- HOME ---------------- */
screens.home = () => {
  const nb = BOOKINGS.find(b=>b.tab==="upcoming");
  const c = club(nb.clubId);
  return `
  <div class="scroll stagger">
    <div class="topbar">
      <div style="flex:1">
        <div class="dim f13 fw6">Good evening</div>
        <h2 style="margin-top:2px">Aiman 👋</h2>
      </div>
      <button class="iconbtn" onclick="go('search')"><i data-lucide="search"></i></button>
      <button class="iconbtn" onclick="go('notifications')"><i data-lucide="bell"></i><span class="dot"></span></button>
      <button class="iconbtn ghost" onclick="tab('profile')" style="padding:0;overflow:hidden">${avatar(ME,"s")}</button>
    </div>

    <div class="pad">
      <div class="row gap8" style="margin-bottom:16px">
        <div class="stat" style="flex:1"><div class="num">${ME.level.toFixed(2)}</div><div class="lab">Your level</div></div>
        <div class="stat" style="flex:1"><div class="num">${ME.reliability}%</div><div class="lab">Reliability</div></div>
        <div class="stat" style="flex:1"><div class="num">${ME.streak}<span style="font-size:14px"> wk</span></div><div class="lab">Streak 🔥</div></div>
      </div>

      <div class="hero">
        <h2>Ready for your next match?</h2>
        <p>3 open matches near you tonight · 2 courts free</p>
        <div class="btnrow">
          <button class="btn primary" onclick="tab('play')"><i data-lucide="swords"></i> Find a match</button>
          <button class="btn dark" onclick="tab('clubs')"><i data-lucide="calendar-plus"></i> Book a court</button>
        </div>
      </div>
    </div>

    <div class="sectiontitle"><h3>Your next booking</h3><span class="link" onclick="go('bookings')">All bookings</span></div>
    <div class="pad">
      <div class="card" onclick="go('clubDetail',{id:'${c.id}'})" style="cursor:pointer">
        <div class="row">
          <div class="imgwrap" style="width:64px;height:64px;border-radius:14px;flex-shrink:0">${courtImg(c.img,c.name).replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>
          <div class="grow" style="flex:1">
            <div class="between"><div class="fw7 f15">${c.name}</div>${statusBadge("Confirmed")}</div>
            <div class="muted f13 mt4">${nb.court} · ${nb.date}</div>
            <div class="muted f13">${nb.time}</div>
          </div>
        </div>
        <div class="row gap8 mt12">
          <div class="avstack">${nb.players.map(p=>avatar(player(p),"s")).join("")}</div>
          <span class="muted f13">${nb.players.length} players · ${money(nb.perPerson)}/person</span>
        </div>
      </div>
    </div>

    <div class="sectiontitle"><h3>Players needed near you</h3><span class="link" onclick="tab('play')">See all</span></div>
    <div class="pad"><div class="chiprow scrollx" style="gap:12px;padding-bottom:4px">
      ${MATCHES.slice(0,3).map(m=>{const cl=club(m.clubId);return `
        <div onclick="go('matchDetail',{id:'${m.id}'})" style="min-width:220px;cursor:pointer" class="card tight">
          <div class="between mb8">${chip(m.type, m.type==="Competitive"?"amber":"green")}<span class="dim f12">${m.dist} km</span></div>
          <div class="fw7 f15">${cl.name}</div>
          <div class="muted f13 mb8">${m.date} · ${m.time}</div>
          ${slots(m.have,m.need)}
          <div class="between mt10"><span class="f12 muted">${m.need-m.have} spot left</span>${levelPill(m.levelMin,true)}</div>
        </div>`;}).join("")}
    </div></div>

    <div class="sectiontitle"><h3>Courts available tonight</h3><span class="link" onclick="tab('clubs')">Map</span></div>
    <div class="pad">${CLUBS.slice(0,2).map(courtCard).join("")}</div>

    <div class="sectiontitle"><h3>Complete your profile</h3></div>
    <div class="pad"><div class="card" style="border-color:rgba(201,242,77,0.3)">
      <div class="row"><div class="lrow" style="border:none;padding:0;flex:1">
        <div class="ic" style="background:rgba(201,242,77,0.14);border-color:transparent"><i data-lucide="sparkles" style="color:var(--lime)"></i></div>
        <div class="grow"><div class="t">80% complete</div><div class="s">Add availability to improve match recs</div></div>
      </div></div>
      <div class="bar mt12"><i style="width:80%"></i></div>
      <button class="btn primary mt12" onclick="go('setup')">Finish setup</button>
    </div></div>

    <div class="sectiontitle"><h3>Recent results</h3><span class="link" onclick="go('results')">History</span></div>
    <div class="pad">${RESULTS.slice(0,2).map(resultRow).join("")}</div>

    <div class="sectiontitle"><h3>Upcoming tournaments</h3><span class="link" onclick="go('compete')">All</span></div>
    <div class="pad">${TOURNAMENTS.slice(0,2).map(tourneyRow).join("")}</div>
  </div>`;
};

function courtCard(c){
  return `
  <div class="pcard mb12" onclick="go('clubDetail',{id:'${c.id}'})" style="cursor:pointer">
    <div class="top">
      ${courtImg(c.img,c.name)}
      <div class="grad"></div>
      <div class="float badges">
        ${c.instant?chip("Instant","solid","zap"):""}
        ${chip(c.type.includes("Outdoor")&&!c.type.includes("&")?"Outdoor":c.type.includes("&")?"In/Out":"Indoor", "")}
      </div>
      <div class="float fav ${isFav(c.id)?"on":""}" onclick="event.stopPropagation();favTap(this,'${c.id}')"><i data-lucide="heart"></i></div>
      <div class="float name">
        <h3>${c.name}</h3>
        <div class="sub">${c.suburb} · ${c.dist} km away</div>
      </div>
    </div>
    <div class="body">
      <div class="between">
        <div class="chiprow">${chip(c.rating+" ★","amber")}${chip(c.next,"")}</div>
        <div class="fw8 f17">${money(c.price)}<span class="muted f12 fw6">/person</span></div>
      </div>
    </div>
  </div>`;
}
function favTap(elm, id){ toggleFav(id); elm.classList.toggle("on", isFav(id)); toast(isFav(id)?"Saved to favourites":"Removed from favourites","heart"); }

function resultRow(r){
  const cl=club(r.clubId);
  return `<div class="card tight mb12" onclick="go('results')" style="cursor:pointer">
    <div class="between">
      <div class="row gap8">${avatar(player(r.partner),"s")}
        <div><div class="fw7 f14">${r.win?"Win":"Loss"} · ${r.score}</div><div class="muted f12">${cl.name} · ${r.date}</div></div>
      </div>
      ${r.status==="Confirmed"?chip(r.delta, r.win?"green":"red"):statusBadge(r.status)}
    </div>
  </div>`;
}
function tourneyRow(t){
  const cl=club(t.clubId);
  return `<div class="card tight mb12" onclick="go('tournamentDetail',{id:'${t.id}'})" style="cursor:pointer">
    <div class="between">
      <div><div class="fw7 f15">${t.name}</div><div class="muted f13">${t.format} · ${cl.name}</div><div class="dim f12 mt4">${t.date} · ${money(t.fee)} entry</div></div>
      <div class="center"><div class="lvl ghost">${t.spots}</div><div class="dim f11 mt4">spots left</div></div>
    </div>
  </div>`;
}

/* ---------------- PLAY (find a match) ---------------- */
screens.play = () => `
  <div class="scroll">
    <div class="topbar"><h2>Play</h2>
      <button class="iconbtn" onclick="go('compete')"><i data-lucide="trophy"></i></button>
      <button class="iconbtn" onclick="go('coaching')"><i data-lucide="graduation-cap"></i></button>
    </div>
    <div class="pad">
      <div class="hero" style="background:linear-gradient(135deg,#12233a,#0c141f);border-color:rgba(77,166,255,0.25)">
        <h2>Find your next game</h2>
        <p>Matched to your level, near you, when you're free</p>
        <button class="btn primary" onclick="go('createMatch')"><i data-lucide="plus"></i> Create an open match</button>
      </div>
    </div>
    <div class="seg mt16" id="playSeg">
      <button class="on" onclick="segTap(this)">Recommended</button>
      <button onclick="segTap(this)">Competitive</button>
      <button onclick="segTap(this)">Social</button>
    </div>
    <div class="sectiontitle"><h3>Open matches</h3><span class="link"><i data-lucide="sliders-horizontal" style="width:15px;height:15px;vertical-align:-2px"></i> Filters</span></div>
    <div class="pad stagger">${MATCHES.map(matchCard).join("")}</div>
  </div>`;
function segTap(b){ [...b.parentNode.children].forEach(x=>x.classList.remove("on")); b.classList.add("on"); }

function matchCard(m){
  const cl=club(m.clubId), org=player(m.organiser);
  return `
  <div class="card mb12" onclick="go('matchDetail',{id:'${m.id}'})" style="cursor:pointer">
    <div class="between mb8">
      <div class="chiprow">${chip(m.type, m.type==="Competitive"?"amber":"green", m.type==="Competitive"?"flame":"smile")}${chip(m.court)}</div>
      <span class="dim f12">${m.dist} km</span>
    </div>
    <div class="fw7 f17 tl">${cl.name}</div>
    <div class="muted f13 mb12">${m.date} · ${m.time} · ${cl.suburb}</div>
    <div class="between mb12">
      <div class="avstack">${m.players.map(p=>avatar(player(p),"s")).join("")}
        <div class="av s" style="display:grid;place-items:center;background:var(--surface3);color:var(--dim);font-weight:800;font-size:16px">+</div></div>
      <div class="center"><div class="fw8 f17">${money(m.perPlayer)}</div><div class="dim f11">per player</div></div>
    </div>
    ${slots(m.have,m.need)}
    <div class="between mt10">
      <span class="f12 muted">${m.have}/${m.need} joined · lvl ${m.levelMin.toFixed(2)}–${m.levelMax.toFixed(2)}</span>
      ${chip(m.avgRel+"% reliable","green","shield-check")}
    </div>
    <div class="chiprow mt12">${m.tags.slice(0,2).map(t=>chip(t,"lime","check")).join("")}</div>
  </div>`;
}

/* ---------------- MATCH DETAIL ---------------- */
screens.matchDetail = ({id}) => {
  const m=match(id), cl=club(m.clubId), org=player(m.organiser);
  return `
  <div class="scroll nonav">
    ${topbar(cl.name, {solid:true, actions:`<button class="iconbtn ghost" onclick="toast('Match saved','bookmark')"><i data-lucide="bookmark"></i></button>`})}
    <div style="position:relative;height:190px">${courtImg(cl.img,cl.name)}<div class="grad" style="position:absolute;inset:0;background:linear-gradient(transparent,var(--bg))"></div></div>
    <div class="pad" style="margin-top:-30px;position:relative">
      <div class="chiprow mb12">${chip(m.type,m.type==="Competitive"?"amber":"green")}${chip(m.court)}${chip(m.dist+" km")}</div>
      <h2 class="tl" style="margin:0 0 4px">${m.date} · ${m.time}</h2>
      <div class="muted">${cl.name} · ${cl.suburb}</div>

      <div class="card mt16">
        <div class="between mb12"><div class="fw7">${m.have} of ${m.need} players in</div>${chip(m.need-m.have+" spot"+(m.need-m.have>1?"s":"")+" left","lime")}</div>
        ${m.players.map(p=>{const pl=player(p);return `<div class="lrow"><div style="width:40px">${avatar(pl,"m")}</div><div class="grow"><div class="t">${pl.name} ${p===m.organiser?'<span class="dim f12">· organiser</span>':""}</div><div class="s">${pl.side} side · ${pl.rel}</div></div>${levelPill(pl.level,true)}</div>`;}).join("")}
        <div class="lrow"><div class="ic"><i data-lucide="user-plus"></i></div><div class="grow"><div class="t dim">Open spot</div><div class="s">Level ${m.levelMin.toFixed(2)}–${m.levelMax.toFixed(2)}</div></div></div>
      </div>

      <div class="sectiontitle" style="margin-left:0;margin-right:0"><h3>Why this is a great match</h3></div>
      <div class="finebox">${m.tags.map(t=>`<div class="fr"><i data-lucide="check-circle"></i>${t}</div>`).join("")}</div>

      <div class="card mt16">
        <div class="between"><span class="muted f13">Cost per player</span><span class="fw8 f17">${money(m.perPlayer)}</span></div>
        <div class="between mt8"><span class="muted f13">Free cancellation until</span><span class="fw7 f13">${m.cancelBy}</span></div>
        <div class="finebox mt12" style="background:rgba(201,242,77,0.08);border-color:rgba(201,242,77,0.2)">
          <div class="fr"><i data-lucide="shield"></i><span style="color:var(--text)"><b>Automatically protected.</b> If the match doesn't fill by the deadline, it cancels and you're not charged.</span></div>
        </div>
      </div>
      <div style="height:12px"></div>
      <div class="finebox mb12"><div class="fr"><i data-lucide="message-circle"></i>${org.name} says: “${m.note}”</div></div>
    </div>
    <div style="position:sticky;bottom:0;padding:14px 18px;background:linear-gradient(transparent,var(--bg) 30%);display:flex;gap:10px">
      <button class="btn line wauto" style="flex:0 0 auto;width:52px" onclick="toast('Question sent to organiser','send')"><i data-lucide="message-circle-question"></i></button>
      <button class="btn primary" onclick="joinMatch('${m.id}')">${m.approval?"Request to join":"Join instantly"} · ${money(m.perPlayer)}</button>
    </div>
  </div>`;
};
function joinMatch(id){
  const m=match(id);
  if(m.have<m.need) m.have++;
  toast(m.approval?"Request sent — organiser will confirm":"You're in! Match lobby open","check-circle");
  setTimeout(()=>go("matchLobby",{id}), 700);
}

/* ---------------- MATCH LOBBY ---------------- */
screens.matchLobby = ({id}) => {
  const m=match(id), cl=club(m.clubId);
  const team = m.players.slice(0,2), team2=[m.players[2]||"p_zara", ME.id];
  return `
  <div class="scroll nonav">
    ${topbar("Match lobby",{actions:`<button class="iconbtn ghost" onclick="toast('Reported to safety team','flag')"><i data-lucide="flag"></i></button>`})}
    <div class="pad">
      <div class="card" style="background:linear-gradient(135deg,#1a2e12,#0f1a0c);border-color:rgba(201,242,77,0.25)">
        <div class="between"><div><div class="fw8 f20 tl">${cl.name}</div><div class="muted">${m.date} · ${m.time}</div></div>${chip("You're in","solid","check")}</div>
        <div class="row gap10 mt16">
          <div class="chip"><i data-lucide="cloud-sun"></i> 18° clear</div>
          <div class="chip"><i data-lucide="map-pin"></i> ${cl.suburb}</div>
          <div class="chip"><i data-lucide="door-open"></i> Court ${m.court==="Indoor"?"3":"2"}</div>
        </div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Suggested teams</h3></div>
      <div class="teamcard">
        <div class="between"><div class="row gap8">${team.map(p=>avatar(player(p),"s")).join("")}<span class="fw6 f13">${player(team[0]).name.split(" ")[0]} & ${player(team[1]).name.split(" ")[0]}</span></div><span class="lvl ghost">3.23</span></div>
        <div class="vs">VS</div>
        <div class="between"><div class="row gap8">${team2.map(p=>avatar(player(p),"s")).join("")}<span class="fw6 f13">${player(team2[0]).name.split(" ")[0]} & You</span></div><span class="lvl ghost">3.28</span></div>
        <div class="center dim f12 mt8">Balanced within 0.05 — nice even game</div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Group chat</h3><span class="link">Open</span></div>
      <div class="card tight">
        <div class="row gap8"><div style="width:34px">${avatar(player(m.organiser),"s")}</div><div class="grow"><div class="fw6 f13">${player(m.organiser).name.split(" ")[0]}</div><div class="muted f13">See you all there! I'll bring spare balls 🎾</div></div></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Arrival & rules</h3></div>
      <div class="finebox">
        <div class="fr"><i data-lucide="clock"></i>Arrive 10 min early — courts run on time</div>
        <div class="fr"><i data-lucide="parking-circle"></i>Free parking on-site, enter via Bourke Rd</div>
        <div class="fr"><i data-lucide="scroll-text"></i>Best of 3 sets · americano scoring on tiebreak</div>
      </div>

      <div class="card mt16" style="border-style:dashed">
        <div class="between"><div><div class="fw7">Need another player?</div><div class="muted f13">1 spot still open</div></div>
        <button class="btn primary sm" onclick="openSheet('Invite players', invitePlayersBody())">Invite</button></div>
      </div>
      <div class="btnrow mt16" style="padding-bottom:20px">
        <button class="btn line" onclick="go('clubDetail',{id:'${cl.id}'})"><i data-lucide="phone"></i> Contact club</button>
        <button class="btn line" onclick="toast('Directions opened','navigation')"><i data-lucide="navigation"></i> Directions</button>
      </div>
    </div>
  </div>`;
};
function invitePlayersBody(){
  return `<div class="chiprow mb12">${chip("Suggested for this match","lime","sparkles")}</div>
  ${PLAYERS.slice(0,4).map(p=>`<div class="lrow"><div style="width:40px">${avatar(p,"m")}</div><div class="grow"><div class="t">${p.name}</div><div class="s">${p.rel} · ${p.suburb}</div></div><button class="btn primary sm" onclick="toast('Invite sent to ${p.name.split(" ")[0]}','send')">Invite</button></div>`).join("")}`;
}

/* ---------------- CLUBS / COURT DISCOVERY ---------------- */
screens.clubs = () => {
  const list = CLUBS.filter(c=>!state.hidden[c.id]).filter(c=>!state.filters.favOnly || isFav(c.id));
  return `
  <div class="scroll">
    <div class="topbar"><h2>Clubs & courts</h2>
      <button class="iconbtn" onclick="go('search')"><i data-lucide="search"></i></button>
      <button class="iconbtn" onclick="openSheet('Filters', filtersBody(), filtersFoot())"><i data-lucide="sliders-horizontal"></i></button>
    </div>
    <div class="pad">
      <div class="map mb12">
        ${CLUBS.map((c,i)=>`<div class="pin" style="left:${18+i*17}%;top:${30+(i%3)*22}%"><div class="p">${money(c.price)}</div></div>`).join("")}
        <div class="pin me" style="left:50%;top:70%"><div class="p"><i data-lucide="navigation" style="width:11px;height:11px;vertical-align:-1px"></i> You</div></div>
      </div>
      <div class="seg" style="margin:0 0 4px" id="clubSeg">
        <button class="on" onclick="segTap(this)">List</button>
        <button onclick="segTap(this)">Map</button>
      </div>
      <div class="between mt12 mb8">
        <span class="muted f13">${list.length} clubs near Bankstown</span>
        <span class="link f13" style="color:var(--lime)" onclick="toggleFavOnly(this)">${state.filters.favOnly?"★ Favourites":"All clubs"}</span>
      </div>
    </div>
    <div class="pad stagger">${list.map(courtCard).join("")}</div>
  </div>`;
};
function toggleFavOnly(el){ state.filters.favOnly=!state.filters.favOnly; saveFilters(); rerender(); }

/* ---------------- CLUB DETAIL ---------------- */
screens.clubDetail = ({id}) => {
  const c=club(id);
  return `
  <div class="scroll nonav">
    <div style="position:relative;height:240px">
      ${courtImg(c.img,c.name)}
      <div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,var(--bg))"></div>
      <div class="topbar" style="position:absolute;top:0;left:0;right:0;background:transparent">
        <button class="backbtn" onclick="back()" style="background:rgba(0,0,0,.4);backdrop-filter:blur(8px);border:none;color:#fff"><i data-lucide="chevron-left"></i></button>
        <div style="flex:1"></div>
        <button class="iconbtn" onclick="favTap(this,'${c.id}')" style="background:rgba(0,0,0,.4);color:${isFav(c.id)?"var(--lime)":"#fff"}"><i data-lucide="heart"></i></button>
        <button class="iconbtn" onclick="toast('Club shared','share-2')" style="background:rgba(0,0,0,.4);color:#fff"><i data-lucide="share-2"></i></button>
      </div>
    </div>
    <div class="pad" style="margin-top:-40px;position:relative">
      <div class="row gap8 mb8">${c.verified?chip("Verified","blue","badge-check"):""}${chip(c.rating+" ★ ("+c.reviews+")","amber")}</div>
      <h2 class="tl" style="margin:0">${c.name}</h2>
      <div class="muted mt4">${c.address}</div>
      <div class="btnrow mt16">
        <button class="btn line" onclick="toast('Opening directions','navigation')"><i data-lucide="navigation"></i> Directions</button>
        <button class="btn line" onclick="toast('Calling club','phone')"><i data-lucide="phone"></i> Call</button>
        <button class="btn line" onclick="go('messages')"><i data-lucide="message-circle"></i> Message</button>
      </div>

      <div class="grid2 mt16">
        <div class="stat"><div class="lab">Opening hours</div><div class="fw7 mt4 f14">${c.open}</div></div>
        <div class="stat"><div class="lab">Courts</div><div class="fw7 mt4 f14">${c.courts} · ${c.type}</div></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Availability today</h3></div>
      <div class="chiprow scrollx">${["6:00","7:30","8:00","9:00","9:30"].map((t,i)=>`<button class="opt ${i===1?"on":""}" style="min-width:78px;padding:10px" onclick="go('courtBooking',{id:'${c.id}',time:'${t}'})">${t} PM</button>`).join("")}</div>

      <div class="sectiontitle" style="margin-left:0"><h3>Court photos</h3></div>
      <div class="chiprow scrollx" style="gap:10px">${[c.img,IMG.court3,IMG.court5].map(im=>`<div class="imgwrap" style="width:150px;height:100px;border-radius:14px;flex-shrink:0">${courtImg(im,"court").replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>`).join("")}</div>

      <div class="sectiontitle" style="margin-left:0"><h3>Pricing & memberships</h3></div>
      <div class="card tight">
        <div class="between"><span class="muted f14">Off-peak court (90 min)</span><span class="fw7">${money(c.price*4)}</span></div>
        <div class="between mt10"><span class="muted f14">Peak court (90 min)</span><span class="fw7">${money(c.price*4+16)}</span></div>
        <div class="between mt10"><span class="muted f14">Monthly membership</span><span class="fw7">$89/mo</span></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Facilities</h3></div>
      <div class="chiprow">${amenityChips(c.amenities)}</div>

      <div class="sectiontitle" style="margin-left:0"><h3>Reviews</h3><span class="link">All ${c.reviews}</span></div>
      <div class="card tight">
        <div class="review" style="padding-top:0">
          <div class="row gap8 mb8">${avatar(player("p_sarah"),"s")}<div><div class="fw6 f13">Sarah N.</div>${stars(5)}</div></div>
          <div class="muted f14">Best courts in the inner west. Glass is spotless and booking was seamless.</div>
        </div>
        <div class="review">
          <div class="row gap8 mb8">${avatar(player("p_daniel"),"s")}<div><div class="fw6 f13">Daniel C.</div>${stars(4)}</div></div>
          <div class="muted f14">Great club, café is a nice touch. Peak times fill fast — book early.</div>
        </div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Cancellation & refunds</h3></div>
      <div class="finebox">
        <div class="fr"><i data-lucide="calendar-x"></i>${c.cancel} — full refund</div>
        <div class="fr"><i data-lucide="rotate-ccw"></i>Refunds return to your card in 3–5 business days</div>
        <div class="fr"><i data-lucide="user-round"></i>Human support: ${c.phone}</div>
      </div>
      <button class="btn line mt12 mb12" onclick="toast('Thanks — we\\'ll review this','flag')"><i data-lucide="flag"></i> Report incorrect information</button>
    </div>
    <div style="position:sticky;bottom:0;padding:14px 18px;background:linear-gradient(transparent,var(--bg) 30%);display:flex;gap:10px">
      <button class="btn line wauto" style="flex:0 0 auto;width:56px" onclick="toast('Following ${c.name}','plus')"><i data-lucide="plus"></i></button>
      <button class="btn primary" onclick="go('courtBooking',{id:'${c.id}'})">Book a court · from ${money(c.price)}</button>
    </div>
  </div>`;
};

/* ---------------- COURT BOOKING (4-step) ---------------- */
let bk = { step:1, id:null, date:"Wed 29 Jul", time:"7:30 PM", dur:"90 min", court:"Court 3", players:["u_aiman"], agreed:false };
screens.courtBooking = ({id, time}) => {
  if(id) bk = { step:1, id, date:"Wed 29 Jul", time:time?time+" PM":"7:30 PM", dur:"90 min", court:"Court 3", players:["u_aiman"], agreed:false };
  const c=club(bk.id||"c_syd");
  const steps=["Court & date","Time","Players","Review"];
  const price=c.price, fee=1.9, tax=0, per=price, total=price*bk.players.length+fee;
  return `
  <div class="scroll nonav">
    ${topbar("Book a court",{})}
    <div class="stepbar">${steps.map((s,i)=>`<i class="${i<bk.step?"on":""}"></i>`).join("")}</div>
    <div class="pad mt16"><div class="dim f12 fw6">STEP ${bk.step} OF 4</div><h2 class="tl" style="margin:2px 0 0">${steps[bk.step-1]}</h2></div>
    <div class="pad mt16" id="bkBody">${bookingStep(bk.step, c, {price,fee,tax,total})}</div>
    <div style="position:sticky;bottom:0;padding:14px 18px;background:linear-gradient(transparent,var(--bg) 30%)">
      ${bk.step<4
        ? `<button class="btn primary" onclick="bkNext()">Continue</button>`
        : `<button class="btn primary" id="bkConfirm" onclick="confirmBooking('${c.id}',${total})" ${bk.agreed?"":"disabled style='opacity:.5'"}>Confirm & pay ${money(total)}</button>`}
    </div>
  </div>`;
};
function bookingStep(step, c, p){
  if(step===1) return `
    <div class="imgwrap mb16" style="height:150px;border-radius:18px">${courtImg(c.img,c.name).replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>
    <div class="fw7 f17">${c.name}</div><div class="muted mb16">${c.suburb} · ${c.type}</div>
    <label class="fw7 f13">Choose a court</label>
    <div class="optgrid mt8">${["Court 1","Court 2","Court 3","Court 4"].map(ct=>`<button class="opt ${ct===bk.court?"on":""}" onclick="bkSet('court','${ct}')">${ct}</button>`).join("")}</div>
    <label class="fw7 f13 mt16" style="display:block">Date</label>
    <div class="chiprow scrollx mt8">${["Tue 28","Wed 29","Thu 30","Fri 31","Sat 1"].map((d,i)=>`<button class="opt ${i===1?"on":""}" style="min-width:64px;padding:12px 10px" onclick="bkSet('date','${d} Jul')">${d}</button>`).join("")}</div>`;
  if(step===2) return `
    <label class="fw7 f13">Available times · ${bk.date}</label>
    <div class="optgrid three mt8">${["6:00 PM","7:30 PM","8:00 PM","9:00 PM","9:30 PM","10:00 PM"].map(t=>`<button class="opt ${t===bk.time?"on":""}" onclick="bkSet('time','${t}')">${t}</button>`).join("")}</div>
    <label class="fw7 f13 mt16" style="display:block">Duration</label>
    <div class="optgrid three mt8">${["60 min","90 min","120 min"].map(d=>`<button class="opt ${d===bk.dur?"on":""}" onclick="bkSet('dur','${d}')">${d}</button>`).join("")}</div>
    <div class="finebox mt16"><div class="fr"><i data-lucide="info"></i>Peak pricing applies after 6 PM. Exact cost shown before you pay.</div></div>`;
  if(step===3) return `
    <div class="between mb12"><div class="fw7">Invite players</div><button class="btn line sm" onclick="bkSet('private',1)">Book privately</button></div>
    ${bk.players.map(pid=>`<div class="lrow"><div style="width:40px">${avatar(player(pid),"m")}</div><div class="grow"><div class="t">${player(pid).name}${pid==="u_aiman"?" (you)":""}</div><div class="s">${player(pid).side} side</div></div>${pid!=="u_aiman"?`<button class="iconbtn ghost" onclick="bkRemove('${pid}')"><i data-lucide="x"></i></button>`:chip("Host","lime")}</div>`).join("")}
    <div class="sectiontitle" style="margin-left:0"><h3 class="f15">Suggested partners</h3></div>
    ${PLAYERS.filter(p=>!bk.players.includes(p.id)).slice(0,4).map(p=>`<div class="lrow"><div style="width:40px">${avatar(p,"m")}</div><div class="grow"><div class="t">${p.name}</div><div class="s">${p.rel} · lvl ${p.level.toFixed(2)}</div></div><button class="btn primary sm" onclick="bkAdd('${p.id}')">Add</button></div>`).join("")}`;
  // step 4 review
  const per=c.price, total=per*bk.players.length+p.fee;
  return `
    <div class="card">
      <div class="row"><div class="imgwrap" style="width:56px;height:56px;border-radius:12px">${courtImg(c.img,c.name).replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>
        <div class="grow"><div class="fw7">${c.name}</div><div class="muted f13">${bk.court} · ${bk.date}</div><div class="muted f13">${bk.time} · ${bk.dur}</div></div></div>
      <div class="row gap8 mt12"><div class="avstack">${bk.players.map(pid=>avatar(player(pid),"s")).join("")}</div><span class="muted f13">${bk.players.length} player${bk.players.length>1?"s":""}</span></div>
    </div>
    <div class="card mt12">
      <div class="feetable">
        <div class="feerow"><span class="k">Court cost (${bk.players.length} × ${money(per)})</span><span>${money(per*bk.players.length)}</span></div>
        <div class="feerow"><span class="k">Platform fee</span><span>${money(p.fee)}</span></div>
        <div class="feerow"><span class="k">Taxes</span><span>Included</span></div>
        <div class="feerow total"><span class="k">Total</span><span>${money(total)}</span></div>
      </div>
    </div>
    <div class="finebox mt12">
      <div class="fr"><i data-lucide="calendar-x"></i>Free cancellation until Tue 28 Jul, 7:30 PM</div>
      <div class="fr"><i data-lucide="rotate-ccw"></i>Full refund to your card within 3–5 days</div>
      <div class="fr"><i data-lucide="credit-card"></i>Paying with Visa •• 4291 · <span style="color:var(--lime)">saved</span></div>
    </div>
    <div class="check mt12 ${bk.agreed?"on":""}" id="agreeChk" onclick="bkAgree()">
      <div class="box"><i data-lucide="check"></i></div>
      <div class="txt">I understand the <b>cancellation and refund terms</b> for this booking.</div>
    </div>`;
}
function bkSet(k,v){ if(k==="private"){ toast("Private booking — just you","lock"); return; } bk[k]=v; refreshBk(); }
function bkAdd(id){ if(bk.players.length<4){ bk.players.push(id); refreshBk(); toast(player(id).name.split(" ")[0]+" added","user-plus"); } else toast("Match is full (4 players)","info"); }
function bkRemove(id){ bk.players=bk.players.filter(p=>p!==id); refreshBk(); }
function bkAgree(){ bk.agreed=!bk.agreed; refreshBk(); }
function bkNext(){ if(bk.step<4){ bk.step++; refreshBk(true); } }
function refreshBk(full){ const t=stack[stack.length-1]; mount("courtBooking", {}, "tab"); }

function confirmBooking(cid, total){
  if(!bk.agreed){ toast("Please accept the terms first","alert-triangle"); return; }
  const ref = "PDL-"+Math.floor(1000+Math.random()*9000)+"-"+["QX","RM","KT","ZP"][Math.floor(Math.random()*4)];
  // mark court as no longer available: remove the chosen time from club "next" for realism handled visually
  go("bookingSuccess", {ref, cid, total});
}

/* ---------------- BOOKING SUCCESS ---------------- */
screens.bookingSuccess = ({ref, cid, total}) => {
  const c=club(cid);
  return `
  <div class="scroll nonav" style="padding-bottom:24px">
    <div class="pad" style="padding-top:56px" class="center">
      <div class="success-ring"><i data-lucide="check"></i></div>
      <div class="center"><h2 class="tl" style="margin:0">Your court is confirmed 🎾</h2>
      <p class="muted" style="margin:8px 0 0">${c.name} · ${bk.court}</p></div>
      <div class="card mt20">
        <div class="between"><span class="muted f13">Booking number</span><span class="fw8">${ref}</span></div>
        <div class="between mt10"><span class="muted f13">When</span><span class="fw7 f13">${bk.date} · ${bk.time}</span></div>
        <div class="between mt10"><span class="muted f13">Players</span><span class="fw7 f13">${bk.players.length}</span></div>
        <div class="between mt10"><span class="muted f13">Paid</span><span class="fw7 f13">${money(total)} · Visa •• 4291</span></div>
        <div class="between mt10"><span class="muted f13">Status</span>${statusBadge("Paid")}</div>
      </div>
      <div class="grid2 mt16">
        <button class="btn line" onclick="toast('Added to calendar','calendar-plus')"><i data-lucide="calendar-plus"></i> Add to calendar</button>
        <button class="btn line" onclick="openSheet('Invite players', invitePlayersBody())"><i data-lucide="user-plus"></i> Invite players</button>
        <button class="btn line" onclick="toast('Opening directions','navigation')"><i data-lucide="navigation"></i> Directions</button>
        <button class="btn line" onclick="toast('Calling club','phone')"><i data-lucide="phone"></i> Contact club</button>
      </div>
      <button class="btn primary mt16" onclick="go('bookings')">View booking</button>
      <button class="btn mt10" style="background:transparent" onclick="tab('home')">Back to home</button>
    </div>
  </div>`;
};

/* ---------------- CREATE MATCH ---------------- */
let cm = { type:"Competitive", lvlMin:3.0, lvlMax:3.5, gender:"No preference", side:"Any", visibility:"Public", approval:false };
screens.createMatch = () => `
  <div class="scroll nonav">
    ${topbar("Create open match",{})}
    <div class="pad mt12 stagger">
      <div class="field"><label>Match style</label>
        <div class="optgrid">${["Social","Competitive"].map(t=>`<button class="opt ${cm.type===t?"on":""}" onclick="cmSet('type','${t}')"><span class="t">${t}</span><span class="d">${t==="Social"?"Fun & relaxed":"Keeping score"}</span></button>`).join("")}</div>
      </div>
      <div class="field"><label>Player level range</label>
        <div class="row gap10">
          <div class="stat" style="flex:1;text-align:center"><div class="lab">Min</div><div class="num" style="font-size:20px">${cm.lvlMin.toFixed(2)}</div></div>
          <div class="dim">→</div>
          <div class="stat" style="flex:1;text-align:center"><div class="lab">Max</div><div class="num" style="font-size:20px">${cm.lvlMax.toFixed(2)}</div></div>
        </div>
        <div class="hint">Type exact values — no vague sliders. Players outside the range won't see the match.</div>
      </div>
      <div class="field"><label>Gender preference</label>
        <div class="optgrid three">${["Men","Women","No pref"].map(g=>`<button class="opt ${(cm.gender.startsWith(g)||(g==="No pref"&&cm.gender==="No preference"))?"on":""}" onclick="cmSet('gender','${g}')">${g}</button>`).join("")}</div>
      </div>
      <div class="field"><label>Preferred side to fill</label>
        <div class="optgrid three">${["Left","Right","Any"].map(s=>`<button class="opt ${cm.side===s?"on":""}" onclick="cmSet('side','${s}')">${s}</button>`).join("")}</div>
      </div>
      <div class="field"><label>Match notes</label>
        <textarea class="input" placeholder="e.g. Fast-paced, winners stay on. Bring a spare racket.">Fast-paced, want a solid 4th. Winners stay on.</textarea>
      </div>
      <div class="field"><label>Visibility & joining</label>
        <div class="lrow"><div class="ic"><i data-lucide="globe"></i></div><div class="grow"><div class="t">Public match</div><div class="s">Anyone in range can find it</div></div><div class="swtch on" onclick="this.classList.toggle('on')"></div></div>
        <div class="lrow"><div class="ic"><i data-lucide="user-check"></i></div><div class="grow"><div class="t">Approve each request</div><div class="s">You confirm who joins</div></div><div class="swtch" onclick="this.classList.toggle('on')"></div></div>
      </div>
      <div class="finebox" style="background:rgba(201,242,77,0.08);border-color:rgba(201,242,77,0.2)">
        <div class="fr"><i data-lucide="shield-check"></i><span style="color:var(--text)"><b>Automatic protection.</b> If 4 players haven't joined by the deadline, the match cancels and no one is charged.</span></div>
      </div>
      <div class="card mt16">
        <div class="between"><span class="muted f13">Fill deadline</span><span class="fw7 f13">Today 5:30 PM</span></div>
        <div class="between mt8"><span class="muted f13">Amount authorised now</span><span class="fw7 f13">${money(22.5)} (hold)</span></div>
        <div class="between mt8"><span class="muted f13">Charged if it fills</span><span class="fw7 f13">${money(22.5)}</span></div>
        <div class="between mt8"><span class="muted f13">Charged if it doesn't</span><span class="fw7 f13" style="color:var(--green)">${money(0)}</span></div>
      </div>
    </div>
    <div style="position:sticky;bottom:0;padding:14px 18px;background:linear-gradient(transparent,var(--bg) 30%)">
      <button class="btn primary" onclick="toast('Match created — finding players','check-circle');setTimeout(()=>go('matchDetail',{id:'m_1'}),700)">Create match</button>
    </div>
  </div>`;
function cmSet(k,v){ cm[k]= v==="No pref"?"No preference":v; rerender(); }

/* ---------------- PLAYER PROFILE ---------------- */
screens.playerProfile = ({id}) => {
  const p=player(id);
  return `
  <div class="scroll nonav">
    ${topbar("",{solid:false, actions:`<button class="iconbtn ghost" onclick="openSheet('Safety options', safetyOptsBody('${p.name}'))"><i data-lucide="ellipsis"></i></button>`})}
    <div class="pad center">
      <div style="display:flex;justify-content:center">${avatar(p,"xl")}</div>
      <div class="row gap6 mt12" style="justify-content:center"><h2 class="tl" style="margin:0">${p.name}</h2>${p.reliability>=95?'<i data-lucide="badge-check" style="color:var(--blue);width:20px"></i>':""}</div>
      <div class="muted">${p.suburb} · ${p.style} player</div>
      <div class="chiprow mt12" style="justify-content:center">${chip("Level "+p.level.toFixed(2),"lime")}${chip(p.rel,"green","shield-check")}${chip(p.side+" side")}</div>
      <div class="btnrow mt16">
        <button class="btn primary" onclick="toast('Invited to play','swords')"><i data-lucide="swords"></i> Invite to play</button>
        <button class="btn line wauto" style="width:52px" onclick="go('messages')"><i data-lucide="message-circle"></i></button>
      </div>
    </div>
    <div class="pad">
      <div class="row gap8 mt8">
        <div class="stat" style="flex:1"><div class="num">${p.matches}</div><div class="lab">Matches</div></div>
        <div class="stat" style="flex:1"><div class="num">${p.reliability}%</div><div class="lab">Reliability</div></div>
        <div class="stat" style="flex:1"><div class="num">${p.sport.toFixed(1)}</div><div class="lab">Sportsmanship</div></div>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Recent results</h3></div>
      ${RESULTS.slice(0,2).map(resultRow).join("")}
      <div class="sectiontitle" style="margin-left:0"><h3>Achievements</h3></div>
      <div class="chiprow">${chip("50+ matches","amber","medal")}${chip("Ladder top 3","violet","trophy")}${chip("Perfect month","green","calendar-check")}</div>
      <div class="sectiontitle" style="margin-left:0"><h3>Player reviews</h3></div>
      <div class="finebox"><div class="fr"><i data-lucide="quote"></i>“Great partner — always on time and super positive.” — ${player("p_zara").name}</div></div>
      <div class="sectiontitle" style="margin-left:0"><h3>Mutual connections</h3></div>
      <div class="row gap8"><div class="avstack">${PLAYERS.slice(0,4).map(x=>avatar(x,"s")).join("")}</div><span class="muted f13">${p.mutual} mutual players</span></div>
      <div style="height:24px"></div>
    </div>
  </div>`;
};
function safetyOptsBody(name){
  return `${["Block "+name,"Report "+name,"Hide my profile from them","Control who can message me","Control who can invite me"].map((t,i)=>`<div class="lrow" onclick="closeSheet();toast('${t.startsWith('Block')||t.startsWith('Report')?t+' — safety team notified':'Preference saved'}','${t.startsWith('Report')?'flag':'shield'}')"><div class="ic"><i data-lucide="${["ban","flag","eye-off","message-square","user-plus"][i]}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
  <div class="finebox mt12"><div class="fr"><i data-lucide="shield-alert"></i>Serious reports reach a real safety team, usually within 24 hours.</div></div>`;
}

/* ---------------- LEVEL CENTRE ---------------- */
screens.levelCentre = () => `
  <div class="scroll">
    ${topbar("Your level",{solid:true})}
    <div class="pad">
      <div class="hero" style="background:linear-gradient(135deg,#1a2e12,#0f1a0c)">
        <div class="between"><div><div class="muted f13">Current level</div><div style="font-size:48px;font-weight:800;letter-spacing:-.03em;line-height:1">${ME.level.toFixed(2)}</div></div>
        <div class="center">${chip("Medium confidence","lime","gauge")}<div class="chip green mt8"><i data-lucide="trending-up"></i> +0.06 this month</div></div></div>
      </div>
      <div class="grid2 mt16">
        <div class="stat"><div class="lab">Games included</div><div class="fw7 mt4 f15">18 matches</div></div>
        <div class="stat"><div class="lab">Awaiting confirmation</div><div class="fw7 mt4 f15">1 result</div></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Last result breakdown</h3></div>
      <div class="card">
        <div class="rbreak"><span class="muted">Match result (win)</span><span class="v plus">+0.04</span></div>
        <div class="rbreak"><span class="muted">Opponent strength</span><span class="v plus">+0.02</span></div>
        <div class="rbreak"><span class="muted">Competitive format</span><span class="v plus">+0.01</span></div>
        <div class="rbreak"><span class="muted">Confidence adjustment</span><span class="v minus">-0.01</span></div>
        <div class="rbreak" style="border-top:1px solid var(--line2);margin-top:6px;padding-top:12px"><span class="fw8">New level</span><span class="fw8 f17" style="color:var(--lime)">3.31</span></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>How your level is calculated</h3></div>
      <div class="finebox">
        <div class="fr"><i data-lucide="check"></i>Every match nudges your level up or down — wins against stronger players count more.</div>
        <div class="fr"><i data-lucide="check"></i>Formal competitions and tournaments carry extra weight.</div>
        <div class="fr"><i data-lucide="check"></i>Confidence grows as you play more, so early results move you further.</div>
        <div class="fr"><i data-lucide="check"></i>No hidden black box — every change is itemised like above.</div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Take control</h3></div>
      <div class="card tight">
        ${[["Edit starting assessment","sliders-horizontal"],["Request a level review","message-circle-question"],["Add competition history","trophy"],["Flag an incorrect result","flag"]].map(([t,i])=>`<div class="lrow" onclick="toast('${t} — opened','${i}')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>
      <div style="height:20px"></div>
    </div>
  </div>`;

/* ---------------- RESULTS / SCORE ENTRY ---------------- */
screens.results = () => `
  <div class="scroll">
    ${topbar("Match results",{solid:true, actions:`<button class="iconbtn" onclick="openSheet('Enter a score', enterScoreBody(), enterScoreFoot())"><i data-lucide="plus"></i></button>`})}
    <div class="pad">
      <div class="card" style="border-color:rgba(245,178,62,0.3)">
        <div class="between mb12"><div class="fw7">Confirm this result</div>${statusBadge("Awaiting confirmation")}</div>
        <div class="center"><div class="muted f13">${club("c_innerwest").name} · Sun 13 Jul</div>
          <div class="row gap8 mt12" style="justify-content:center">${avatar(ME,"m")}${avatar(player("p_lucas"),"m")}</div>
          <div class="fw8 f24 mt12 tl">7-5 · 6-2</div>
          <div class="muted f13">You & Lucas won</div>
        </div>
        <div class="btnrow mt16">
          <button class="btn line" onclick="openSheet('Reject result', rejectBody())">Reject</button>
          <button class="btn primary" onclick="toast('Result confirmed — level updated','check-circle');rerender()">Approve</button>
        </div>
        <div class="finebox mt12"><div class="fr"><i data-lucide="info"></i>You can approve, reject, request a correction, add evidence or ask for human review. Nothing locks without a path to fix it.</div></div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>History</h3></div>
      ${RESULTS.filter(r=>r.status==="Confirmed").map(r=>{const cl=club(r.clubId);return `
        <div class="card tight mb12">
          <div class="between"><div><div class="fw7">${r.win?"Win":"Loss"} · ${r.score}</div><div class="muted f13">${cl.name} · ${r.date}</div></div>
          <div class="center">${statusBadge("Confirmed")}<div class="f12 ${r.win?"":""} mt4" style="color:${r.win?"var(--green)":"var(--red)"}">${r.delta}</div></div></div>
        </div>`;}).join("")}
    </div>
  </div>`;
function enterScoreBody(){ return `<div class="field"><label>Your team</label><div class="row gap8">${avatar(ME,"s")}${avatar(player("p_sarah"),"s")}<span class="muted f13">You & Sarah</span></div></div>
  <div class="field"><label>Set scores</label><div class="optgrid three"><input class="input center" value="6"><input class="input center" value="3"><input class="input center" value=""></div><div class="hint">You enter it once — everyone else gets a confirmation request.</div></div>`; }
function enterScoreFoot(){ return `<button class="btn primary" onclick="closeSheet();toast('Sent to players for confirmation','send')">Submit result</button>`; }
function rejectBody(){ return `<div class="field"><label>Why are you rejecting?</label><textarea class="input" placeholder="e.g. Score was 6-4 in the second, not 6-2."></textarea></div>
  <div class="lrow"><div class="ic"><i data-lucide="upload"></i></div><div class="grow"><div class="t">Add evidence (optional)</div><div class="s">Photo of the scoreboard</div></div></div>
  <button class="btn line mt12" onclick="closeSheet();toast('Correction requested','message-circle')">Request correction</button>
  <button class="btn mt10" style="background:transparent;color:var(--blue)" onclick="closeSheet();toast('Sent for human review','user-round')">Ask for human review</button>`; }

/* ---------------- BOOKINGS + WALLET ---------------- */
screens.bookings = () => {
  const tabs=[["upcoming","Upcoming"],["awaiting","Awaiting"],["completed","Completed"],["cancelled","Cancelled"],["refunds","Refunds"]];
  const cur = state.bkTab||"upcoming";
  const list = BOOKINGS.filter(b=>b.tab===cur);
  return `
  <div class="scroll">
    ${topbar("Bookings & wallet",{solid:true, actions:`<button class="iconbtn" onclick="go('wallet')"><i data-lucide="wallet"></i></button>`})}
    <div class="seg scrollx" style="margin-bottom:4px">${tabs.map(([k,l])=>`<button class="${k===cur?"on":""}" onclick="state.bkTab='${k}';rerender()">${l}</button>`).join("")}</div>
    <div class="pad mt16 stagger">
      ${list.length? list.map(bookingCard).join("") : emptyState("calendar","No "+cur+" bookings","When you book a court it'll show up here.")}
    </div>
  </div>`;
};
function bookingCard(b){
  const c=club(b.clubId);
  return `<div class="card mb12">
    <div class="between mb12"><div class="fw7">${c.name}</div>${statusBadge(b.status)}</div>
    <div class="row"><div class="imgwrap" style="width:52px;height:52px;border-radius:12px">${courtImg(c.img,c.name).replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>
      <div class="grow"><div class="muted f13">${b.court} · ${b.date}</div><div class="muted f13">${b.time}</div>
      <div class="row gap6 mt8"><div class="avstack">${b.players.map(p=>avatar(player(p),"s")).join("")}</div><span class="dim f12">${b.id}</span></div></div></div>
    <div class="between mt12" style="border-top:1px solid var(--line);padding-top:12px">
      <div><div class="dim f11">${b.paid>0?"Paid":b.authorised?"Authorised (hold)":b.refundAmt?"Refund":"Amount"}</div><div class="fw7">${money(b.paid||b.authorised||b.refundAmt||0)}</div></div>
      <div class="chiprow">
        ${b.tab==="upcoming"?`<button class="btn line sm" onclick="go('cancellation',{id:'${b.id}'})">Cancel</button>`:""}
        ${b.tab==="refunds"?`<button class="btn line sm" onclick="go('refundTracker')">Track</button>`:""}
        <button class="btn primary sm" onclick="go('clubDetail',{id:'${c.id}'})">View</button>
      </div>
    </div>
    ${b.matchFill?`<div class="finebox mt12"><div class="fr"><i data-lucide="shield-check"></i>Match filling: ${b.matchFill.have}/${b.matchFill.need}. Auto-cancels & releases your hold if unfilled by ${b.matchFill.deadline}.</div></div>`:""}
  </div>`;
}
function emptyState(ic,h,p){ return `<div class="empty"><div class="eic"><i data-lucide="${ic}"></i></div><h3>${h}</h3><p>${p}</p><button class="btn primary wauto" style="margin:0 auto" onclick="tab('clubs')">Find a court</button></div>`; }

/* ---------------- WALLET ---------------- */
screens.wallet = () => `
  <div class="scroll">
    ${topbar("Wallet",{solid:true})}
    <div class="pad">
      <div class="card" style="background:linear-gradient(135deg,#1a2e12,#0f1a0c);border-color:rgba(201,242,77,0.25)">
        <div class="between"><span class="muted f13">Padel One credit</span><i data-lucide="wallet" style="color:var(--lime)"></i></div>
        <div style="font-size:36px;font-weight:800;letter-spacing:-.02em">$15.00</div>
        <div class="muted f13">From a match that didn't fill · auto-refunded</div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Payment methods</h3></div>
      <div class="card tight">
        <div class="lrow"><div class="ic"><i data-lucide="credit-card"></i></div><div class="grow"><div class="t">Visa •• 4291</div><div class="s">Saved · expires 08/27</div></div>${chip("Default","lime")}</div>
        <div class="lrow"><div class="ic"><i data-lucide="plus"></i></div><div class="grow"><div class="t">Add payment method</div></div><i data-lucide="chevron-right" class="chev"></i></div>
      </div>
      <div class="finebox mt12"><div class="fr"><i data-lucide="shield-check"></i>Your card is saved securely — we never ask for it again at checkout.</div></div>

      <div class="sectiontitle" style="margin-left:0"><h3>Transactions</h3></div>
      <div class="card tight">
        ${[["Sydney Padel Centre","Wed 29 Jul","-$22.50","Paid"],["Refund · Inner West","Sun 13 Jul","+$21.00","Refund processing"],["Bankstown Padel Club","Sat 19 Jul","-$20.00","Paid"],["Auth hold · Harbour","Sat 26 Jul","$28.00 hold","Payment authorised"]].map(([t,d,a,s])=>`<div class="lrow"><div class="ic"><i data-lucide="${a.startsWith("+")?"arrow-down-left":a.includes("hold")?"lock":"arrow-up-right"}"></i></div><div class="grow"><div class="t">${t}</div><div class="s">${d}</div></div><div class="center"><div class="fw7 f14" style="color:${a.startsWith("+")?"var(--green)":"var(--text)"}">${a}</div></div></div>`).join("")}
      </div>

      <div class="btnrow mt16" style="padding-bottom:20px">
        <button class="btn line" onclick="toast('Receipt downloaded','download')"><i data-lucide="download"></i> Receipts</button>
        <button class="btn line" onclick="go('support')"><i data-lucide="triangle-alert"></i> Payment problem</button>
      </div>
    </div>
  </div>`;

/* ---------------- CANCELLATION ---------------- */
screens.cancellation = ({id}) => {
  const b=BOOKINGS.find(x=>x.id===id)||BOOKINGS[0]; const c=club(b.clubId);
  return `
  <div class="scroll nonav">
    ${topbar("Cancel booking",{})}
    <div class="pad">
      <div class="card"><div class="fw7">${c.name}</div><div class="muted f13">${b.court} · ${b.date} · ${b.time}</div></div>
      <div class="sectiontitle" style="margin-left:0"><h3>Before you cancel</h3></div>
      <div class="card">
        <div class="between"><span class="muted f14">You paid</span><span class="fw7">${money(b.paid||b.total)}</span></div>
        <div class="between mt10"><span class="muted f14">Cancellation fee</span><span class="fw7" style="color:var(--green)">$0.00</span></div>
        <div class="between mt10" style="border-top:1px solid var(--line2);padding-top:12px"><span class="fw8">Refund amount</span><span class="fw8 f17" style="color:var(--green)">${money(b.paid||b.total)}</span></div>
      </div>
      <div class="finebox mt12">
        <div class="fr"><i data-lucide="calendar-check"></i>You're inside the free window (until ${b.cancelBy})</div>
        <div class="fr"><i data-lucide="clock"></i>Funds return to Visa •• 4291 in 3–5 business days</div>
        <div class="fr"><i data-lucide="user-round"></i>Questions? ${c.phone} or Padel One support</div>
      </div>
      <button class="btn primary mt16" onclick="toast('Booking cancelled — refund started','check-circle');setTimeout(()=>go('refundTracker'),700)">Cancel & refund ${money(b.paid||b.total)}</button>
      <button class="btn mt10" style="background:transparent" onclick="back()">Keep my booking</button>
    </div>
  </div>`;
};

/* ---------------- REFUND TRACKER ---------------- */
screens.refundTracker = () => `
  <div class="scroll">
    ${topbar("Refund tracker",{solid:true})}
    <div class="pad">
      <div class="card center"><div class="dim f13">Refund amount</div><div style="font-size:34px;font-weight:800">$21.00</div><div class="muted f13">to Visa •• 4291</div></div>
      <div class="card mt16">
        ${[["Cancellation submitted","Today, 6:12 PM","done"],["Club confirmed","Today, 6:14 PM","done"],["Refund processed","In progress","active"],["Funds in your account","Expected by 16 Jul","wait"]].map(([t,s,st])=>`
          <div class="tl-item ${st==="done"?"done":st==="active"?"active":""}">
            <div class="dotcol"><div class="dt">${st==="done"?'<i data-lucide="check"></i>':""}</div><div class="line"></div></div>
            <div class="content"><div class="t">${t}</div><div class="s">${s}</div></div>
          </div>`).join("")}
      </div>
      <div class="finebox mt12"><div class="fr"><i data-lucide="user-round"></i>Something wrong? <span style="color:var(--lime)">Contact support</span> and a person will help.</div></div>
    </div>
  </div>`;

/* ---------------- SUPPORT ---------------- */
screens.support = () => `
  <div class="scroll">
    ${topbar("Help & support",{solid:true})}
    <div class="pad">
      <div class="card" style="border-color:rgba(201,242,77,0.3)">
        <div class="row"><div class="ic" style="width:44px;height:44px;background:rgba(201,242,77,0.14);border:none;border-radius:14px;display:grid;place-items:center"><i data-lucide="headset" style="color:var(--lime)"></i></div>
          <div class="grow"><div class="fw7">Talk to a real person</div><div class="muted f13">Avg wait ~3 min · 7am–11pm AEST</div></div></div>
        <button class="btn primary mt12" onclick="go('supportChat')"><i data-lucide="message-circle"></i> Start live chat</button>
        <div class="btnrow mt10">
          <button class="btn line" onclick="toast('Callback requested — ~5 min','phone')"><i data-lucide="phone-call"></i> Request call</button>
          <button class="btn line" onclick="toast('Email drafted','mail')"><i data-lucide="mail"></i> Email us</button>
        </div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>What do you need help with?</h3></div>
      <div class="card tight">
        ${[["Booking problem","calendar-x"],["Payment emergency","triangle-alert"],["Result dispute","gavel"],["Club support","building-2"],["Safety issue","shield-alert"]].map(([t,i])=>`<div class="lrow" onclick="go('supportChat')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>FAQs</h3></div>
      <div class="card tight">${FAQS.map((f,i)=>`<div class="lrow" onclick="openSheet('${f.q.replace(/'/g,"")}','<p class=\\'muted\\' style=\\'line-height:1.6\\'>${f.a.replace(/'/g,"")}</p>')"><div class="grow"><div class="t f14">${f.q}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}</div>
      <div style="height:20px"></div>
    </div>
  </div>`;

/* ---------------- SUPPORT CHAT ---------------- */
let chatLog = [
  {who:"bot", text:"Hi Aiman 👋 I'm the Padel One assistant. What can I help with? You can also tap ‘Speak to a person’ any time."},
];
screens.supportChat = () => `
  <div class="screen-flex" style="display:flex;flex-direction:column;height:100%">
    ${topbar("Support",{solid:true, actions:`<span class="chip green" style="align-self:center"><i data-lucide="circle" style="fill:currentColor"></i> Online</span>`})}
    <div class="finebox" style="margin:0 18px;border-radius:14px">
      <div class="between"><span class="f12 muted">Ticket <b style="color:var(--text)">#PS-40921</b></span><span class="f12 muted">Agent: <b style="color:var(--text)">Priya</b></span></div>
    </div>
    <div class="scroll" id="chatScroll" style="padding-bottom:0">
      <div class="chatwrap" id="chatWrap">
        ${chatLog.map(m=>`<div class="msg ${m.who==="me"?"me":"them"}">${m.who==="bot"?'<div class="who">Assistant</div>':m.who==="agent"?'<div class="who">Priya · Support</div>':""}${m.text}</div>`).join("")}
      </div>
    </div>
    <div class="pad" style="padding-bottom:8px"><button class="btn line" onclick="talkToPerson()"><i data-lucide="user-round"></i> Speak to a person</button></div>
    <div class="chatinput">
      <input id="chatIn" placeholder="Type a message…" onkeydown="if(event.key==='Enter')sendChat()">
      <button class="send" onclick="sendChat()"><i data-lucide="arrow-up"></i></button>
    </div>
  </div>`;
screens.after_supportChat = () => { const s=$("#chatScroll"); if(s) s.scrollTop=s.scrollHeight; };
function pushChat(who,text){ chatLog.push({who,text}); const w=$("#chatWrap"); if(w){ w.insertAdjacentHTML("beforeend",`<div class="msg ${who==="me"?"me":"them"}">${who==="bot"?'<div class="who">Assistant</div>':who==="agent"?'<div class="who">Priya · Support</div>':""}${text}</div>`); icons(); const s=$("#chatScroll"); s.scrollTop=s.scrollHeight; } }
function sendChat(){ const inp=$("#chatIn"); const v=inp.value.trim(); if(!v) return; pushChat("me",v); inp.value="";
  setTimeout(()=>{ const l=v.toLowerCase(); let r="Got it — I can help with that. Want me to pull up your latest booking, or connect you to a person?";
    if(l.includes("refund")) r="Your $21.00 refund is processing and should land by 16 Jul. Want me to escalate it to a human?";
    else if(l.includes("cancel")) r="You can cancel free until the deadline — I can start that for you, or hand you to a person.";
    pushChat("bot",r); },700);
}
function talkToPerson(){ pushChat("agent","Hi Aiman, Priya here 🙌 I've got your full chat above. Give me one sec to look into this for you."); toast("Connected to Priya · human support","user-round"); }

/* ---------------- COMMUNITY ---------------- */
screens.community = () => `
  <div class="scroll">
    <div class="topbar"><h2>Community</h2>
      <button class="iconbtn" onclick="go('friends')"><i data-lucide="user-round-plus"></i></button>
      <button class="iconbtn" onclick="go('messages')"><i data-lucide="message-circle"></i></button>
    </div>
    <div class="chiprow scrollx pad" style="padding-top:4px">${["For you","Near you","Looking for players","Clubs","Coaching tips"].map((t,i)=>`<button class="opt ${i===0?"on":""}" style="padding:8px 14px" onclick="segTap(this)">${t}</button>`).join("")}</div>
    <div class="pad stagger mt12">${COMMUNITY.map(postCard).join("")}</div>
  </div>`;
function postCard(p){
  const a=player(p.author);
  return `<div class="card mb12">
    <div class="between mb12"><div class="row gap8">${avatar(a,"m")}<div><div class="fw7 f14">${a.name}</div><div class="dim f12">${p.time} · ${a.suburb}</div></div></div>
    <button class="iconbtn ghost" onclick="openSheet('Post options', postOptsBody())"><i data-lucide="ellipsis"></i></button></div>
    <div class="chip ${p.tag==='Looking for player'?'lime':p.tag==='Coaching tip'?'blue':''} mb12">${p.tag}</div>
    <div class="f14" style="line-height:1.5">${p.text}</div>
    ${p.img?`<div class="imgwrap mt12" style="height:190px;border-radius:16px">${courtImg(p.img,"post").replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div>`:""}
    <div class="between mt12" style="border-top:1px solid var(--line);padding-top:12px">
      <div class="row gap10">
        <button class="row gap6 muted f13" onclick="this.querySelector('i').style.color='var(--red)';this.querySelector('i').setAttribute('fill','currentColor')"><i data-lucide="heart" style="width:18px"></i> ${p.likes}</button>
        <span class="row gap6 muted f13"><i data-lucide="message-circle" style="width:18px"></i> ${p.comments}</span>
        <button class="muted" onclick="toast('Shared','share-2')"><i data-lucide="share-2" style="width:18px"></i></button>
      </div>
      ${p.tag==="Looking for player"?`<button class="btn primary sm" onclick="go('matchDetail',{id:'m_1'})">Join</button>`:`<button class="btn line sm" onclick="go('playerProfile',{id:'${p.author}'})">Follow</button>`}
    </div>
  </div>`;
}
function postOptsBody(){ return `${[["Follow","user-plus"],["Invite to play","swords"],["Mute","volume-x"],["Report","flag"]].map(([t,i])=>`<div class="lrow" onclick="closeSheet();toast('${t}${t==='Report'?' — sent to team':''}','${i}')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div></div>`).join("")}`; }

/* ---------------- FRIENDS & GROUPS ---------------- */
screens.friends = () => `
  <div class="scroll">
    ${topbar("Friends & groups",{solid:true, actions:`<button class="iconbtn" onclick="toast('Invite link copied','copy')"><i data-lucide="user-round-plus"></i></button>`})}
    <div class="pad">
      <div class="sectiontitle" style="margin-left:0"><h3>Your groups</h3></div>
      ${GROUPS.map(g=>{const c=club(g.clubId);return `<div class="card mb12" onclick="go('groupDetail',{id:'${g.id}'})" style="cursor:pointer">
        <div class="between"><div class="fw7 f15">${g.name}</div><div class="avstack">${g.memberIds.slice(0,4).map(m=>avatar(player(m),"s")).join("")}</div></div>
        <div class="muted f13 mt8">${g.members} members · next: ${g.next}</div>
        <div class="chiprow mt10">${chip(g.poll,"lime","calendar-check")}${chip(g.split, g.split==="Fully paid"?"green":"amber","credit-card")}</div>
      </div>`;}).join("")}
      <div class="sectiontitle" style="margin-left:0"><h3>Favourite teammates</h3></div>
      ${PLAYERS.slice(0,3).map(p=>`<div class="lrow" onclick="go('playerProfile',{id:'${p.id}'})"><div style="width:46px">${avatar(p,"m")}</div><div class="grow"><div class="t">${p.name}</div><div class="s">${p.rel} · lvl ${p.level.toFixed(2)}</div></div><button class="btn primary sm" onclick="event.stopPropagation();toast('Invited','swords')">Invite</button></div>`).join("")}
      <div class="sectiontitle" style="margin-left:0"><h3>Suggested players near you</h3></div>
      ${PLAYERS.slice(4,7).map(p=>`<div class="lrow"><div style="width:46px">${avatar(p,"m")}</div><div class="grow"><div class="t">${p.name}</div><div class="s">${p.suburb} · ${p.mutual} mutual</div></div><button class="btn line sm" onclick="toast('Friend request sent','user-plus')">Add</button></div>`).join("")}
      <div style="height:20px"></div>
    </div>
  </div>`;
screens.groupDetail = ({id}) => {
  const g=GROUPS.find(x=>x.id===id)||GROUPS[0]; const c=club(g.clubId);
  return `
  <div class="scroll nonav">
    ${topbar(g.name,{solid:true})}
    <div class="pad">
      <div class="card"><div class="between"><div class="fw7">${g.members} members</div><div class="avstack">${g.memberIds.map(m=>avatar(player(m),"s")).join("")}</div></div></div>
      <div class="sectiontitle" style="margin-left:0"><h3>This week's availability</h3></div>
      <div class="card">${[["Wed 7:30 PM","6/8 available",true],["Fri 6:00 PM","3/8 available",false]].map(([d,s,on])=>`<div class="lrow"><div class="ic"><i data-lucide="calendar"></i></div><div class="grow"><div class="t">${d}</div><div class="s">${s}</div></div><div class="swtch ${on?"on":""}" onclick="this.classList.toggle('on')"></div></div>`).join("")}</div>
      <div class="sectiontitle" style="margin-left:0"><h3>Next court booking</h3></div>
      <div class="card"><div class="between"><div><div class="fw7">${c.name}</div><div class="muted f13">${g.next}</div></div>${statusBadge("Confirmed")}</div>
        <div class="finebox mt12"><div class="fr"><i data-lucide="credit-card"></i>Split payment: ${g.split}</div></div>
        <button class="btn primary mt12" onclick="toast('Your share paid · $22.50','check')">Pay my share · $22.50</button>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Group chat</h3></div>
      <div class="card tight"><div class="row gap8">${avatar(player(g.memberIds[1]),"s")}<div class="grow"><div class="fw6 f13">${player(g.memberIds[1]).name.split(" ")[0]}</div><div class="muted f13">Who's in for Wednesday? 🎾</div></div></div></div>
      <div style="height:20px"></div>
    </div>
  </div>`;
};

/* ---------------- COMPETE (leagues & tournaments) ---------------- */
screens.compete = () => `
  <div class="scroll">
    ${topbar("Compete",{solid:true})}
    <div class="seg" style="margin-bottom:4px"><button class="on" onclick="segTap(this)">All</button><button onclick="segTap(this)">Ladders</button><button onclick="segTap(this)">Tournaments</button><button onclick="segTap(this)">Americano</button></div>
    <div class="pad mt16 stagger">
      ${TOURNAMENTS.map(t=>{const c=club(t.clubId);return `
        <div class="card mb12" onclick="go('tournamentDetail',{id:'${t.id}'})" style="cursor:pointer">
          <div class="between mb8">${chip(t.format,"violet","trophy")}${chip(t.spots+" spots left","lime")}</div>
          <div class="fw7 f17 tl">${t.name}</div>
          <div class="muted f13">${c.name} · ${t.date}</div>
          <div class="between mt12" style="border-top:1px solid var(--line);padding-top:12px">
            <div><div class="dim f11">Entry</div><div class="fw7">${money(t.fee)}</div></div>
            <div><div class="dim f11">Level</div><div class="fw7 f14">${t.level}</div></div>
            <div><div class="dim f11">Prizes</div><div class="fw7 f14">${t.prizes.split(" ").slice(0,2).join(" ")}</div></div>
          </div>
        </div>`;}).join("")}
    </div>
  </div>`;
screens.tournamentDetail = ({id}) => {
  const t=tournament(id), c=club(t.clubId);
  return `
  <div class="scroll nonav">
    <div style="position:relative;height:180px">${courtImg(c.img,c.name)}<div style="position:absolute;inset:0;background:linear-gradient(transparent 30%,var(--bg))"></div>
      <button class="backbtn" onclick="back()" style="position:absolute;top:14px;left:18px;background:rgba(0,0,0,.4);color:#fff;border:none"><i data-lucide="chevron-left"></i></button></div>
    <div class="pad" style="margin-top:-30px;position:relative">
      <div class="chiprow mb8">${chip(t.format,"violet","trophy")}${chip(t.eligibility)}</div>
      <h2 class="tl" style="margin:0">${t.name}</h2>
      <div class="muted mt4">${c.name} · ${t.date}</div>
      <div class="grid2 mt16">
        <div class="stat"><div class="lab">Entry fee</div><div class="fw7 mt4">${money(t.fee)}</div></div>
        <div class="stat"><div class="lab">Spots left</div><div class="fw7 mt4">${t.spots} of ${t.total}</div></div>
        <div class="stat"><div class="lab">Level</div><div class="fw7 mt4 f14">${t.level}</div></div>
        <div class="stat"><div class="lab">Prizes</div><div class="fw7 mt4 f14">${t.prizes}</div></div>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Standings</h3></div>
      <div class="card tight">${STANDINGS.map(s=>{const p=player(s.id);return `<div class="lrow"><div style="width:24px" class="fw8 ${s.id===ME.id?"":"dim"}">${s.pos}</div><div style="width:34px">${avatar(p,"s")}</div><div class="grow"><div class="t f14">${p.name}${s.id===ME.id?" (you)":""}</div></div><div class="fw7">${s.pts} pts</div></div>`;}).join("")}</div>
      <div class="finebox mt12"><div class="fr"><i data-lucide="trophy"></i>Results from this event count toward your official level.</div></div>
      <button class="btn primary mt16 mb20" onclick="toast('Entered — see you on court!','check-circle')">Enter · ${money(t.fee)}</button>
    </div>
  </div>`;
};

/* ---------------- COACHING ---------------- */
screens.coaching = () => `
  <div class="scroll">
    ${topbar("Coaching",{solid:true})}
    <div class="chiprow scrollx pad" style="padding-top:4px">${["All","Private","Group","Junior","Match analysis","Beginner"].map((t,i)=>`<button class="opt ${i===0?"on":""}" style="padding:8px 14px" onclick="segTap(this)">${t}</button>`).join("")}</div>
    <div class="pad stagger mt12">${COACHES.map(coachCard).join("")}</div>
  </div>`;
function coachCard(co){
  return `<div class="card mb12" onclick="go('coachDetail',{id:'${co.id}'})" style="cursor:pointer">
    <div class="row">${avatar(co,"l")}
      <div class="grow"><div class="between"><div class="fw7 f15">${co.name}</div>${co.intro?chip("Video","blue","play"):""}</div>
      <div class="muted f13">${co.rating} ★ (${co.reviews}) · ${co.suburb}</div>
      <div class="chiprow mt8">${co.specialties.slice(0,2).map(s=>chip(s)).join("")}</div></div></div>
    <div class="between mt12" style="border-top:1px solid var(--line);padding-top:12px"><span class="muted f13">${co.langs.join(", ")}</span><span class="fw8">${money(co.price)}<span class="muted f12 fw6">/hr</span></span></div>
  </div>`;
}
screens.coachDetail = ({id}) => {
  const co=coach(id);
  return `
  <div class="scroll nonav">
    ${topbar("",{actions:""})}
    <div class="pad center">
      <div style="display:flex;justify-content:center">${avatar(co,"xl")}</div>
      <h2 class="tl mt12" style="margin-bottom:2px">${co.name}</h2>
      <div class="muted">${co.rating} ★ (${co.reviews} reviews) · ${co.suburb}</div>
      <div class="chiprow mt12" style="justify-content:center">${co.quals.map(q=>chip(q,"lime","award")).join("")}</div>
    </div>
    <div class="pad">
      ${co.intro?`<div class="imgwrap mb16" style="height:170px;border-radius:18px;position:relative">${courtImg(IMG.court3,"intro").replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}<div style="position:absolute;inset:0;display:grid;place-items:center"><div class="iconbtn" style="width:56px;height:56px;background:rgba(0,0,0,.5);color:#fff;border-radius:50%"><i data-lucide="play" style="width:24px"></i></div></div></div>`:""}
      <div class="finebox"><div class="fr"><i data-lucide="quote"></i>${co.bio}</div></div>
      <div class="sectiontitle" style="margin-left:0"><h3>Session types</h3></div>
      <div class="card tight">
        ${[["Private lesson (1:1)",co.price],["Group lesson (2–4)",Math.round(co.price*0.5)],["Junior coaching",Math.round(co.price*0.7)],["Match analysis",Math.round(co.price*1.1)]].map(([t,pr])=>`<div class="lrow"><div class="grow"><div class="t f14">${t}</div></div><div class="fw7">${money(pr)}</div></div>`).join("")}
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Available times</h3></div>
      <div class="chiprow scrollx">${["Tue 5PM","Wed 6PM","Thu 7PM","Sat 9AM","Sun 10AM"].map((t,i)=>`<button class="opt ${i===1?"on":""}" style="min-width:80px;padding:10px">${t}</button>`).join("")}</div>
      <div class="sectiontitle" style="margin-left:0"><h3>Languages</h3></div>
      <div class="chiprow">${co.langs.map(l=>chip(l,"","languages")).join("")}</div>
      <button class="btn primary mt16 mb20" onclick="toast('Lesson request sent to '+'${co.name.split(" ")[0]}','check-circle')">Book a lesson · ${money(co.price)}</button>
    </div>
  </div>`;
};

/* ---------------- NOTIFICATIONS ---------------- */
screens.notifications = () => `
  <div class="scroll">
    ${topbar("Notifications",{solid:true, actions:`<button class="iconbtn ghost" onclick="openSheet('Notification settings', notifSettingsBody())"><i data-lucide="settings-2"></i></button>`})}
    <div class="pad">
      <div class="between mb8"><span class="dim f12 fw6">TODAY</span><span class="link f13" onclick="toast('All marked read','check')">Mark all read</span></div>
      ${NOTIFS.map(n=>`<div class="notif ${n.unread?"unread":""}">
        <div class="nic chip ${n.color}" style="width:42px;height:42px"><i data-lucide="${n.icon}"></i></div>
        <div class="nb"><div class="dim f11 fw6" style="text-transform:uppercase;letter-spacing:.03em">${n.cat}</div><div class="t mt4">${n.t}</div><div class="tm">${n.tm}</div></div>
      </div>`).join("")}
    </div>
  </div>`;
function notifSettingsBody(){ return `${["Match invitations","Booking updates","Match nearly full","Cancellation deadlines","Payments & refunds","Result confirmations","Club announcements","Friend activity"].map((t,i)=>`<div class="lrow"><div class="grow"><div class="t f14">${t}</div></div><div class="swtch ${i<6?"on":""}" onclick="this.classList.toggle('on')"></div></div>`).join("")}<div class="finebox mt12"><div class="fr"><i data-lucide="bell-off"></i>We keep it useful, never spammy — turn off anything you don't need.</div></div>`; }

/* ---------------- PROFILE ---------------- */
screens.profile = () => `
  <div class="scroll">
    <div class="topbar"><h2>Profile</h2>
      <button class="iconbtn" onclick="toggleTheme()"><i data-lucide="${document.documentElement.classList.contains("light")?"moon":"sun"}"></i></button>
      <button class="iconbtn" onclick="go('settings')"><i data-lucide="settings"></i></button>
    </div>
    <div class="pad">
      <div class="card">
        <div class="row">${avatar(ME,"l")}<div class="grow"><div class="row gap6"><div class="fw8 f20 tl">${ME.name}</div><i data-lucide="badge-check" style="color:var(--blue);width:18px"></i></div><div class="muted f13">${ME.suburb} · ${ME.style}</div></div>
        <button class="btn line sm" onclick="go('setup')">Edit</button></div>
        <div class="row gap8 mt16">
          <div class="stat" style="flex:1;cursor:pointer" onclick="go('levelCentre')"><div class="num" style="color:var(--lime)">${ME.level.toFixed(2)}</div><div class="lab">Level ›</div></div>
          <div class="stat" style="flex:1;cursor:pointer" onclick="go('reliability')"><div class="num">${ME.reliability}%</div><div class="lab">Reliability ›</div></div>
          <div class="stat" style="flex:1"><div class="num">${ME.matches}</div><div class="lab">Matches</div></div>
        </div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Activity</h3></div>
      <div class="card">
        <div class="between mb12"><span class="muted f13">This week</span><span class="fw7 f13">4 sessions · 6h</span></div>
        <div class="row gap6" style="align-items:flex-end;height:70px">${[40,65,30,80,55,90,45].map((h,i)=>`<div style="flex:1;text-align:center"><div style="height:${h}%;background:${i===5?"var(--lime)":"var(--surface3)"};border-radius:6px;min-height:6px"></div><div class="dim f11 mt4">${["M","T","W","T","F","S","S"][i]}</div></div>`).join("")}</div>
      </div>

      <div class="sectiontitle" style="margin-left:0"><h3>Manage</h3></div>
      <div class="card tight">
        ${[["Bookings & wallet","wallet","bookings"],["Level centre","gauge","levelCentre"],["Reliability & trust","shield-check","reliability"],["Friends & groups","users","friends"],["Help & support","headset","support"],["Safety centre","shield-alert","safety"],["Settings","settings","settings"]].map(([t,i,s])=>`<div class="lrow" onclick="go('${s}')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>
      <button class="btn line mt16" onclick="go('demoMenu')"><i data-lucide="zap"></i> Open demo screens</button>
      <div style="height:20px"></div>
    </div>
  </div>`;

/* ---------------- RELIABILITY ---------------- */
screens.reliability = () => `
  <div class="scroll">
    ${topbar("Reliability & trust",{solid:true})}
    <div class="pad">
      <div class="hero" style="background:linear-gradient(135deg,#12233a,#0c141f);border-color:rgba(77,166,255,0.25)">
        <div class="between"><div><div class="muted f13">Your standing</div><div class="fw8 f24 tl">Highly reliable</div></div><div style="font-size:44px;font-weight:800">${ME.reliability}%</div></div>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>What it's built from</h3></div>
      <div class="card">
        ${[["Attendance","96%",96],["Confirming results on time","98%",98],["Late cancellations","2 this year",90],["Sportsmanship","4.8 / 5",96],["Accurate profile","Verified",100],["Response rate","Fast",92]].map(([t,v,pct])=>`<div style="padding:10px 0"><div class="between mb8"><span class="muted f14">${t}</span><span class="fw7 f14">${v}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`).join("")}
      </div>
      <div class="finebox mt12">
        <div class="fr"><i data-lucide="heart"></i>We use positive language — no public shaming. Everyone starts as a “New player”.</div>
        <div class="fr"><i data-lucide="message-circle-question"></i>Think a score is unfair? You can dispute it and a person will review.</div>
      </div>
      <button class="btn line mt12 mb20" onclick="go('support')">Dispute my score</button>
    </div>
  </div>`;

/* ---------------- SAFETY ---------------- */
screens.safety = () => `
  <div class="scroll">
    ${topbar("Safety centre",{solid:true})}
    <div class="pad">
      <div class="card" style="border-color:rgba(255,107,107,0.3)">
        <div class="row"><div class="ic" style="width:44px;height:44px;background:rgba(255,107,107,0.14);border:none;border-radius:14px;display:grid;place-items:center"><i data-lucide="shield-alert" style="color:var(--red)"></i></div>
        <div class="grow"><div class="fw7">Serious reports reach a real team</div><div class="muted f13">Reviewed within 24 hours</div></div></div>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Report or block</h3></div>
      <div class="card tight">
        ${[["Report a player","user-x"],["Block a player","ban"],["Report a club","building-2"],["Report harassment","message-square-warning"],["Report payment fraud","credit-card"]].map(([t,i])=>`<div class="lrow" onclick="toast('${t} — safety team notified','shield')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Guidance</h3></div>
      <div class="card tight">
        ${[["Emergency guidance","siren"],["Code of conduct","scroll-text"],["Privacy controls","lock"]].map(([t,i])=>`<div class="lrow" onclick="openSheet('${t}','<p class=\\'muted\\' style=\\'line-height:1.6\\'>In a real emergency, always contact local services on 000 first. Padel One safety handles conduct, harassment and fraud between members.</p>')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>
      <div style="height:20px"></div>
    </div>
  </div>`;

/* ---------------- SEARCH ---------------- */
screens.search = () => {
  const f=state.filters;
  return `
  <div class="scroll">
    ${topbar("Search",{solid:true})}
    <div class="pad">
      <div class="row gap8">
        <div class="input row" style="flex:1;padding:0 12px"><i data-lucide="search" style="width:18px;color:var(--dim)"></i><input placeholder="Club, suburb or postcode" style="border:none;background:transparent;flex:1;padding:14px 8px;color:var(--text);outline:none"></div>
      </div>
      <div class="chiprow scrollx mt12">${["Courts","Clubs","Players","Open matches","Coaches","Tournaments","Leagues","Social events"].map((t,i)=>`<button class="opt ${i<2?"on":""}" style="padding:8px 12px" onclick="segTap(this)">${t}</button>`).join("")}</div>

      <div class="between mt16 mb8"><span class="fw7 f13">Filters ${filtersActiveCount()>0?`<span class="chip lime" style="margin-left:4px">${filtersActiveCount()} active</span>`:""}</span><span class="link f13" onclick="resetFilters()">Reset</span></div>
      <div class="card tight" onclick="openSheet('Filters', filtersBody(), filtersFoot())" style="cursor:pointer">
        <div class="lrow" style="border:none;padding:8px 0"><div class="ic"><i data-lucide="sliders-horizontal"></i></div><div class="grow"><div class="t f14">Distance ${f.distance}km · under ${money(f.priceMax)} · lvl ${f.levelMin.toFixed(1)}–${f.levelMax.toFixed(1)}</div><div class="s">${f.indoor} · ${f.play} · ${f.instant?"Instant only":"Any confirmation"}</div></div><i data-lucide="chevron-right" class="chev"></i></div>
      </div>
      <div class="finebox mt12" style="background:rgba(201,242,77,0.08);border-color:rgba(201,242,77,0.2)"><div class="fr"><i data-lucide="save"></i><span style="color:var(--text)">Your filters are saved — they'll still be here when you come back.</span></div></div>

      <div class="between mt16 mb8"><span class="fw7 f13">Saved searches</span></div>
      ${state.savedSearches.map(s=>`<div class="lrow" onclick="tab('clubs')"><div class="ic"><i data-lucide="bookmark"></i></div><div class="grow"><div class="t">${s.name}</div><div class="s">${s.when}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      <button class="btn line mt8" onclick="saveThisSearch()"><i data-lucide="plus"></i> Save this search</button>

      <div class="sectiontitle" style="margin-left:0"><h3>Recently viewed</h3></div>
      ${state.recent.map(id=>{const c=club(id);return `<div class="lrow" onclick="go('clubDetail',{id:'${id}'})"><div class="imgwrap" style="width:40px;height:40px;border-radius:11px">${courtImg(c.img,c.name).replace('<div class="imgwrap">','<div style="width:100%;height:100%">').replace(/<\/div>$/,'</div>')}</div><div class="grow"><div class="t">${c.name}</div><div class="s">${c.suburb} · ${c.rating} ★</div></div></div>`;}).join("")}
      <div style="height:20px"></div>
    </div>
  </div>`;
};
function filtersActiveCount(){ const f=state.filters,d=DEFAULT_FILTERS; let n=0; for(const k of ["distance","priceMax","indoor","play","instant","favOnly"]){ if(JSON.stringify(f[k])!==JSON.stringify(d[k])) n++; } return n; }
function filtersBody(){
  const f=state.filters;
  const seg=(k,opts)=>`<div class="optgrid ${opts.length>2?"three":""} mt8">${opts.map(o=>`<button class="opt ${f[k]===o?"on":""}" onclick="setFilter('${k}','${o}')">${o}</button>`).join("")}</div>`;
  return `
    <div class="field"><label>Max distance · ${f.distance} km</label><input type="range" min="1" max="30" value="${f.distance}" style="width:100%;accent-color:var(--lime)" oninput="setFilter('distance',+this.value,true)" onchange="setFilter('distance',+this.value)"></div>
    <div class="field"><label>Max price · ${money(f.priceMax)}/person</label><input type="range" min="12" max="50" value="${f.priceMax}" style="width:100%;accent-color:var(--lime)" oninput="setFilter('priceMax',+this.value,true)" onchange="setFilter('priceMax',+this.value)"></div>
    <div class="field"><label>Indoor / outdoor</label>${seg("indoor",["Any","Indoor","Outdoor"])}</div>
    <div class="field"><label>Play type</label>${seg("play",["Any","Social","Competitive"])}</div>
    <div class="field"><label>Gender preference</label>${seg("gender",["No preference","Men","Women"])}</div>
    <div class="field"><label>Instant confirmation only</label><div class="lrow" style="border:none;padding:6px 0"><div class="grow muted f14">Only show courts you can book instantly</div><div class="swtch ${f.instant?"on":""}" onclick="setFilter('instant',${!f.instant})"></div></div></div>
    <div class="field"><label>Amenities</label><div class="chiprow">${["Parking","Café","Showers","Lights","Coaching","Racket hire"].map(a=>`<button class="chip ${f.amenities.includes(a)?"lime":""}" onclick="toggleAmenity('${a}')">${a}</button>`).join("")}</div></div>
    <div class="field"><label>Only favourite clubs</label><div class="lrow" style="border:none;padding:6px 0"><div class="grow muted f14">Hide everything except ★ favourites</div><div class="swtch ${f.favOnly?"on":""}" onclick="setFilter('favOnly',${!f.favOnly})"></div></div></div>`;
}
function filtersFoot(){ return `<div class="btnrow"><button class="btn line" onclick="resetFilters();closeSheet()">Reset</button><button class="btn primary" onclick="closeSheet();toast('Filters saved','save');rerender()">Show results</button></div>`; }
function setFilter(k,v,live){ state.filters[k]=v; saveFilters(); if(!live){ openSheet("Filters", filtersBody(), filtersFoot()); } }
function toggleAmenity(a){ const arr=state.filters.amenities; const i=arr.indexOf(a); if(i>=0)arr.splice(i,1); else arr.push(a); saveFilters(); openSheet("Filters", filtersBody(), filtersFoot()); }
function resetFilters(){ state.filters=JSON.parse(JSON.stringify(DEFAULT_FILTERS)); saveFilters(); toast("Filters reset","rotate-ccw"); const t=stack[stack.length-1]; if(t.name==="search") rerender(); }
function saveThisSearch(){ state.savedSearches.unshift({name:"New search · "+new Date().toLocaleDateString(), when:"Just now"}); store.set("savedSearches",state.savedSearches); toast("Search saved","bookmark"); rerender(); }

/* ---------------- MESSAGES ---------------- */
screens.messages = () => `
  <div class="scroll">
    ${topbar("Messages",{solid:true, actions:`<button class="iconbtn" onclick="toast('New message','pen-line')"><i data-lucide="pen-line"></i></button>`})}
    <div class="pad">
      ${[["p_sarah","Sarah Nguyen","See you at 7:30! 🎾","2m",true],["p_lucas","Lucas Ferreira","Good games tonight man","1h",false],["p_layla","Layla Haddad","Ladder practice Saturday?","3h",true],["p_daniel","Daniel Costa","Nice, I'll book the court","Yesterday",false]].map(([id,n,m,t,u])=>`
        <div class="lrow" onclick="toast('Chat is a prototype preview','message-circle')"><div style="width:46px;position:relative">${avatar(player(id),"m")}${u?'<span style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:var(--lime);border:2px solid var(--bg);border-radius:50%"></span>':""}</div><div class="grow"><div class="between"><div class="t">${n}</div><div class="dim f11">${t}</div></div><div class="s">${m}</div></div></div>`).join("")}
    </div>
  </div>`;

/* ---------------- SETUP (player setup) ---------------- */
let su = { name:"Aiman", suburb:"Bankstown", level:3.25, side:"Right", style:"Both", pub:true };
screens.setup = () => `
  <div class="scroll nonav">
    ${topbar("Set up your profile",{})}
    <div class="pad stagger">
      <p class="muted" style="margin-top:0">Takes about a minute. You can change any of this later — including your starting level.</p>
      <div class="field"><label>Preferred name</label><input class="input" value="${su.name}"></div>
      <div class="field"><label>Profile photo</label><div class="row gap12"><div>${avatar(ME,"l")}</div><button class="btn line wauto" onclick="toast('Photo picker (prototype)','camera')"><i data-lucide="camera"></i> Upload</button></div></div>
      <div class="field"><label>Home suburb</label><input class="input" value="${su.suburb}"></div>
      <div class="field"><label>Preferred clubs</label><div class="chiprow">${CLUBS.slice(0,3).map((c,i)=>`<button class="chip ${i===0?"lime":""}" onclick="this.classList.toggle('lime')">${c.name}</button>`).join("")}</div></div>

      <div class="field"><label>Playing experience</label>
        <div class="optgrid">${[["New to padel","0–6 months"],["Getting into it","6mo–2yr"],["Experienced","2–5 yr"],["Very experienced","5yr+"]].map(([t,d],i)=>`<button class="opt tall ${i===2?"on":""}" onclick="segTap(this)"><span class="t">${t}</span><span class="d">${d}</span></button>`).join("")}</div>
      </div>

      <div class="field"><label>Your level</label>
        <div class="optgrid">${[["Beginner","2.0–2.5"],["Improver","2.5–3.0"],["Intermediate","3.0–3.5"],["Advanced","3.5+"]].map(([t,d],i)=>`<button class="opt tall ${i===2?"on":""}" onclick="segTap(this)"><span class="t">${t}</span><span class="d">${d}</span></button>`).join("")}</div>
        <div class="row gap8 mt12"><input class="input center" value="3.25" style="flex:1"><button class="btn line wauto" onclick="toast('Guided skill check (prototype)','clipboard-check')">Guided check</button></div>
        <button class="btn mt8" style="background:transparent;color:var(--muted)" onclick="toast('No problem — we\\'ll start you at 3.0 and adjust','check')">I'm not sure — help me</button>
        <div class="hint">Your starting level is just a starting point. Every match fine-tunes it automatically.</div>
      </div>

      <div class="field"><label>Preferred side</label><div class="optgrid three">${["Left","Right","Either"].map(s=>`<button class="opt ${su.side===s?"on":""}" onclick="segTap(this)">${s}</button>`).join("")}</div></div>
      <div class="field"><label>Match style</label><div class="optgrid three">${["Social","Competitive","Both"].map(s=>`<button class="opt ${su.style===s?"on":""}" onclick="segTap(this)">${s}</button>`).join("")}</div></div>
      <div class="field"><label>Typical availability</label><div class="chiprow">${["Weekday eve","Weekend AM","Weekend PM","Weekday AM"].map((a,i)=>`<button class="chip ${i<2?"lime":""}" onclick="this.classList.toggle('lime')">${a}</button>`).join("")}</div></div>
      <div class="field"><label>Preferred distance</label><div class="optgrid three">${["5 km","10 km","20 km"].map((s,i)=>`<button class="opt ${i===1?"on":""}" onclick="segTap(this)">${s}</button>`).join("")}</div></div>
      <div class="field"><label>Gender preference for matches</label><div class="optgrid three">${["Men","Women","No pref"].map((s,i)=>`<button class="opt ${i===2?"on":""}" onclick="segTap(this)">${s}</button>`).join("")}</div></div>

      <div class="lrow"><div class="ic"><i data-lucide="eye"></i></div><div class="grow"><div class="t">Public profile</div><div class="s">Let others find and invite you</div></div><div class="swtch on" onclick="this.classList.toggle('on')"></div></div>
    </div>
    <div style="position:sticky;bottom:0;padding:14px 18px;background:linear-gradient(transparent,var(--bg) 30%)">
      <button class="btn primary" onclick="toast('Profile saved 🎉','check-circle');setTimeout(()=>tab('home'),700)">Save & explore</button>
    </div>
  </div>`;

/* ---------------- DEMO MENU ---------------- */
const DEMO = [
  ["Onboarding","sparkles",()=>{$("#onboarding").style.display="flex";obIndex=0;renderOnboarding();}],
  ["Player setup","user-round-cog","setup"],
  ["Home dashboard","home","home"],
  ["Universal search","search","search"],
  ["Court discovery","map-pin","clubs"],
  ["Club profile","building-2",()=>go("clubDetail",{id:"c_syd"})],
  ["Court booking","calendar-plus",()=>go("courtBooking",{id:"c_syd"})],
  ["Booking success","check-circle",()=>go("bookingSuccess",{ref:"PDL-8842-QX",cid:"c_syd",total:24.4})],
  ["Create open match","plus-circle","createMatch"],
  ["Find a match","swords","play"],
  ["Match detail","list",()=>go("matchDetail",{id:"m_1"})],
  ["Match lobby","users-round",()=>go("matchLobby",{id:"m_1"})],
  ["Player profile","circle-user",()=>go("playerProfile",{id:"p_sarah"})],
  ["Level centre","gauge","levelCentre"],
  ["Match results","trophy","results"],
  ["Bookings & wallet","wallet","bookings"],
  ["Wallet","credit-card","wallet"],
  ["Cancellation","calendar-x",()=>go("cancellation",{id:"PDL-8842-QX"})],
  ["Refund tracker","rotate-ccw","refundTracker"],
  ["Human support","headset","support"],
  ["Support chat","message-circle","supportChat"],
  ["Community","users","community"],
  ["Friends & groups","user-round-plus","friends"],
  ["Group detail","users-round",()=>go("groupDetail",{id:"g_wed"})],
  ["Leagues & tournaments","medal","compete"],
  ["Tournament detail","trophy",()=>go("tournamentDetail",{id:"t_1"})],
  ["Coaching","graduation-cap","coaching"],
  ["Coach profile","user-round",()=>go("coachDetail",{id:"co_1"})],
  ["Notifications","bell","notifications"],
  ["Reliability & trust","shield-check","reliability"],
  ["Safety centre","shield-alert","safety"],
  ["Settings","settings","settings"],
];
screens.demoMenu = () => `
  <div class="scroll">
    ${topbar("Demo screens",{solid:true})}
    <div class="pad">
      <p class="muted" style="margin-top:0">Jump straight to any screen — every major flow of Padel One in one tap.</p>
      <div class="demogrid stagger">${DEMO.map((d,i)=>`<button class="demotile" onclick="demoGo(${i})"><div class="di"><i data-lucide="${d[1]}"></i></div><div class="dn">${d[0]}</div></button>`).join("")}</div>
      <div style="height:20px"></div>
    </div>
  </div>`;
function demoGo(i){ const d=DEMO[i][2]; if(typeof d==="function") d(); else go(d); }

/* ---------------- SETTINGS ---------------- */
screens.settings = () => `
  <div class="scroll">
    ${topbar("Settings",{solid:true})}
    <div class="pad">
      <div class="sectiontitle" style="margin-left:0"><h3>Appearance</h3></div>
      <div class="card tight">
        <div class="lrow"><div class="ic"><i data-lucide="moon"></i></div><div class="grow"><div class="t">Dark mode</div><div class="s">Cinematic default</div></div><div class="swtch ${document.documentElement.classList.contains("light")?"":"on"}" onclick="toggleTheme()"></div></div>
        <div class="lrow"><div class="ic"><i data-lucide="languages"></i></div><div class="grow"><div class="t">Language</div></div><span class="muted f13">English (AU)</span></div>
        <div class="lrow"><div class="ic"><i data-lucide="accessibility"></i></div><div class="grow"><div class="t">Accessibility</div><div class="s">Larger text, reduced motion</div></div><i data-lucide="chevron-right" class="chev"></i></div>
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Account</h3></div>
      <div class="card tight">
        ${[["Personal details","user"],["Playing preferences","settings-2"],["Level settings","gauge"],["Privacy","lock"],["Notifications","bell"],["Payment methods","credit-card"],["Memberships","ticket"],["Favourite clubs","heart"],["Hidden clubs","eye-off"],["Blocked users","ban"],["Support history","history"]].map(([t,i])=>`<div class="lrow" onclick="toast('${t} (prototype)','${i}')"><div class="ic"><i data-lucide="${i}"></i></div><div class="grow"><div class="t">${t}</div></div><i data-lucide="chevron-right" class="chev"></i></div>`).join("")}
      </div>
      <div class="sectiontitle" style="margin-left:0"><h3>Your data</h3></div>
      <div class="card tight">
        <div class="lrow" onclick="toast('Data export requested','download')"><div class="ic"><i data-lucide="download"></i></div><div class="grow"><div class="t">Download my data</div></div><i data-lucide="chevron-right" class="chev"></i></div>
        <div class="lrow" onclick="toast('Account deletion (prototype)','trash-2')"><div class="ic"><i data-lucide="trash-2"></i></div><div class="grow"><div class="t" style="color:var(--red)">Delete account</div></div><i data-lucide="chevron-right" class="chev"></i></div>
      </div>
      <button class="btn line mt16 mb20" onclick="toast('Signed out (prototype)','log-out')">Sign out</button>
    </div>
  </div>`;

screens.notfound = () => `<div class="scroll">${topbar("",{})}${emptyState("compass","Screen coming soon","This part of the prototype isn't wired yet.")}</div>`;
