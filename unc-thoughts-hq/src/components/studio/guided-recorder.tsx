"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, Mic, Play, Square, RefreshCw, Type, Gauge, Download } from "lucide-react";
import { cn } from "@/lib/cn";

// Phone-friendly guided recording mode. Camera/mic selection, 3s countdown,
// take counter, teleprompter with adjustable size + speed, duration timer, and
// a live audio-level meter. If browser recording is unavailable/unreliable, it
// degrades to a shot-list + teleprompter you use beside the phone's own camera.
type Device = { deviceId: string; label: string };

export function GuidedRecorder({ hook, script }: { hook?: string; script?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const [supported, setSupported] = useState(true);
  const [cams, setCams] = useState<Device[]>([]);
  const [mics, setMics] = useState<Device[]>([]);
  const [camId, setCamId] = useState<string>("");
  const [micId, setMicId] = useState<string>("");
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [takes, setTakes] = useState<{ url: string; n: number; review: boolean }[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [fontSize, setFontSize] = useState(30);
  const [speed, setSpeed] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) setSupported(false);
  }, []);

  // duration timer
  useEffect(() => {
    if (recording) {
      const id = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(id);
    }
  }, [recording]);

  // teleprompter auto-scroll
  useEffect(() => {
    if (!scrolling || speed === 0) return;
    const id = setInterval(() => {
      if (promptRef.current) promptRef.current.scrollTop += speed;
    }, 50);
    return () => clearInterval(id);
  }, [scrolling, speed]);

  const startAudioMeter = useCallback((stream: MediaStream) => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setLevel(Math.min(100, Math.round((avg / 255) * 140)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* meter is best-effort */ }
  }, []);

  const startPreview = useCallback(async () => {
    setError(null);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : { facingMode: "user" },
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      setLive(true);
      startAudioMeter(stream);
      // populate device labels (available after permission)
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCams(devices.filter((d) => d.kind === "videoinput").map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })));
      setMics(devices.filter((d) => d.kind === "audioinput").map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Mic ${i + 1}` })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access camera/mic. Use shot-list mode beside your phone's camera.");
      setSupported(false);
    }
  }, [camId, micId, startAudioMeter]);

  function startCountdownAndRecord() {
    if (!streamRef.current) return;
    setCountdown(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(id);
        beginRecording();
      }
    }, 1000);
  }

  function beginRecording() {
    if (!streamRef.current) return;
    try {
      chunksRef.current = [];
      const rec = new MediaRecorder(streamRef.current);
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "video/webm" });
        const url = URL.createObjectURL(blob);
        setTakes((t) => [...t, { url, n: t.length + 1, review: false }]);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      setScrolling(true);
    } catch {
      setError("Recording not supported here. Use shot-list mode beside your phone's camera.");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
    setScrolling(false);
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      {/* Device selectors */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label"><Camera size={12} className="inline mr-1" /> Camera</label>
          <select className="input" value={camId} onChange={(e) => setCamId(e.target.value)} disabled={recording}>
            <option value="">Default (front)</option>
            {cams.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label"><Mic size={12} className="inline mr-1" /> Microphone</label>
          <select className="input" value={micId} onChange={(e) => setMicId(e.target.value)} disabled={recording}>
            <option value="">Default</option>
            {mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="card border-warn/40 text-warn p-3 text-sm">{error}</div>}

      {/* Preview + teleprompter overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-ink-line bg-black aspect-[9/16] max-w-sm mx-auto">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        {!live && (
          <div className="absolute inset-0 grid place-items-center text-center p-4">
            <div>
              <p className="text-paper-dim text-sm mb-3">{supported ? "Camera preview" : "Camera unavailable — shot-list mode"}</p>
              {supported && <button className="btn btn-primary" onClick={startPreview}>Enable camera</button>}
            </div>
          </div>
        )}
        {/* Hook display */}
        {hook && <div className="absolute top-3 left-3 right-3 bg-black/60 rounded-lg px-3 py-2 text-sm font-medium">{hook}</div>}
        {/* Teleprompter */}
        {script && (
          <div
            ref={promptRef}
            className="absolute bottom-0 left-0 right-0 max-h-[45%] overflow-y-auto bg-gradient-to-t from-black/85 to-transparent p-4 text-center leading-snug"
            style={{ fontSize }}
          >
            <div className="whitespace-pre-wrap">{script}</div>
          </div>
        )}
        {/* Countdown */}
        {countdown > 0 && <div className="absolute inset-0 grid place-items-center bg-black/50 text-7xl font-display">{countdown}</div>}
        {/* Recording indicator + timer */}
        {recording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 rounded-full px-2.5 py-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> REC {mm}:{ss}
          </div>
        )}
      </div>

      {/* Audio level */}
      {live && (
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 text-xs text-grey mb-1"><Gauge size={12} /> Audio level {level > 92 && <span className="text-accent-soft">— easing off, don't clip</span>}</div>
          <div className="h-2 rounded-full bg-ink-line overflow-hidden">
            <div className={cn("h-full", level > 92 ? "bg-accent" : "bg-good")} style={{ width: `${level}%` }} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!recording ? (
          <button className="btn btn-primary" disabled={!live} onClick={startCountdownAndRecord}><Play size={15} /> Record (3s countdown)</button>
        ) : (
          <button className="btn btn-danger" onClick={stop}><Square size={15} /> Stop</button>
        )}
        <button className="btn" onClick={startPreview}><RefreshCw size={15} /> {live ? "Restart camera" : "Enable camera"}</button>
      </div>

      {/* Teleprompter controls */}
      <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        <label className="text-sm">
          <span className="label"><Type size={12} className="inline mr-1" /> Text size {fontSize}px</span>
          <input type="range" min={18} max={54} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm">
          <span className="label"><Gauge size={12} className="inline mr-1" /> Scroll speed {speed === 0 ? "off" : speed}</span>
          <input type="range" min={0} max={6} value={speed} onChange={(e) => { setSpeed(Number(e.target.value)); setScrolling(Number(e.target.value) > 0); }} className="w-full" />
        </label>
      </div>

      {/* Takes */}
      {takes.length > 0 && (
        <div className="max-w-lg mx-auto space-y-2">
          <div className="eyebrow">Takes ({takes.length})</div>
          {takes.map((t, i) => (
            <div key={i} className="card flex items-center justify-between gap-3 p-3">
              <span className="text-sm">Take {t.n}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs flex items-center gap-1 text-grey">
                  <input type="checkbox" checked={t.review} onChange={(e) => setTakes((xs) => xs.map((x, j) => j === i ? { ...x, review: e.target.checked } : x))} />
                  Mark for review
                </label>
                <video src={t.url} controls className="h-16 rounded" />
                <a className="btn btn-ghost p-2" href={t.url} download={`take-${t.n}.webm`} title="Save the best take"><Download size={16} /></a>
              </div>
            </div>
          ))}
          <p className="text-xs text-grey">Takes stay on this device. Download the best one and edit it in your editor (e.g. Meta Edits).</p>
        </div>
      )}
    </div>
  );
}
