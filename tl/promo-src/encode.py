import json,sys,subprocess
f=sys.argv[1];SP=float(sys.argv[2]) if len(sys.argv)>2 else 1.2
ev=json.load(open('events.json'))
sfx='/home/user/lockdown-lab-registration/assets/sfx/'
cues=[('riser',0.0,0.55),('impact',1.25,0.7)]
for e in ev:
    t=e['t']/SP
    if e['k'] in('cap','card'):cues.append(('whoosh-up',t,0.32))
    if e['k']=='card':cues.append(('impact',t+0.9,0.5))
    if e['k']=='tap':cues.append(('click',t,0.55))
    if e['k'] in('joined','leader'):cues.append(('bell',t,0.45))
    if e['k']=='outro':cues.append(('riser',t-1.2,0.45));cues.append(('impact',t+1.0,0.7))
cues=[c for c in cues if c[1]>=0]
args=['ffmpeg','-v','error','-y','-i',f];fl=[]
for i,(n,t,v) in enumerate(cues):
    args+=['-i',sfx+n+'.mp3'];fl.append(f'[{i+1}:a]volume={v},adelay={int(t*1000)}|{int(t*1000)}[s{i}]')
mix=''.join(f'[s{i}]' for i in range(len(cues)))+f'amix=inputs={len(cues)}:normalize=0:dropout_transition=0,alimiter=limit=0.9[a]'
vf=f'[0:v]setpts=PTS/{SP},fps=30,format=yuv420p[v]'
args+=['-filter_complex',';'.join(fl)+';'+mix+';'+vf,'-map','[v]','-map','[a]','-c:v','libx264','-preset','medium','-crf','20','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest','tl-promo.mp4']
print(len(cues),'cues');subprocess.run(args,check=True)
