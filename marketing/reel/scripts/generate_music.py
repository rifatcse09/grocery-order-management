#!/usr/bin/env python3
"""
Generate a modern social-media promotional music track.

Style : Digital corporate / tech-positive — the kind of track you hear
        on professional Facebook/Instagram promotional reels
Key   : G major (bright, uplifting)
BPM   : 105  (energetic but not rushed)
Chord : G  Em  C  D  (classic uplifting progression)

Sound palette (no rock drums — feels modern and digital):
  • Synth pad       : warm sine-based chords, slow attack
  • Marimba lead    : triangle wave, fast decay — positive & digital feel
  • Pentatonic arp  : quick bright notes filling gaps
  • Punchy clap     : white-noise burst on beats 2 & 4
  • Shaker          : 16th-note hi-freq noise with swing
  • Sub-bass        : smooth sine bass on roots
  • Notification ping : short bell sound on section transitions (techy feel)
  • Whoosh rise     : into chorus and CTA

Structure (44s total):
  0-4s   : Intro    — pad only, very soft
  4-14s  : Verse    — pad + marimba melody, pain points screen
  14-28s : Chorus   — full arrangement, chat demo
  28-35s : CTA swell — big feel
  35-44s : Outro    — fade
"""

import math, wave, struct, subprocess, os, random

SR       = 44100
BPM      = 105
BEAT     = SR * 60 / BPM
BAR      = int(BEAT * 4)
DURATION = 44
TOTAL    = int(SR * DURATION)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../public/audio")
TEMP_WAV   = os.path.join(OUTPUT_DIR, "_bg_temp.wav")
OUTPUT_MP3 = os.path.join(OUTPUT_DIR, "bg_music.mp3")

rng = random.Random(7)

# ─── Frequency helpers ────────────────────────────────────────────────────────
def hz(midi_n): return 440.0 * 2 ** ((midi_n - 69) / 12)

# G major notes
G3=hz(55); B3=hz(59); D4=hz(62); E4=hz(64); G4=hz(67)
A4=hz(69); B4=hz(71); C5=hz(72); D5=hz(74); E5=hz(76); G5=hz(79)
G2=hz(43); E2=hz(40); C3=hz(48); D3=hz(50)
C4=hz(60); A3=hz(57); F4=hz(66)

# Chord voicings [root, 3rd, 5th, octave]
CHORDS = {
    'G':  [G2, G3, B3, D4, G4],
    'Em': [E2, G3, B3, E4, G4],
    'C':  [C3, G3, C4, E4, G4],
    'D':  [D3, A3, D4, F4, A4],
}
PROG = ['G', 'Em', 'C', 'D']   # 4 bars, repeat

# Pentatonic melody (G major penta: G A B D E)
PENTA = [G4, A4, B4, D5, E5, G5]
MELODY = [
    (G4, 1.0), (B4, 0.5), (D5, 0.5), (E5, 1.0), (D5, 1.0),
    (B4, 0.5), (G4, 0.5), (A4, 2.0),
    (D5, 1.0), (E5, 0.5), (G5, 0.5), (E5, 1.0), (D5, 1.0),
    (B4, 1.5), (G4, 0.5),
]

# ─── Waveforms ────────────────────────────────────────────────────────────────
def sine(f, t):     return math.sin(2*math.pi*f*t)
def triangle(f, t):
    p = (f*t) % 1.0; return 4*abs(p-0.5)-1.0
def noise():        return rng.uniform(-1.0, 1.0)

# ─── ADSR ─────────────────────────────────────────────────────────────────────
def adsr(pos, dur, a=0.01, d=0.06, s=0.70, r=0.10):
    if pos < a:            return pos/a
    if pos < a+d:          return 1-(1-s)*(pos-a)/d
    if pos < max(a+d, dur-r): return s
    if pos < dur:          return s*(dur-pos)/r
    return 0.0

# ─── Main buffer ─────────────────────────────────────────────────────────────
buf = [0.0]*TOTAL

def mix(start, samps, vol=1.0):
    for i, s in enumerate(samps):
        idx = start+i
        if 0<=idx<TOTAL: buf[idx] += s*vol

# ─── SECTION MARKERS ─────────────────────────────────────────────────────────
T_VERSE  = int(4*SR)
T_CHORUS = int(14*SR)
T_CTA    = int(28*SR)
T_OUTRO  = int(35*SR)

