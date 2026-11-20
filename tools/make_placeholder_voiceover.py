"""Generate the placeholder voiceover: public/audio/placeholder-voiceover.wav.

Each script line is synthesised with Piper (an offline text-to-speech engine) and
placed at the start of its scene, sped up if needed so it ends before the next scene.

Setup:   pip install piper-tts numpy
         python3 -m piper.download_voices en_US-ryan-high --data-dir tools/voices
Run:     python3 tools/make_placeholder_voiceover.py
"""
import io
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "tools" / "voices" / "en_US-ryan-high.onnx"
DUR = 56.0
LEAD = 0.15  # seconds after the scene starts before the line begins
GAP = 0.25  # keep this much silence before the next scene

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

voice = PiperVoice.load(str(VOICE))
SR = voice.config.sample_rate


def speak(text, length_scale):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=length_scale))
    buf.seek(0)
    with wave.open(buf) as r:
        return np.frombuffer(r.readframes(r.getnframes()), "<i2").astype(np.float32) / 32767


def trim(a, thresh=0.01):
    idx = np.where(np.abs(a) > thresh)[0]
    return a[idx[0]: idx[-1] + 1] if len(idx) else a


out = np.zeros(int(DUR * SR), np.float32)
for start, end, text in LINES:
    room = end - start - LEAD - GAP
    scale = 0.95
    clip = trim(speak(text, scale))
    for _ in range(4):  # speech time isn't exactly linear in length_scale, so converge
        if len(clip) / SR <= room:
            break
        scale *= room / (len(clip) / SR) * 0.97
        clip = trim(speak(text, scale))
    i = int((start + LEAD) * SR)
    out[i: i + len(clip)] += clip[: len(out) - i]
    print(f"{start:>4.0f}s  {len(clip) / SR:4.2f}s of {room:4.2f}s  speed x{0.95 / scale:4.2f}  {text}")

out *= 10 ** (-1 / 20) / np.max(np.abs(out))
dest = ROOT / "public" / "audio" / "placeholder-voiceover.wav"
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(f"wrote {dest}")
