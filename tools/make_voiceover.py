"""Generate the voiceover: public/audio/voiceover.wav.

Each script line is read by Kokoro (an offline neural text-to-speech model) in a calm,
warm voice, and placed at the start of its scene. A line is only sped up if it would
run into the next scene.

Setup:   pip install kokoro-onnx soundfile numpy
         Download kokoro-v1.0.onnx and voices-v1.0.bin into tools/kokoro/ from
         https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Run:     python3 tools/make_voiceover.py            (default voice: af_heart)
         python3 tools/make_voiceover.py bm_george  (any Kokoro voice name)
"""
import wave
from pathlib import Path

import numpy as np
import sys

from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
LANG = "en-gb" if VOICE.startswith("b") else "en-us"
CALM = 0.92  # below 1.0 is slower and calmer
DUR = 56.0
LEAD = 0.15  # seconds after the scene starts before the line begins
GAP = 0.2  # keep this much silence before the next scene

# (start, end, line) in seconds. Matches SCENES in src/data.ts.
LINES = [
    (0, 3, "You press power. In the next two seconds, a whole city wakes up."),
    (3, 6, "This is the city. Let's follow one electron."),
    (6, 10, "The button rings the doorbell. A tiny chip, the embedded controller, wakes up first."),
    (10, 14, "It opens the reservoir. Power flows in from the battery or charger."),
    (14, 19, "But it is too strong. The power station steps it down to about one volt for the CPU."),
    (19, 23, "City hall wakes up. But it has no idea what to do."),
    (23, 27, "So it reads the rulebook. The BIOS chip holds the first instructions."),
    (27, 31, "Next, its desk. The RAM, where it keeps what it is working on right now."),
    (31, 35, "Then the warehouse. The SSD, where your system and files live."),
    (35, 40, "Everything moves on these roads. Copper lines thinner than a hair."),
    (40, 44, "The gates open. USB, Wi-Fi, keyboard, all connected."),
    (44, 48, "Last stop, the screen. Lights on."),
    (48, 53, "All of that, in two seconds. Every time you press power."),
    (53, 56, "Follow for part two: why laptops die."),
]

kokoro = Kokoro(str(ROOT / "tools" / "kokoro" / "kokoro-v1.0.onnx"), str(ROOT / "tools" / "kokoro" / "voices-v1.0.bin"))
SR = 24000


def speak(text, speed):
    audio, _ = kokoro.create(text, voice=VOICE, speed=speed, lang=LANG)
    return np.asarray(audio, np.float32)


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    return a[idx[0]: idx[-1] + 1] if len(idx) else a


out = np.zeros(int(DUR * SR), np.float32)
for start, end, text in LINES:
    room = end - start - LEAD - GAP
    speed = CALM
    clip = trim(speak(text, speed))
    for _ in range(4):  # speech time isn't exactly linear in speed, so converge
        if len(clip) / SR <= room:
            break
        speed *= (len(clip) / SR) / room * 1.03
        clip = trim(speak(text, speed))
    i = int((start + LEAD) * SR)
    out[i: i + len(clip)] += clip[: len(out) - i]
    print(f"{start:>4.0f}s  {len(clip) / SR:4.2f}s of {room:4.2f}s  speed x{speed:4.2f}  {text}")

out *= 10 ** (-1 / 20) / np.max(np.abs(out))
dest = ROOT / "public" / "audio" / "voiceover.wav"
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(f"wrote {dest}")