def section_vol(pos):
    """Master volume ramp per section."""
    if pos < T_VERSE:     return 0.45 * (pos/T_VERSE)          # intro ramp up
    if pos < T_CHORUS:    return 0.60                            # verse
    if pos < T_CTA:       return 0.85                            # chorus full
    if pos < T_OUTRO:     return 1.00                            # CTA swell
    return max(0.0, (TOTAL-pos)/(TOTAL-T_OUTRO))                 # fade out

# ─── 1. PAD (whole video) ──────────────────────────────────────────────────────
bar_idx = 0
t_pos   = 0
while t_pos < TOTAL:
    chord_key = PROG[bar_idx % 4]
    notes     = CHORDS[chord_key]
    dur       = BAR + int(0.3*SR)     # slight overlap
    samp      = [0.0]*dur
    for n in notes:
        for i in range(dur):
            t   = i/SR
            env = adsr(t, dur/SR, a=0.18, d=0.12, s=0.60, r=0.35)
            samp[i] += (sine(n,t)*0.55 + sine(n*2,t)*0.10) * env / len(notes)
    for i, s in enumerate(samp):
        idx = t_pos+i
        if 0<=idx<TOTAL:
            buf[idx] += s * 0.28 * section_vol(idx)
    t_pos  += BAR
    bar_idx += 1

# ─── 2. MARIMBA MELODY (verse + chorus) ───────────────────────────────────────
mel_pos = T_VERSE
for rep in range(4):
    for (pitch, beats) in MELODY:
        n_samp = int(beats*BEAT)
        samp   = [0.0]*n_samp
        for i in range(n_samp):
            t   = i/SR
            # Marimba = triangle + quick exponential decay
            env = math.exp(-t*14) + 0.08*adsr(t, n_samp/SR, a=0.002, d=0.03, s=0.1, r=0.05)
            samp[i] = (triangle(pitch,t)*0.65 + sine(pitch,t)*0.35) * env
        vol = 0.22 if rep < 1 else (0.30 if rep < 3 else 0.26)
        for i, s in enumerate(samp):
            idx = mel_pos+i
            if 0<=idx<TOTAL:
                buf[idx] += s * vol * section_vol(idx)
        mel_pos += n_samp

# ─── 3. PENTATONIC ARP (chorus only, 16th notes) ─────────────────────────────
arp_pos = T_CHORUS
arp_i   = 0
sixteenth = int(BEAT/4)
while arp_pos < T_OUTRO:
    pitch = PENTA[arp_i % len(PENTA)]
    dur   = int(sixteenth*0.75)
    samp  = [0.0]*dur
    for i in range(dur):
        t   = i/SR
        env = math.exp(-t*22)
        samp[i] = sine(pitch*2, t)*env + triangle(pitch,t)*env*0.4
    for i, s in enumerate(samp):
        idx = arp_pos+i
        if 0<=idx<TOTAL:
            buf[idx] += s * 0.14 * section_vol(idx)
    arp_pos += sixteenth
    arp_i   += 1

# ─── 4. SUB-BASS (verse + chorus) ─────────────────────────────────────────────
BASS_ROOTS = {'G': G2, 'Em': E2, 'C': C3, 'D': D3}
bar_idx, t_pos = 0, T_VERSE
while t_pos < TOTAL:
    root = BASS_ROOTS[PROG[bar_idx%4]]
    # Beat 1
    for b_off in [0, int(BEAT*1.5), int(BEAT*2), int(BEAT*3.5)]:
        st  = t_pos + b_off
        dur = int(BEAT*0.85)
        samp= [0.0]*dur
        for i in range(dur):
            t   = i/SR
            env = adsr(t, dur/SR, a=0.004, d=0.06, s=0.55, r=0.10)
            samp[i] = sine(root,t)*env + sine(root*2,t)*env*0.15
        for i, s in enumerate(samp):
            idx = st+i
            if 0<=idx<TOTAL:
                buf[idx] += s * 0.38 * section_vol(idx)
    t_pos  += BAR
    bar_idx += 1

