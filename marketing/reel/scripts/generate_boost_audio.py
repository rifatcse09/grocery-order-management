#!/usr/bin/env python3
"""
Generate Bangla male voiceover for the 15s Facebook Boost Ad.
Voice : bn-BD-PradeepNeural (male, Bangladeshi Bengali)
Rate  : +15%  (slightly faster, energetic)
"""
import asyncio, os, json, subprocess
import edge_tts

VOICE  = "bn-BD-PradeepNeural"
RATE   = "+5%"   # slower = more natural, less robotic
PITCH  = "+0Hz"
OUTPUT = os.path.join(os.path.dirname(__file__), "../public/audio")

# All English words written in Bangla phonetics for native pronunciation
# Phase 1 (0-3s):  Hook
# Phase 2 (3-10s): Pain points
# Phase 3 (10-15s): CTA
SCRIPT = (
    "সফটওয়্যার কিনেও সমস্যা যাচ্ছে না? "
    "কাস্টমাইজেশন করা যায় না। "
    "ভ্যাট ও ট্যাক্সে সমস্যা। "
    "মাসে মাসে বেশি খরচ। "
    "লোকাল সাপোর্ট পাওয়া যায় না। "
    "ইনভ্যাটিক সফট বানায় আপনার ব্যবসার নিজস্ব কাস্টম সফটওয়্যার। "
    "আজই পেজ ফলো করুন।"
)

async def main():
    os.makedirs(OUTPUT, exist_ok=True)
    out_mp3 = os.path.join(OUTPUT, "boost_voice.mp3")

    print(f"Voice: {VOICE}  Rate: {RATE}")
    print("Generating audio…\n")

    comm = edge_tts.Communicate(SCRIPT, VOICE, rate=RATE, pitch=PITCH)
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])

    # Check duration
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_streams", out_mp3],
        capture_output=True, text=True
    )
    if r.returncode == 0:
        dur = float(json.loads(r.stdout)["streams"][0]["duration"])
        print(f"✓ Audio duration: {dur:.2f}s  (video: 15.0s)")
        if dur > 15:
            print(f"  ⚠ Audio is {dur-15:.2f}s longer than video — will trim to 15s")
        else:
            print(f"  ✓ Fits within 15s")

    print(f"\n✓ Saved: {out_mp3}")

if __name__ == "__main__":
    asyncio.run(main())
