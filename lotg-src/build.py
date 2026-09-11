from PIL import Image, ImageFilter, ImageOps, ImageDraw
import base64, io, os, pathlib
sp=pathlib.Path(__file__).resolve().parent; T=sp/"tiles"
REPO=sp.parent if (sp.parent/"assets"/"lotg-original.png").exists() else pathlib.Path("/home/user/lockdown-lab-registration")
MODE=os.environ.get("MODE","artifact"); OUT=REPO/"lotg"; SITE_URL=os.environ.get("SITE_URL","https://loveofthegame.netlify.app").rstrip("/")
if MODE=="deploy": (OUT/"assets").mkdir(parents=True,exist_ok=True)
IG="https://www.instagram.com/loveofthegameaus"; MAIL="info@loveofthegame.com.au"
def emit(im,name,q,fmt="WEBP"):
    b=io.BytesIO(); im.save(b,fmt,quality=q,method=6); data=b.getvalue()
    if MODE=="deploy":
        (OUT/"assets"/f"{name}.webp").write_bytes(data); return f"assets/{name}.webp"
    return "data:image/webp;base64,"+base64.b64encode(data).decode()
def jpg(im,q,name): return emit(im.convert("RGB"),name,q)
def png_webp(p,maxw,q,name):
    im=Image.open(p).convert("RGBA")
    if im.width>maxw: im=im.resize((maxw,int(maxw*im.height/im.width)),Image.LANCZOS)
    return emit(im,name,q)
def clean(name,q=78):
    im=Image.open(T/f"{name}.jpg").convert("RGB"); W,H=im.size; px=im.convert("L").load(); xs=[];ys=[]
    for y in range(0,110):
        for x in range(W-110,W):
            if px[x,y]>=238: xs.append(x); ys.append(y)
    if xs:
        x0,y0,x1,y1=min(xs)-6,min(ys)-6,max(xs)+7,max(ys)+7; w=x1-x0
        im.paste(im.crop((x0-w,y0,x0,y1)).transpose(Image.FLIP_LEFT_RIGHT),(x0,y0))
        reg=(max(0,x0-4),max(0,y0-4),min(W,x1+4),min(H,y1+4)); im.paste(im.crop(reg).filter(ImageFilter.GaussianBlur(1.6)),reg)
    return jpg(im,q,"ev-"+name)
def tile(name,q=78): return jpg(Image.open(T/f"{name}.jpg"),q,"tile-"+name)
CREST=png_webp(REPO/"assets"/"lotg-original.png",960,94,"crest"); MARK=png_webp(sp/"lotg-mark-crop.png",250,95,"mark")
bg=Image.open(T/"f11_r1_c1.jpg").convert("L"); bg=ImageOps.autocontrast(bg,cutoff=1)
bg=bg.resize((560,int(560*bg.height/bg.width)),Image.LANCZOS).filter(ImageFilter.GaussianBlur(11)); BG=jpg(bg,62,"hero-bg")
FEAT=jpg(Image.open(sp/"tile_feat.jpg"),80,"feat")

css=(sp/"premium.css").read_text()+(sp/"talk.css").read_text()+(sp/"contact.css").read_text()+(sp/"community.css").read_text()+(sp/"admin.css").read_text()
head=f'''<title>Love of the Game</title>
<meta name="description" content="Love of the Game — a community hub for sport, stories, men's mental health, a schools program and events across NSW.">
<meta name="theme-color" content="#09090B">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Archivo:ital,wght@1,900&family=Hanken+Grotesk:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
{css}</style>
'''
NAV='''<a class="txt" href="#about">What we do</a>
        <a class="txt" href="#media">Stories</a>
        <a class="txt" href="#talk">Real talk</a>
        <a class="txt" href="#program">Program</a>
        <a class="txt" href="#events">Events</a>
        <a class="txt" href="#contact">Contact</a>'''