# ─── 5. CLAP (beats 2+4, from verse) ─────────────────────────────────────────
t_pos = T_VERSE
while t_pos < TOTAL:
    for b_off in [int(BEAT), int(BEAT*3)]:
        st  = t_pos + b_off
        dur = int(SR*0.09)
        samp= [0.0]*dur
        for i in range(dur):
            t   = i/SR
            env = math.exp(-t*38) + 0.15*math.exp(-t*12)
            samp[i] = noise()*env
        for i, s in enumerate(samp):
            idx = st+i
            if 0<=idx<TOTAL:
                buf[idx] += s * 0.32 * section_vol(idx)
    t_pos += BAR

# ─── 6. SHAKER (16th-note, from verse, swings slightly) ──────────────────────
t_pos = T_VERSE
while t_pos < TOTAL:
    for sub in range(16):
        swing = int(0.018*BEAT) if sub%2==1 else 0
        st    = t_pos + int(sub*BEAT/4) + swing
        dur   = int(SR*0.045)
        samp  = [0.0]*dur
        for i in range(dur):
            t   = i/SR
            env = math.exp(-t*55)
            # high-freq filtered noise (simulate shaker)
            samp[i] = noise()*env * math.sin(2*math.pi*8000*t) * 2
        vol = 0.10 if sub%4==0 else 0.055
        for i, s in enumerate(samp):
            idx = st+i
            if 0<=idx<TOTAL:
                buf[idx] += s * vol * section_vol(idx)
    t_pos += BAR

# ─── 7. NOTIFICATION PING (section transitions: 4s, 14s, 28s) ───────────────
for t_event in [T_VERSE, T_CHORUS, T_CTA]:
    dur  = int(SR*0.5)
    samp = [0.0]*dur
    ping_freq = 1760  # A6 — bright notification bell
    for i in range(dur):
        t   = i/SR
        env = math.exp(-t*9)
        samp[i] = (sine(ping_freq,t)*0.7 + sine(ping_freq*2,t)*0.2) * env
    mix(t_event, samp, vol=0.18)

# ─── 8. WHOOSH RISE (into chorus at 14s) ──────────────────────────────────────
whoosh_start = T_CHORUS - int(SR*1.0)
dur          = int(SR*1.2)
samp         = [0.0]*dur
for i in range(dur):
    t    = i/SR
    freq = 200 + 3200*(t/1.2)**2    # rising sweep
    env  = (t/1.2)**1.5
    samp[i] = noise()*0.4*env + sine(freq,t)*0.3*env
mix(whoosh_start, samp, vol=0.22)

# ─── GLOBAL ENVELOPE: fade-in (0-1s), fade-out (last 3s) ────────────────────
for i in range(TOTAL):
    t = i/SR
    if t < 1.0:
        buf[i] *= t
    if t > DURATION-3:
        buf[i] *= max(0.0,(DURATION-t)/3)

# ─── REVERB (short room reverb) ───────────────────────────────────────────────
print("Applying reverb…")
delay  = int(0.08*SR)
decay  = 0.28
out    = list(buf)
for i in range(delay, TOTAL):
    out[i] += buf[i-delay]*decay*0.20
buf = out

# ─── NORMALIZE & WRITE ────────────────────────────────────────────────────────
peak  = max(abs(x) for x in buf)
scale = 0.80/peak if peak>0 else 1.0
print(f"Peak: {peak:.4f}  Scale ×{scale:.3f}")

os.makedirs(OUTPUT_DIR, exist_ok=True)
i16 = [int(max(-32768,min(32767, x*scale*32767))) for x in buf]

with wave.open(TEMP_WAV,"w") as wf:
    wf.setnchannels(1); wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(struct.pack(f"<{len(i16)}h",*i16))

print("Converting to MP3…")
r = subprocess.run(
    ["ffmpeg","-y","-i",TEMP_WAV,"-codec:a","libmp3lame",
     "-b:a","192k","-ar","44100",OUTPUT_MP3],
    capture_output=True, text=True)
if r.returncode!=0:
    print(r.stderr[-400:]); raise SystemExit(1)
os.remove(TEMP_WAV)

size = os.path.getsize(OUTPUT_MP3)/1024
print(f"\n✓ {OUTPUT_MP3}  ({size:.0f} KB, {DURATION}s)")
print("  Style: digital-corporate promo  |  BPM: 105  |  Key: G major")
print("  Layers: pad + marimba + arp + sub-bass + clap + shaker + ping + whoosh")
