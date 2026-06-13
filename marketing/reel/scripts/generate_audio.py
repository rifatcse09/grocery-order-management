#!/usr/bin/env python3
"""
Generate Bangla voiceover + sentence-boundary timing for subtitle sync.

Voice  : bn-BD-PradeepNeural  (male, Bangladeshi Bengali)
Rate   : +22%   (faster, trendy energy)
Pitch  : +0Hz   (natural male pitch)

Outputs:
  public/audio/narration_full.mp3      ← voice audio
  public/audio/narration_timing.json   ← sentence start/end frames for NarrationBar
"""
import asyncio, os, json, subprocess
import edge_tts

VOICE = "bn-BD-PradeepNeural"
RATE  = "+22%"
PITCH = "+0Hz"
FPS   = 30
OUTPUT = os.path.join(os.path.dirname(__file__), "../public/audio")

# Each line = one sentence boundary that edge-tts will report
NARRATION_LINES = [
    "ইনভাটিক সফট নিয়ে আসছে আপনার ব্যবসার জন্য এ আই বট!",
    "আপনিও কি এই সমস্যায় আছেন?",
    "রাতে রিপ্লাই নেই, কাস্টমার চলে যায়।",
    "ম্যানুয়াল অর্ডারে সময় নষ্ট।",
    "দেরিতে বিক্রি কমে যায়।",
    "একই প্রশ্নে বারবার উত্তর দিতে হয়।",
    "আমাদের এ আই বট চব্বিশ ঘণ্টা এই সব সমাধান করে।",
    "দেখুন কীভাবে বট রিপ্লাই দেয়, পণ্য দেখায়, অর্ডার নেয়, কনফার্ম করে।",
    "কোনো মানুষ লাগেনি, সম্পূর্ণ অটোমেটিক!",
    "আমাদের বট আপনার দোকানের হয়ে দিনরাত কাজ করে।",
    "বিক্রি বাড়ান, সময় বাঁচান, ঝামেলা কমান।",
    "এটা সম্পূর্ণ অটোমেটিক সিস্টেম।",
    "আমরা সমাধান করি চব্বিশ ঘণ্টা রিপ্লাই, ম্যানুয়াল অর্ডার এবং কাস্টমার ধরে রাখা।",
    "আজই আমাদের ডিএম করুন, ইনভাটিক সফট এ আই বট শুরু করুন।",
]

FULL_NARRATION = "\n".join(NARRATION_LINES)

async def main():
    os.makedirs(OUTPUT, exist_ok=True)
    out_mp3  = os.path.join(OUTPUT, "narration_full.mp3")
    out_json = os.path.join(OUTPUT, "narration_timing.json")

    print(f"Voice: {VOICE}  Rate: {RATE}  Pitch: {PITCH}")
    print("Streaming audio + sentence boundaries…\n")

    comm      = edge_tts.Communicate(FULL_NARRATION, VOICE, rate=RATE, pitch=PITCH)
    sentences = []   # {text, start_s, end_s, start_frame, end_frame}

    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                start_s = chunk["offset"]   / 10_000_000
                dur_s   = chunk["duration"] / 10_000_000
                end_s   = start_s + dur_s
                sentences.append({
                    "text":        chunk["text"],
                    "start_s":     round(start_s, 3),
                    "end_s":       round(end_s,   3),
                    "start_frame": round(start_s * FPS),
                    "end_frame":   round(end_s   * FPS),
                })

    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)

    # ── Report ────────────────────────────────────────────────────────────────
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", out_mp3],
        capture_output=True, text=True
    )
    if r.returncode == 0:
        dur = float(json.loads(r.stdout)["streams"][0]["duration"])
        print(f"✓ Audio: {dur:.2f}s ({dur*FPS:.0f} frames)  | Video: 41.3s (1240 frames)\n")

    print("─── Sentence timings (copy into NARRATIONS if desired) ───────────")
    for s in sentences:
        print(f"  f{s['start_frame']:4d}–f{s['end_frame']:4d}  ({s['start_s']:.2f}s–{s['end_s']:.2f}s)  {s['text'][:70]}")

    print(f"\n✓ Saved: {out_json}")

if __name__ == "__main__":
    asyncio.run(main())