PLAY='<span class="play"><svg viewBox="0 0 24 24"><path d="M6 3l14 9-14 9z"/></svg></span>'
VIEW='<span class="play"><svg viewBox="0 0 24 24"><path d="M4 8h12v12H4zM8 4h12v12h-2V6H8z"/></svg></span>'
hero=f'''<div class="topbar" id="topbar">
  <a class="brand" href="#top"><img src="{MARK}" alt=""><b>Love of the Game</b></a>
  <nav>
        {NAV}
        <a class="pill" href="{IG}" target="_blank" rel="noopener">Instagram</a>
  </nav>
</div>
<section class="hero" id="top">
  <div class="hero-bg" aria-hidden="true"><img src="{BG}" alt=""></div>
  <canvas id="court" aria-hidden="true"></canvas>
  <img class="wm" src="{MARK}" alt="" aria-hidden="true">
  <div class="vignette" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="shell">
    <header class="rise">
      <a class="brand" href="#top"><img src="{MARK}" alt=""><b>Love of the Game</b></a>
      <nav>
        {NAV}
        <a class="ig" href="{IG}" target="_blank" rel="noopener">Instagram</a>
      </nav>
    </header>
    <main>
      <div class="glow" aria-hidden="true"></div>
      <div class="eyebrow rise d1"><i></i>Sydney · NSW — Est. 2024<i></i></div>
      <div class="rise d2"><img class="crest" id="crest" src="{CREST}" alt="Love of the Game — Your Journey, Your Story. Established 2024."></div>
      <h1 class="say rise d3">Everyone has a <u>story</u> worth telling.</h1>
      <p class="lede rise d4">A community built around sport, real stories and looking out for each other — highlights and
        interviews, honest talk about <b>men's mental health</b>, a <b>schools program</b> and events, from right across NSW.</p>
      <div class="cta rise d5">
        <a class="btn btn-gold" href="{IG}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>
          Follow the journey
        </a>
        <a class="btn btn-ghost" href="#contact">Get in touch</a>
      </div>
    </main>
    <footer class="rise d6">
      <div class="strip">
        <span class="k">Sport&nbsp;&amp;&nbsp;Stories</span><i class="dot"></i>
        <span class="k">Real&nbsp;Talk</span><i class="dot"></i>
        <span class="k">Schools</span><i class="dot"></i>
        <span class="k">Events</span><i class="dot"></i>
        <span>10K+&nbsp;Community</span>
      </div>
    </footer>
  </div>
  <a class="cue" href="#about" aria-label="Scroll to what we do"><span>Scroll</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></a>
</section>
'''
ICO={
 "film":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M7 4v5M17 4v5M7 20v-5M17 20v-5"/><path d="M11 12.2v3.6l3-1.8z" fill="currentColor" stroke="none"/></svg>',
 "heart":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 17.5 3.5 14.5 3.5 10.5A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8.5 2.5C20.5 14.5 17 17.5 12 21z"/></svg>',
 "grad":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10v5c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5"/><path d="M22 8v5"/></svg>',
 "trophy":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0z"/><path d="M6 6H3v1a4 4 0 0 0 3 3.8M18 6h3v1a4 4 0 0 1-3 3.8"/><path d="M9 20h6M12 14v6"/></svg>'}
def pill(tag,ico,h,p,href,more):
    return f'''      <article class="pill">
        <span class="tag">{tag}</span>
        <div class="ico">{ICO[ico]}</div>
        <h3>{h}</h3>
        <p>{p}</p>
        <a class="more" href="{href}">{more} →</a>
      </article>'''
about=f'''<section class="sec about" id="about">
  <div class="wrap">
    <span class="kick rv">Who we are</span>
    <h2 class="rv dl1">Making a difference — on and off the <u>court</u>.</h2>
    <p class="intro rv dl2">Love of the Game started in the gym and grew into a community. We shine a light on sport and the
      people in it — basketball first, but the NBL, the NRL and stories from right across NSW too. We talk honestly about
      <b>men's mental health</b>, run a school-based mentoring program, put on the events that bring people together, and
      back anyone trying to make a difference. <b>Your journey, your story.</b></p>
    <div class="pillars rv dl2">
{pill("From around NSW","film","Sport &amp; stories","Basketball first — plus the NBL, the NRL and the stories from around NSW the mainstream misses.","#media","See the stories")}
{pill("Men's mental health","heart","Real talk","Honest conversations about men's mental health — because the game is about the people who play it.","#talk","Start here")}
{pill("Schools","grad","The Next Play","A school-based mentoring program built on the NSW PDHPE syllabus — meeting young people where they are.","#program","See the program")}
{pill("In the gym","trophy","Community &amp; events","Wednesday nights, tournaments, call-outs and the moments that bring people together.","#events","See what's on")}
    </div>
    <div class="motto rv">
      <p>Never above you. Never below you. Always <u>beside</u> you.</p>
      <small>The Love of the Game promise</small>
    </div>
  </div>
</section>
'''
tiles=[("feat",FEAT,"Highlight","Above the rim",PLAY),
 ("",tile("f11_r1_c2"),"Interview","On the mic",PLAY),
 ("",tile("f15_r2_c2"),"NRL","Wests Tigers — real thoughts on Benji and the squad",PLAY),
 ("",tile("f13_r2_c2"),"NBL","Top 3 players to savour — OG edition",VIEW),
 ("",tile("f13_r2_c3"),"Community","“You inspired me to start.”",VIEW),
 ("",tile("f15_r1_c1"),"Highlights","Isaiah Toledo — LOTG MVP",PLAY),
 ("",tile("f15_r2_c3"),"Real talk","A Father's Day message",PLAY),
 ("",tile("f19_r2_c1"),"Community","Your journey, your story",VIEW),
 ("",tile("f19_r3_c2"),"Event","$5,000 — YSA v Team Sphera",PLAY)]
cells="\n".join(f'''      <a class="tile{(' '+c) if c else ''}" href="{IG}" target="_blank" rel="noopener">
        <img src="{src}" alt="{box} — Love of the Game on Instagram" loading="lazy" decoding="async">
        {badge}
        <span class="cap"><span class="tag">{tag}</span><span class="box">{box}</span></span>
      </a>''' for c,src,tag,box,badge in tiles)
media=f'''<section class="sec media" id="media">
  <div class="wrap wide">
    <div class="media-head rv">
      <div>
        <span class="kick">Stories</span>
        <h2>From the court — <u>and beyond</u>.</h2>
        <p class="intro">Highlights, interviews, stat lines and real talk — basketball, the NBL, the NRL and the stories
          from around NSW that don't make the mainstream.</p>
      </div>
      <div class="side">
        <span class="count"><i></i>4,500+ stories · @loveofthegameaus</span>
        <a class="btn btn-ghost" href="{IG}" target="_blank" rel="noopener">See it all on Instagram</a>
      </div>
    </div>
    <div class="wall rv dl1">
{cells}
    </div>
    <div class="wall-foot rv">
      <p>Every tile opens Love of the Game on Instagram — that's where the stories land first.</p>
      <a class="btn btn-gold" href="{IG}" target="_blank" rel="noopener">Watch the latest</a>
    </div>
  </div>
</section>
'''
talk=f'''<section class="sec talk" id="talk">
  <div class="wrap">
    <div class="talk-head">
      <span class="kick rv">Men's mental health</span>
      <h2 class="rv dl1">Your story matters. <u>So do you.</u></h2>
      <p class="intro rv dl2">Love of the Game uses its platform to talk honestly about men's mental health — the pressure,
        the losses, the days that don't make the highlight reel. Real conversations, no judgement, and a community that checks in.</p>
    </div>
    <div class="talk-grid rv dl2">
      <div class="tcard"><i class="n"></i><h3>Real conversations</h3><p>Interviews and messages that go deeper than the game — from the people living it.</p></div>
      <div class="tcard"><i class="n"></i><h3>A community that checks in</h3><p>Never above you, never below you, always beside you. Look out for your mates — and let them look out for you.</p></div>
      <div class="tcard"><i class="n"></i><h3>Your story</h3><p>Share it. Speaking up might be the reason someone else does too.</p></div>
    </div>
    <div class="support rv">
      <p><b>Need support right now?</b> Lifeline <b>13 11 14</b> · Beyond Blue <b>1300 22 4636</b> · In an emergency, call <b>000</b>.</p>
      <div class="cta">
        <a class="btn btn-gold" href="{IG}" target="_blank" rel="noopener">Share your story</a>
        <a class="btn btn-ghost" href="#contact" data-about="Share my story">Reach out</a>
      </div>
    </div>
  </div>
</section>
'''
prog=(sp/"prog.html").read_text().replace('href="mailto:info@loveofthegame.com.au?subject=The%20Next%20Play%20Program%20for%20our%20school"','href="#contact" data-about="The Next Play — for my school"').replace('<div class="prog-head">','<div class="prog-head rv">').replace('<div class="track" id="track">','<div class="track rv dl1" id="track">').replace('<div class="forwho">','<div class="forwho rv">')
big=clean("f15_r3_c1"); wnb=clean("f11_r2_c3"); tour=clean("f17_r1_c1"); ubl=clean("f15_r3_c3")
def card(cls,src,pos,tag,h,p,meta,extra=""):
    return f'''      <a class="card{(' '+cls) if cls else ''}" href="{IG}" target="_blank" rel="noopener">
        <img src="{src}" alt="" style="object-position:{pos}" loading="lazy" decoding="async">
        <div class="in">
          <span class="tag">{tag}</span>{extra}
          <h3>{h}</h3>
          <p>{p}</p>
          <span class="meta"><i></i>{meta}</span>
        </div>
      </a>'''
STAKE='\n          <span class="stake">$5,000<small>On the line · Winner takes all</small></span>'
events=f'''<section class="sec events" id="events">
  <div class="wrap wide">
    <div class="ev-head rv">
      <span class="kick">Community &amp; events</span>
      <h2>Where the community <u>shows up</u>.</h2>
      <p class="intro">From the Wednesday night run to winner-takes-all showdowns — the events that bring people together,
        on the court and off it.</p>
    </div>
    <div class="fx rv dl1">
{card("big",big,"72% 40%","Headline events","Winner-takes-all showdowns","Like YSA v Team Sphera — five grand on the line, streamed live on Instagram and YouTube and called like a broadcast.","Live on Instagram &amp; YouTube",STAKE)}
{card("",wnb,"50% 30%","WNB","Wednesday nights","The LOTG run — and the community call-outs that come with it.","The run · Call-outs")}
{card("",tour,"50% 35%","Seasonal","Tournaments","LOTG tournaments with an MVP crowned and a full highlight package for everyone who shows out.","MVP honours · Full highlights")}
{card("",ubl,"55% 45%","League","UBL coverage","Round by round — match of the round, stat lines and the grand finals.","Match of the round · GFs")}
    </div>
    <div class="involve rv">
      <div>
        <h4>Want in?</h4>
        <p>Enter a team, call someone out for a Wednesday night, or put your brand on an event. One message is all it takes.</p>
      </div>
      <div class="cta">
        <a class="btn btn-gold" href="{IG}" target="_blank" rel="noopener">Message on Instagram</a>
        <a class="btn btn-ghost" href="#contact" data-about="Sponsorship &amp; partnerships">Sponsor an event</a>
      </div>
    </div>
  </div>
</section>
'''
LIVE = "1" if MODE=="deploy" else "0"
PREV = "" if LIVE=="1" else '<p class="cnote prev">Preview: on the live site this sends straight to the inbox.</p>'
contact=f'''<section class="sec contact" id="contact">
  <div class="wrap">
    <span class="kick rv">Contact &amp; bookings</span>
    <h2 class="rv dl1">Let's make it <u>happen</u>.</h2>
    <p class="intro rv dl2">Schools, events, sponsors, media — or just a hello. Tell us what you're after and we'll come back to you.</p>
    <div class="cgrid rv dl2">
      <div class="cform" id="cform">
        <form name="contact" method="POST" action="/thanks.html" data-netlify="true" netlify-honeypot="bot-field" id="contactForm" data-live="{LIVE}" novalidate>
          <input type="hidden" name="form-name" value="contact">
          <p class="hp" aria-hidden="true"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
          <div class="row">
            <div class="f"><label for="c-name">Name <i>*</i></label><input id="c-name" name="name" required autocomplete="name" placeholder="Your name"></div>
            <div class="f"><label for="c-email">Email <i>*</i></label><input id="c-email" name="email" type="email" required autocomplete="email" placeholder="you@email.com"></div>
          </div>
          <div class="row">
            <div class="f"><label for="c-phone">Phone</label><input id="c-phone" name="phone" type="tel" autocomplete="tel" placeholder="Optional"></div>
            <div class="f"><label for="c-org">School / organisation</label><input id="c-org" name="organisation" autocomplete="organization" placeholder="Optional"></div>
          </div>
          <div class="f"><label for="c-about">I'm contacting about <i>*</i></label>
            <select id="c-about" name="about" required>
              <option value="">Choose one…</option>
              <option value="The Next Play — for my school">The Next Play — for my school</option>
              <option value="Book an event or call-out">Book an event or call-out</option>
              <option value="Sponsorship &amp; partnerships">Sponsorship &amp; partnerships</option>
              <option value="Media, interviews &amp; coverage">Media, interviews &amp; coverage</option>
              <option value="Share my story">Share my story</option>
              <option value="Something else">Something else</option>
            </select></div>
          <div class="f"><label for="c-when">Preferred dates</label><input id="c-when" name="dates" placeholder="e.g. Term 4, or a date range — optional"></div>
          <div class="f"><label for="c-msg">Message <i>*</i></label><textarea id="c-msg" name="message" required placeholder="Tell us a bit about what you're after."></textarea></div>
          <button class="btn btn-gold" type="submit" id="cSend">Send it</button>
          <p class="cerr">That didn't send. Email us instead: <a href="mailto:{MAIL}">{MAIL}</a></p>
          {PREV}
          <p class="cnote">We'll only use your details to reply. Prefer email? <a href="mailto:{MAIL}">{MAIL}</a></p>
        </form>
        <div class="cdone" role="status">
          <div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <h3>Got it — thank you.</h3>
          <p>We've got your message and we'll come back to you. In the meantime, the stories keep rolling on <a href="{IG}" target="_blank" rel="noopener">Instagram</a>.</p>
        </div>
      </div>
      <aside class="cside">
        <h3>What are you after?</h3>
        <div class="quick" id="quick">
          <button type="button" data-about="The Next Play — for my school"><div><b>The Next Play for my school</b><small>Nine-week mentoring program · NSW PDHPE</small></div><span>→</span></button>
          <button type="button" data-about="Book an event or call-out"><div><b>Book an event or call-out</b><small>Wednesday nights, tournaments, showdowns</small></div><span>→</span></button>
          <button type="button" data-about="Sponsorship &amp; partnerships"><div><b>Sponsor or partner</b><small>Put your brand on the community</small></div><span>→</span></button>
          <button type="button" data-about="Media, interviews &amp; coverage"><div><b>Media &amp; coverage</b><small>Interviews, highlights, features</small></div><span>→</span></button>
        </div>
        <div class="direct">
          <a href="mailto:{MAIL}"><i>Email</i>{MAIL}</a>
          <a href="{IG}" target="_blank" rel="noopener"><i>Instagram</i>@loveofthegameaus</a>
          <a href="https://www.threads.net/@loveofthegameaus" target="_blank" rel="noopener"><i>Threads</i>@loveofthegameaus</a>
          <span><i>Based in</i>Sydney, NSW — working right across the state</span>
        </div>
        <div class="resp">We read everything — schools and event bookings first. Got an idea rather than a booking? <a href="#" data-sbox style="color:var(--chalk);border-bottom:1px solid var(--line);text-decoration:none">Drop it in the suggestion box</a>.</div>
      </aside>
    </div>
  </div>
</section>

'''
close=f'''<section class="sec close">
  <div class="wrap rv">
    <img src="{MARK}" alt="">
    <h2>Your journey.<br><u>Your story.</u></h2>
    <p>Love of the Game is built by the people in it. Follow along, share your story, bring The Next Play to your school,
      or get your team on the court.</p>
    <div class="cta">
      <a class="btn btn-gold" href="{IG}" target="_blank" rel="noopener">Follow the journey</a>
      <a class="btn btn-ghost" href="#contact">Get in touch</a>
    </div>
  </div>
</section>
'''
foot=f'''<div class="sec foot" id="footer" role="contentinfo">
  <div class="wrap">
    <div class="foot-grid rv">
      <div class="brandblock">
        <img src="{MARK}" alt="">
        <b>Love of the Game</b>
        <span>Your journey, your story</span>
        <p>A community built around sport, stories and looking out for each other — making a difference on and off the court, across NSW.</p>
      </div>
      <div><h5>Explore</h5><ul>
        <li><a href="#about">What we do</a></li><li><a href="#media">Stories</a></li><li><a href="#talk">Real talk</a></li>
        <li><a href="#program">The Next Play</a></li><li><a href="#events">Community &amp; events</a></li><li><a href="#contact">Contact &amp; bookings</a></li><li><a href="#" data-sbox>Suggestion box</a></li></ul></div>
      <div><h5>Connect</h5><ul>
        <li><a href="{IG}" target="_blank" rel="noopener">Instagram<small>@loveofthegameaus</small></a></li>
        <li><a href="https://www.threads.net/@loveofthegameaus" target="_blank" rel="noopener">Threads<small>@loveofthegameaus</small></a></li>
        <li><a href="https://linktr.ee/loveofthegameaus" target="_blank" rel="noopener">Linktree<small>All the links</small></a></li></ul></div>
      <div><h5>Get in touch</h5><ul>
        <li><a href="mailto:{MAIL}">{MAIL}<small>Schools · events · media</small></a></li>
        <li><a href="mailto:{MAIL}?subject=The%20Next%20Play%20Program%20for%20our%20school">Book The Next Play<small>For schools</small></a></li></ul></div>
    </div>
    <div class="foot-bar">
      <span>© 2026 <b>Love of the Game</b> · Sydney, NSW · Est. 2024</span>
      <span>Making a difference for the community</span>
    </div>
  </div>
</div>
'''
scripts=pathlib.Path(sp/"scripts.html").read_text()
LETTERBOX='<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#E2B44E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g class="env"><rect x="10.5" y="4" width="11" height="8" rx="1" fill="#F2EFE6" stroke="#CFC9BA" stroke-width="1"/><path d="M10.5 5l5.5 4 5.5-4" stroke="#9A958A" stroke-width="1"/></g><rect x="5" y="11" width="22" height="16" rx="2.5"/><path d="M8 27v2M24 27v2"/><rect class="flap" x="9" y="13" width="14" height="3.2" rx="1" fill="#E2B44E"/><path d="M11 21h10" stroke-width="1.2"/></svg>'
community=f'''<div class="welcome" id="welcome" role="dialog" aria-modal="true" aria-labelledby="wTitle" hidden>
  <div class="w-scrim"></div>
  <div class="w-card">
    <img class="w-mark" src="{MARK}" alt="">
    <span class="kick">Before you scroll</span>
    <h2 id="wTitle" class="w-lines">
      <span>This isn't just a website.</span>
      <span>You've just walked into a community — through your phone.</span>
      <span>It's about your journey. <u>Your story.</u></span>
      <span>And you belong here as much as the 10,000 already in it.</span>
    </h2>
    <p class="w-sign">Welcome to Love of the Game</p>
    <div class="cta">
      <button class="btn btn-gold" type="button" id="wIn">Let me in</button>
    </div>
  </div>
</div>

<button class="lbox" id="lbox" type="button" aria-label="Open the suggestion box" aria-expanded="false" aria-controls="sbox">
  <span class="lb">{LETTERBOX}</span><span class="lbl">Suggestion box</span>
</button>
<div class="s-scrim" id="sScrim" hidden></div>
<div class="sbox" id="sbox" role="dialog" aria-labelledby="sTitle" hidden>
  <div class="sh">
    <div>
      <h3 id="sTitle">The suggestion box</h3>
    </div>
    <button class="x" id="sClose" type="button" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </div>
  <p class="sub">This one's built <b>by the community</b> — and <b>every single suggestion gets read</b>. An idea, a shout-out, a court, a story. Anonymous is fine.</p>
  <form id="sugForm" data-live="{LIVE}" novalidate>
    <p class="hp" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></p>
    <div class="types" role="radiogroup" aria-label="What kind of suggestion">
      <label><input type="radio" name="type" value="Idea" checked><span>Idea</span></label>
      <label><input type="radio" name="type" value="Shout-out"><span>Shout-out</span></label>
      <label><input type="radio" name="type" value="Nominate someone"><span>Nominate someone</span></label>
      <label><input type="radio" name="type" value="Event"><span>Event</span></label>
      <label><input type="radio" name="type" value="Court"><span>Court</span></label>
      <label><input type="radio" name="type" value="Other"><span>Other</span></label>
    </div>
    <div class="f"><label for="s-text">Your suggestion <i>*</i></label><textarea id="s-text" name="suggestion" required placeholder="What should we do, cover, run, or fix?"></textarea></div>
    <div class="row2">
      <div class="f"><label for="s-name">Name</label><input id="s-name" name="name" placeholder="Optional"></div>
      <div class="f"><label for="s-contact">Email or @handle</label><input id="s-contact" name="contact" placeholder="Optional — if you want a reply"></div>
    </div>
    <button class="btn btn-gold" type="submit" id="sSend">Post it</button>
    <p class="cerr">That didn't post. Email it instead: <a href="mailto:{MAIL}">{MAIL}</a></p>
    {PREV}
  </form>
  <div class="sdone" role="status">
    <div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
    <h3>In the box. Thank you.</h3>
    <p>Every single one gets read — this community is built on them.</p>
    <button class="btn btn-ghost" type="button" id="sAgain">Post another</button>
  </div>
</div>

<button class="hqbtn" id="hqbtn" aria-hidden="true" tabindex="-1"></button>
<div class="hq-scrim" id="hqScrim" hidden></div>
<div class="hqpin" id="hqPin" role="dialog" aria-modal="true" aria-label="Owner sign in" hidden>
  <div class="lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>
  <h3>Owner inbox</h3>
  <p>Enter your PIN to read the suggestions.</p>
  <form id="hqPinForm" novalidate>
    <input id="hqPinInput" inputmode="text" autocomplete="off" aria-label="PIN" placeholder="&bull;&bull;&bull;&bull;" maxlength="12">
    <p class="err" id="hqPinErr" role="alert"></p>
    <button class="btn btn-gold" type="submit" id="hqPinGo">Open the inbox</button>
  </form>
  <button class="cancel" type="button" id="hqPinCancel">Cancel</button>
</div>
<div class="inbox" id="inbox" role="dialog" aria-modal="true" aria-label="Suggestions inbox" hidden>
  <div class="inbox-wrap">
    <div class="inbox-top">
      <div><h2>Suggestions</h2><p class="sub">The community inbox</p></div>
      <div class="acts">
        <button class="iconbtn" id="hqPinChange" type="button">Change PIN</button>
        <button class="iconbtn" id="hqLock" type="button">Lock</button>
      </div>
    </div>
    <div class="tabs" id="sugTabs">
      <button data-tab="pending" class="on">Pending <span class="n" id="nPending">0</span></button>
      <button data-tab="approved">Approved <span class="n" id="nApproved">0</span></button>
      <button data-tab="declined">Declined <span class="n" id="nDeclined">0</span></button>
    </div>
    <div id="sugList"><div class="loading">Loading&hellip;</div></div>
  </div>
</div>

'''
page=head+hero+about+media+talk+prog+events+contact+close+foot+community+scripts
if MODE=="deploy":
    og_desc="A community hub for sport, stories, men&#39;s mental health, a schools program and events across NSW."
    extra=f'''<link rel="canonical" href="{SITE_URL}/">
<link rel="icon" type="image/png" sizes="64x64" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Love of the Game">
<meta property="og:title" content="Love of the Game"><meta property="og:description" content="{og_desc}">
<meta property="og:url" content="{SITE_URL}/"><meta property="og:image" content="{SITE_URL}/assets/og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Love of the Game">
<meta name="twitter:description" content="{og_desc}"><meta name="twitter:image" content="{SITE_URL}/assets/og.jpg">
'''
    ld='<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Love of the Game","url":"'+SITE_URL+'/","logo":"'+SITE_URL+'/assets/crest.webp","email":"'+MAIL+'","foundingDate":"2024","areaServed":"New South Wales, Australia","sameAs":["'+IG+'","https://www.threads.net/@loveofthegameaus","https://linktr.ee/loveofthegameaus"]}</script>\n'
    extra=extra+ld
    i=page.index("<style>")
    doc="<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"+page[:i]+extra+page[i:]
    j=doc.index("</style>")+len("</style>")
    doc=doc[:j]+"\n</head>\n<body>"+doc[j:]+"\n</body>\n</html>\n"
    (OUT/"index.html").write_text(doc)
    # favicon + apple touch: the mark on a black rounded tile
    mk=Image.open(sp/"lotg-mark-crop.png").convert("RGBA")
    for size,name in [(64,"favicon.png"),(180,"apple-touch-icon.png")]:
        im=Image.new("RGBA",(size,size),(0,0,0,0)); d=ImageDraw.Draw(im); r=int(size*0.22)
        d.rounded_rectangle((0,0,size-1,size-1),radius=r,fill=(9,9,11,255))
        m=mk.resize((int(size*0.72),int(size*0.72)),Image.LANCZOS); im.alpha_composite(m,((size-m.width)//2,(size-m.height)//2))
        im.save(OUT/name)
    # OG social card 1200x630: crest on black with a gold hairline
    og=Image.new("RGB",(1200,630),(9,9,11)); cr=Image.open(REPO/"assets"/"lotg-original.png").convert("RGBA")
    cr=cr.resize((720,int(720*cr.height/cr.width)),Image.LANCZOS); og.paste(cr,((1200-cr.width)//2,(630-cr.height)//2-10),cr)
    d=ImageDraw.Draw(og); d.rectangle((560,548,640,549),fill=(226,180,78)); og.save(OUT/"assets"/"og.jpg",quality=88)
    (OUT/"thanks.html").write_text("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Thanks — Love of the Game</title><meta name=\"robots\" content=\"noindex\"><link rel=\"icon\" type=\"image/png\" href=\"favicon.png\"><link href=\"https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Hanken+Grotesk:wght@300;400&display=swap\" rel=\"stylesheet\"><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090B;color:#F2EFE6;font:17px/1.6 'Hanken Grotesk',system-ui,sans-serif;text-align:center;padding:24px}img{height:56px}h1{font:900 clamp(30px,6vw,52px)/1 Archivo,sans-serif;letter-spacing:-.03em;margin:22px 0 10px}p{color:#9A958A;max-width:40ch;margin:0 auto}a{display:inline-block;margin-top:26px;color:#17130A;background:#E2B44E;text-decoration:none;font:700 12.5px Archivo,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:16px 24px;border-radius:2px}</style></head><body><div><img src=\"assets/mark.webp\" alt=\"\"><h1>Got it — thank you.</h1><p>We've got your message and we'll come back to you.</p><a href=\"/\">Back to Love of the Game</a></div></body></html>")
    (OUT/"robots.txt").write_text("User-agent: *\nAllow: /\n")
    (OUT/"_headers").write_text("/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n")
    (OUT/"netlify.toml").write_text('[build]\n  publish = "."\n')
    print("deploy bundle:",OUT,"index KB:",round(len(doc)/1024))
else:
    so=pathlib.Path(os.environ.get("LOTG_OUT",str(sp)))
    (so/"lotg-hero.html").write_text(page); print("final page",round(len(page)/1024),"KB")
    ov='<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    force='<style>.js .rv{opacity:1!important;transform:none!important;filter:none!important}.hero-bg img{opacity:.6!important}#court{opacity:.7!important}.glow{opacity:1!important}.wm{opacity:.045!important}.track .rail .fill{transform:none!important}.phase::before{background:var(--gold)!important;border-color:var(--gold)!important}</style>'
    (so/"rev7.html").write_text(ov+page+force)
    (so/"rev7b.html").write_text(ov+page+force+'<style>.hero,.about,.program,.events,.close,.foot{display:none!important}</style>')
    (so/"revA.html").write_text(ov+page+force+'<style>.shell{min-height:844px!important}.talk,.program,.events,.close,.foot{display:none!important}</style>')
    (so/"revB.html").write_text(ov+page+force+'<style>.hero,.about,.media{display:none!important}</style>')
    (so/"revT.html").write_text(ov+page+force+'<style>.shell{min-height:1024px!important}</style>')
