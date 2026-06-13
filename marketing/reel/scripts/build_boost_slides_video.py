#!/usr/bin/env python3
"""
Build a 15–18s paid boost video from the 5 carousel images.
Each slide: 3.5s with slow Ken Burns zoom-in.
Transitions: 0.5s slide-left between slides.
Output: 1080x1080, 30fps, H.264.
"""
import subprocess, os, sys

ASSETS = "/home/rifat/.cursor/projects/var-www-grocery-order-management/assets"
OUT    = "/var/www/grocery-order-management/marketing/reel/out"
AUDIO  = "/var/www/grocery-order-management/marketing/reel/public/audio/boost_voice.mp3"
MUSIC  = "/var/www/grocery-order-management/marketing/reel/public/audio/bg_music.mp3"

SLIDES = [
    f"{ASSETS}/final_slide1_hook_1080.png",
    f"{ASSETS}/final_slide2_customization_1080.png",
    f"{ASSETS}/final_slide3_vat_1080.png",
    f"{ASSETS}/style2_slide4_cost_support_1080.png",
    f"{ASSETS}/final_slide5_cta_1080.png",
]

FPS        = 30
SLIDE_DUR  = 3.5   # seconds each slide shows
TRANS_DUR  = 0.5   # crossfade transition length
N          = len(SLIDES)
FRAMES     = int(SLIDE_DUR * FPS)   # 105 frames
INPUT_DUR  = SLIDE_DUR + 1.0

total_dur  = N * SLIDE_DUR - (N - 1) * TRANS_DUR
print(f"Slides: {N}  |  Duration: {total_dur:.1f}s  |  FPS: {FPS}")

# ── Build FFmpeg command ──────────────────────────────────────────────────────
inputs = []
for s in SLIDES:
    inputs += ["-loop", "1", "-t", str(INPUT_DUR), "-i", s]

# Build filter_complex
parts = []

# 1. Scale each image to exactly 1080x1080 (no crop, no zoom distortion)
#    Then apply a very subtle 1.0→1.03 zoom so full image always visible
for i in range(N):
    zoom_expr = f"'min(zoom+0.00028,1.03)'"   # max 3% zoom — almost invisible
    x_expr    = "'iw/2-(iw/zoom/2)'"
    y_expr    = "'ih/2-(ih/zoom/2)'"
    parts.append(
        f"[{i}:v]scale=1080:1080:force_original_aspect_ratio=decrease,"
        f"pad=1080:1080:(ow-iw)/2:(oh-ih)/2:white,"
        f"zoompan=z={zoom_expr}:x={x_expr}:y={y_expr}"
        f":d={FRAMES}:s=1080x1080:fps={FPS},trim=duration={SLIDE_DUR},setsar=1[v{i}]"
    )

# 2. Chain xfade (slideleft) transitions
prev = "v0"
for i in range(1, N):
    offset    = round((SLIDE_DUR - TRANS_DUR) * i, 1)
    out_label = f"x{i}" if i < N - 1 else "vout"
    parts.append(
        f"[{prev}][v{i}]xfade=transition=slideleft"
        f":duration={TRANS_DUR}:offset={offset}[{out_label}]"
    )
    prev = out_label

filter_complex = ";".join(parts)

# ── Step 1: Build silent video ────────────────────────────────────────────────
silent_out = os.path.join(OUT, "fb-boost-slides-silent.mp4")
cmd_video = [
    "ffmpeg", "-y",
    *inputs,
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-r", str(FPS),
    silent_out
]

print("\n▶ Rendering slideshow video…")
r = subprocess.run(cmd_video, capture_output=True, text=True)
if r.returncode != 0:
    print("ERROR (video):", r.stderr[-3000:])
    sys.exit(1)
print(f"✓ Silent video: {silent_out}")

# ── Step 2: Mix voice + background music, merge with video ───────────────────
final_out = os.path.join(OUT, "fb-boost-slides-with-voice.mp4")

# voice: +10dB boost for clarity
# music: trimmed to video length, -18dB (soft background)
# amix: blend voice + music, voice stays dominant
audio_filter = (
    f"[1:a]volume=10dB[voice];"
    f"[2:a]atrim=duration={total_dur},volume=-18dB,afade=t=out:st={total_dur-1.5}:d=1.5[music];"
    f"[voice][music]amix=inputs=2:duration=first:dropout_transition=0[aout]"
)

cmd_audio = [
    "ffmpeg", "-y",
    "-i", silent_out,
    "-i", AUDIO,
    "-i", MUSIC,
    "-filter_complex", audio_filter,
    "-map", "0:v:0",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    final_out
]

print("▶ Merging voice + background music…")
r2 = subprocess.run(cmd_audio, capture_output=True, text=True)
if r2.returncode != 0:
    print("ERROR (audio):", r2.stderr[-2000:])
    sys.exit(1)
print(f"✓ Final video (voice + music): {final_out}")

# ── Report ───────────────────────────────────────────────────────────────────
r3 = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", final_out],
    capture_output=True, text=True
)
import json
streams = json.loads(r3.stdout)["streams"]
for s in streams:
    if s["codec_type"] == "video":
        print(f"\nVideo : {s['width']}x{s['height']} | {float(s['duration']):.1f}s | {s['r_frame_rate']} fps")
    elif s["codec_type"] == "audio":
        print(f"Audio : {s['codec_name']} | {s['channels']}ch | {s['sample_rate']}Hz")
