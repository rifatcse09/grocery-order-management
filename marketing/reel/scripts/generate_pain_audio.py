#!/usr/bin/env python3
"""
Voiceover for the 34-second FbPainVideo.
All English words written in Bangla phonetics for native pronunciation.
"""
import asyncio, os, json, subprocess
import edge_tts

VOICE  = "bn-BD-PradeepNeural"
RATE   = "+5%"
PITCH  = "+0Hz"
OUTPUT = os.path.join(os.path.dirname(__file__), "../public/audio")

SCRIPT = (
    # Slide 1 — Hook (0–4s)
    "সফটওয়্যার কিনেও কি আপনার ব্যবসার সমস্যা পুরোপুরি সমাধান হচ্ছে না? "
    "আপনি একা নন। "

    # Slide 2 — Context (4–9s)
    "বাংলাদেশের অনেক ব্যবসা ট্যালি, কুইকবুকস, ওডু, ইআরপি বা পয়েন্ট অব সেল সফটওয়্যার ব্যবহার করছে। "
    "কিন্তু তারপরও সমস্যা থেকেই যাচ্ছে। "

    # Pain points (9–27s) — each short and punchy
    "ব্যবসার প্রক্রিয়ার সাথে সফটওয়্যার পুরোপুরি মেলে না। "
    "দরকারি ফিচার নেই, অথচ অপ্রয়োজনীয় ফিচারে ভরা। "
    "বাংলাদেশের ভ্যাট ও ট্যাক্স নিয়মের সাথে সামঞ্জস্য নেই। "
    "কাস্টমাইজ করতে গেলে অতিরিক্ত খরচ। "
    "লোকাল সাপোর্ট পাওয়া যায় না। "
    "ব্যবসা বড় হলে নতুন চাহিদা পূরণ করতে পারে না। "

    # Result (27–31s)
    "ফলাফল? ব্যবসা সফটওয়্যারের সাথে মানিয়ে নিতে বাধ্য হয়। "
    "অথচ সফটওয়্যারের কাজ হওয়া উচিত ব্যবসার সাথে মানিয়ে নেওয়া। "

    # CTA (31–34s)
    "আপনার সমস্যাটি কমেন্টে জানান। "
    "ইনভাটিক সফট পেজটি ফলো করুন।"
)

async def main():
    os.makedirs(OUTPUT, exist_ok=True)
    out_mp3 = os.path.join(OUTPUT, "pain_voice.mp3")

    print(f"Voice: {VOICE}  Rate: {RATE}")
    print("Generating voiceover…\n")

    comm = edge_tts.Communicate(SCRIPT, VOICE, rate=RATE, pitch=PITCH)
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])

    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_streams", out_mp3],
        capture_output=True, text=True
    )
    if r.returncode == 0:
        dur = float(json.loads(r.stdout)["streams"][0]["duration"])
        video_dur = 34.0
        print(f"✓ Audio: {dur:.2f}s  | Video: {video_dur}s")
        if dur > video_dur:
            print(f"  ⚠ Audio {dur - video_dur:.2f}s over — will use -shortest to trim")
        else:
            print(f"  ✓ Fits within video duration")
    print(f"\n✓ Saved: {out_mp3}")

if __name__ == "__main__":
    asyncio.run(main())
