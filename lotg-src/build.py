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

css=(sp/"premium.css").read_text()+(sp/"talk.css").read_text()
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
        <a class="txt" href="#events">Events</a>'''
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
        <a class="btn btn-ghost" href="mailto:{MAIL}">Get in touch</a>
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
        <a class="btn btn-ghost" href="mailto:{MAIL}?subject=My%20story">Reach out</a>
      </div>
    </div>
  </div>
</section>
'''
prog=(sp/"prog.html").read_text().replace('<div class="prog-head">','<div class="prog-head rv">').replace('<div class="track" id="track">','<div class="track rv dl1" id="track">').replace('<div class="forwho">','<div class="forwho rv">')
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
        <a class="btn btn-ghost" href="mailto:{MAIL}?subject=Event%20enquiry%20%E2%80%94%20Love%20of%20the%20Game">Sponsor an event</a>
      </div>
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
      <a class="btn btn-ghost" href="mailto:{MAIL}">Get in touch</a>
    </div>
  </div>
</section>
'''
foot=f'''<div class="sec foot" id="contact" role="contentinfo">
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
        <li><a href="#program">The Next Play</a></li><li><a href="#events">Community &amp; events</a></li></ul></div>
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
page=head+hero+about+media+talk+prog+events+close+foot+scripts
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
    (OUT/"robots.txt").write_text("User-agent: *\nAllow: /\n")
    (OUT/"_headers").write_text("/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n")
    (OUT/"netlify.toml").write_text('[build]\n  publish = "."\n')
    print("deploy bundle:",OUT,"index KB:",round(len(doc)/1024))
else:
    (sp/"lotg-hero.html").write_text(page); print("final page",round(len(page)/1024),"KB")
    ov='<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    force='<style>.js .rv{opacity:1!important;transform:none!important;filter:none!important}.hero-bg img{opacity:.6!important}#court{opacity:.7!important}.glow{opacity:1!important}.wm{opacity:.045!important}.track .rail .fill{transform:none!important}.phase::before{background:var(--gold)!important;border-color:var(--gold)!important}</style>'
    (sp/"rev7.html").write_text(ov+page+force)
    (sp/"rev7b.html").write_text(ov+page+force+'<style>.hero,.about,.program,.events,.close,.foot{display:none!important}</style>')
    (sp/"revA.html").write_text(ov+page+force+'<style>.shell{min-height:844px!important}.talk,.program,.events,.close,.foot{display:none!important}</style>')
    (sp/"revB.html").write_text(ov+page+force+'<style>.hero,.about,.media{display:none!important}</style>')
    (sp/"revT.html").write_text(ov+page+force+'<style>.shell{min-height:1024px!important}</style>')
