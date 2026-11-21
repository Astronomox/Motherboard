"""Generate the voiceover and the video's timeline from it.

Every line is read by Kokoro (an offline neural text-to-speech model) at one calm,
unhurried speed. Nothing is sped up: each scene is made as long as its line needs,
plus a breath before and a pause after. The scene timings are written to
src/timeline.json, which the video and the music generator both read.

Outputs: public/audio/voiceover.wav and src/timeline.json
Run:     python3 tools/make_voiceover.py            (default voice: af_heart)
         python3 tools/make_voiceover.py bm_george  (any Kokoro voice name)
Then:    python3 tools/make_placeholder_music.py    (so the music follows the new timing)

Setup is in SETUP.md.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parent.parent
VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
LANG = "en-gb" if VOICE.startswith("b") else "en-us"
SPEED = 0.9  # one speed for every line; below 1.0 is slower and calmer
SR = 24000

# id, line, minimum scene length (s), breath before the line (s), pause after it (s)
SCENES = [
    # The opening: the button sits for a moment, is pressed, the click lands, then the voice.
    ("hook", "You press power. In the next two seconds, a whole city wakes up.", 5.0, 1.3, 0.9),
    ("city", "This is the city. Let's follow one electron.", 4.0, 0.4, 0.9),
    ("doorbell", "The button rings the doorbell. A tiny chip, the embedded controller, wakes up first.", 5.0, 0.5, 0.9),
    ("reservoir", "It opens the reservoir. Power flows in from the battery or charger.", 4.0, 0.4, 0.7),
    ("station", "But it is too strong. The power station steps it down to about one volt for the CPU.", 5.0, 0.4, 0.7),
    ("hall", "City hall wakes up. But it has no idea what to do.", 4.0, 0.4, 0.9),
    ("rulebook", "So it reads the rulebook. The BIOS chip holds the first instructions.", 4.0, 0.4, 0.7),
    ("desk", "Next, its desk. The RAM, where it keeps what it is working on right now.", 4.0, 0.4, 0.7),
    ("warehouse", "Then the warehouse. The SSD, where your system and files live.", 4.0, 0.4, 0.7),
    ("roads", "Everything moves on these roads. Copper lines thinner than a hair.", 5.0, 0.4, 0.8),
    ("gates", "The gates open. USB, Wi-Fi, keyboard, all connected.", 4.0, 0.4, 0.7),
    # "Lights on" needs room for the cut to the laptop screen after the connector shot.
    ("lights", "Last stop, the screen. Lights on.", 4.5, 0.4, 1.6),
    ("payoff", "All of that, in two seconds. Every time you press power.", 5.0, 0.6, 1.2),
    ("cta", "Follow for part two: why laptops die.", 3.5, 0.4, 1.0),
]

kokoro = Kokoro(str(ROOT / "tools" / "kokoro" / "kokoro-v1.0.onnx"), str(ROOT / "tools" / "kokoro" / "voices-v1.0.bin"))


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    return a[idx[0]: idx[-1] + 1] if len(idx) else a


clips, timeline, t = [], {"scenes": {}}, 0.0
for sid, text, min_len, lead, tail in SCENES:
    audio, _ = kokoro.create(text, voice=VOICE, speed=SPEED, lang=LANG)
    clip = trim(np.asarray(audio, np.float32))
    spoken = len(clip) / SR
    length = round(max(min_len, lead + spoken + tail), 2)
    timeline["scenes"][sid] = {"start": round(t, 2), "end": round(t + length, 2), "voStart": round(t + lead, 2), "voEnd": round(t + lead + spoken, 2)}
    clips.append((t + lead, clip))
    print(f"{sid:>10}  {t:5.2f}s  scene {length:4.2f}s  voice {spoken:4.2f}s  {text}")
    t += length

timeline["duration"] = round(t, 2)
timeline["voice"] = VOICE
out = np.zeros(int(np.ceil(t * SR)) + SR, np.float32)
for start, clip in clips:
    i = int(start * SR)
    out[i: i + len(clip)] += clip
out *= 10 ** (-1 / 20) / np.max(np.abs(out))

dest = ROOT / "public" / "audio" / "voiceover.wav"
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
(ROOT / "src" / "timeline.json").write_text(json.dumps(timeline, indent=2) + "\n")
print(f"total {t:.2f}s; wrote {dest} and src/timeline.json")
