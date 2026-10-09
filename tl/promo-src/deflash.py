# Replace short dark "flash" runs (screencast frames captured before the iframe repainted) with the last good frame.
import subprocess,sys,numpy as np
src,dst=sys.argv[1],sys.argv[2];W,H=1080,1920;FS=W*H*3
X0,X1,Y0,Y1=240,840,500,1600   # phone screen region
def probe():
    out=subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=r_frame_rate','-of','csv=p=0',src],capture_output=True,text=True).stdout.strip()
    n,d=out.split('/');return n+'/'+d
fps=probe()
dec=lambda:subprocess.Popen(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE,bufsize=FS*4)
# pass 1: brightness per frame
means=[];p=dec()
while True:
    b=p.stdout.read(FS)
    if len(b)<FS:break
    a=np.frombuffer(b,np.uint8).reshape(H,W,3)[Y0:Y1,X0:X1,:];means.append(float(a.mean()))
p.wait();N=len(means)
# find flash runs: sharp drop vs previous frame, <=15 frames, recovers afterwards
bad=set();i=1
while i<N:
    if means[i]<means[i-1]*0.6 and means[i-1]>12:
        base=means[i-1];j=i
        while j<N and means[j]<base*0.72 and j-i<=24:j+=1
        if 0<j-i<=24 and j<N and means[j]>=base*0.7:bad.update(range(i,j));i=j
        else:i+=1
    else:i+=1
print('frames',N,'flash frames',len(bad),'runs',sum(1 for k in bad if k-1 not in bad));print('dbg',[int(x) for x in means[660:690]],sum(1 for q in range(1,N) if means[q]<means[q-1]*0.6))
# pass 2: rewrite
p=dec();enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',fps,'-i','-','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p',dst],stdin=subprocess.PIPE)
last=None;k=0
while True:
    b=p.stdout.read(FS)
    if len(b)<FS:break
    if k in bad and last is not None:enc.stdin.write(last)
    else:enc.stdin.write(b);last=b
    k+=1
enc.stdin.close();enc.wait();p.wait();print('wrote',dst)
