#!/usr/bin/env python3
"""
Build 15s Facebook boost video from v2 carousel images.
Transitions : crossfade (fade) between slides
Audio       : background music only (no voice)
Output      : 1080x1080, 30fps, H.264
"""
import subprocess, os, sys, json

ASSETS = "/home/rifat/.cursor/projects/var-www-grocery-order-management/assets"
OUT    = "/var/www/grocery-order-management/marketing/reel/out"
MUSIC  = "/var/www/grocery-order-management/marketing/reel/public/audio/bg_music.mp3"

SLIDES = [
    f"{ASSETS}/v2_slide1.png",
    f"{ASSETS}/v2_slide2.png",
    f"{ASSETS}/v2_slide3.png",
    f"{ASSETS}/v2_slide4.png",
    f"{ASSETS}/v2_slide5.png",
]

FPS       = 30
SLIDE_DUR = 3.2     # seconds per slide
FADE_DUR  = 0.6     # crossfade duration
N         = len(SLIDES)
FRAMES    = int(SLIDE_DUR * FPS)
INPUT_DUR = SLIDE_DUR + 1.0
TOTAL_DUR = round(N * SLIDE_DUR - (N - 1) * FADE_DUR, 2)

print(f"Slides: {N} | Each: {SLIDE_DUR}s | Fade: {FADE_DUR}s | Total: {TOTAL_DUR}s")

# ── Inputs ────────────────────────────────────────────────────────────────────
inputs = []
for s in SLIDES:
    inputs += ["-loop", "1", "-t", str(INPUT_DUR), "-i", s]

# ── Filter complex ─────────────────────────────────────────────────────────
parts = []

# Scale each image to fit inside 1080x1080, pad white, gentle zoom
for i in range(N):
    parts.append(
        f"[{i}:v]"
        f"scale=1080:1080:force_original_aspect_ratio=decrease,"
        f"pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=white,"
        f"zoompan=z='min(zoom+0.0003,1.04)'"
        f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={FRAMES}:s=1080x1080:fps={FPS},"
        f"trim=duration={SLIDE_DUR},setsar=1[v{i}]"
    )

# Chain crossfade transitions
prev = "v0"
for i in range(1, N):
    offset    = round((SLIDE_DUR - FADE_DUR) * i, 2)
    out_label = f"x{i}" if i < N - 1 else "vout"
    parts.append(
        f"[{prev}][v{i}]xfade=transition=fade"
        f":duration={FADE_DUR}:offset={offset}[{out_label}]"
    )
    prev = out_label

filter_str = ";".join(parts)

# ── Step 1: Silent video ──────────────────────────────────────────────────────
silent = os.path.join(OUT, "fade-silent.mp4")
cmd = [
    "ffmpeg", "-y",
    *inputs,
    "-filter_complex", filter_str,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-r", str(FPS),
    silent
]
print("\n▶ Rendering fade video…")
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print("ERROR:", r.stderr[-3000:]); sys.exit(1)
print(f"✓ Silent: {silent}")

# ── Step 2: Add background music (fade out at end) ────────────────────────────
final = os.path.join(OUT, "fb-boost-fade-music.mp4")
audio_filter = (
    f"[1:a]atrim=duration={TOTAL_DUR},"
    f"volume=-12dB,"
    f"afade=t=in:st=0:d=1.0,"
    f"afade=t=out:st={TOTAL_DUR - 1.5}:d=1.5[aout]"
)
cmd2 = [
    "ffmpeg", "-y",
    "-i", silent,
    "-i", MUSIC,
    "-filter_complex", audio_filter,
    "-map", "0:v:0",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    final
]
print("▶ Adding background music…")
r2 = subprocess.run(cmd2, capture_output=True, text=True)
if r2.returncode != 0:
    print("ERROR:", r2.stderr[-2000:]); sys.exit(1)
print(f"✓ Final: {final}")

# ── Report ────────────────────────────────────────────────────────────────────
probe = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json",
     "-show_streams", final],
    capture_output=True, text=True
)
for s in json.loads(probe.stdout)["streams"]:
    if s["codec_type"] == "video":
        print(f"\nVideo : {s['width']}x{s['height']} | {float(s['duration']):.1f}s | {s['r_frame_rate']} fps")
    elif s["codec_type"] == "audio":
        print(f"Audio : {s['codec_name']} | background music only")

# cleanup silent temp
os.remove(silent)
print("\n✓ Done — ready to upload to Facebook!")
