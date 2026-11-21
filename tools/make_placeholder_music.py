"""Generate the placeholder synth track: public/audio/placeholder-synth.wav.

A low synth pulse that builds across the video, a button click at the start,
a soft blip at every stop, a riser into the "power on" hit (the cut to
the laptop screen), and a fade on the end card. Run: python3 tools/make_placeholder_music.py
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 44100
# Timings follow the voiceover: run tools/make_voiceover.py first.
TL = json.loads((Path(__file__).resolve().parent.parent / "src" / "timeline.json").read_text())
S = TL["scenes"]
DUR = TL["duration"]
BPM = 120
BEAT = 60 / BPM
_l = S["lights"]
HIT = round(_l["voStart"] + 0.62 * (_l["voEnd"] - _l["voStart"]) , 3)  # matches LAPTOP_CUT in src/data.ts
STOPS = [S[k]["start"] for k in ("doorbell", "reservoir", "station", "hall", "rulebook", "desk", "warehouse", "roads", "gates", "lights")]
CITY, BASS, ARP, DRUMS, END = S["city"]["start"], S["doorbell"]["start"], S["station"]["start"], S["roads"]["start"], S["cta"]["start"]
PRESS = 28 / 30  # the button press in the hook
ARRIVE = 0.8  # the electron reaches each part 24 frames in

t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ramp(x, a, b):
    return np.clip((x - a) / (b - a), 0, 1)


def saw(freq, tt, harmonics):
    """Band-limited saw from a few harmonics: soft and warm, no filter needed."""
    y = np.zeros_like(tt)
    for k in range(1, harmonics + 1):
        y += np.sin(2 * np.pi * freq * k * tt) / k
    return y


def place(sig, start):
    i = int(start * SR)
    j = min(len(out), i + len(sig))
    if j > i:
        out[i:j] += sig[: j - i]


def env(n, attack, decay):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(attack, 1e-4)) * np.exp(-x / decay)


# Chords, one per 2-second bar: Am - F - C - G (roots for bass, triads for pad)
PROG = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]


def chord_at(sec):
    return PROG[int(sec // (BEAT * 4)) % 4]


# 1. Drone hum from the button press, swelling until the city appears
drone = (np.sin(2 * np.pi * midi(33) * t) + 0.4 * np.sin(2 * np.pi * midi(45) * t + 0.3))
out += 0.10 * drone * ramp(t, PRESS, CITY) * (1 - 0.5 * ramp(t, BASS, BASS + 4)) * (1 - ramp(t, END, DUR))

# 2. Pad: slow chords, opening up over the video
pad_level = 0.05 + 0.05 * ramp(t, BASS, HIT - 2) + 0.05 * (t >= HIT)
for bar_start in np.arange(CITY, DUR, BEAT * 4):
    _, notes = chord_at(bar_start)
    n = int(BEAT * 4 * SR) + SR // 2
    tt = np.arange(n) / SR
    e = np.minimum(1, tt / 0.6) * np.minimum(1, np.maximum(0, (n / SR - tt) / 0.5))
    sig = sum(saw(midi(m) * (1 + d), tt, 4) for m in notes for d in (-0.003, 0.003))
    i = int(bar_start * SR)
    seg = slice(i, min(len(out), i + n))
    out[seg] += (sig * e)[: seg.stop - seg.start] * pad_level[seg] * 0.18

# 3. Bass pulse on eighth notes, getting brighter
for beat in np.arange(BASS, END, BEAT / 2):
    if HIT - 0.5 <= beat < HIT:
        continue  # drop out before the hit
    root, _ = chord_at(beat)
    n = int(BEAT / 2 * SR)
    tt = np.arange(n) / SR
    bright = 3 + int(5 * min(1, (beat - BASS) / (HIT - BASS))) + (3 if beat >= HIT else 0)
    level = 0.10 + 0.07 * min(1, (beat - BASS) / (HIT - BASS)) + (0.05 if beat >= HIT else 0)
    place(saw(midi(root - 12) * 2, tt, bright) * env(n, 0.004, 0.12) * level, beat)

# 4. Arpeggio from the power station onward (sixteenths, up the chord)
for k, step in enumerate(np.arange(ARP, END, BEAT / 4)):
    if HIT - 0.5 <= step < HIT:
        continue
    _, notes = chord_at(step)
    note = (notes + [notes[0] + 12])[k % 4] + 12
    n = int(BEAT / 4 * SR)
    tt = np.arange(n) / SR
    level = 0.025 + 0.035 * min(1, (step - ARP) / (HIT - ARP)) + (0.02 if step >= HIT else 0)
    place(saw(midi(note), tt, 5) * env(n, 0.002, 0.06) * level, step)

# 5. Drums: kick from the roads scene, hats on the off-beats
for b in np.arange(DRUMS, END, BEAT):
    if HIT - 0.5 <= b < HIT:
        continue
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 45 + 110 * np.exp(-tt * 28)
    place(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.32, b)
for b in np.arange(DRUMS + BEAT / 2, END, BEAT):
    if HIT - 0.5 <= b < HIT:
        continue
    n = int(0.06 * SR)
    noise = rng.standard_normal(n)
    hp = noise - np.concatenate([[0], noise[:-1]])  # crude high-pass
    place(hp * env(n, 0.001, 0.015) * 0.05, b)

# 6. Button click at the press, and a soft blip at every stop
n = int(0.03 * SR)
place(rng.standard_normal(n) * env(n, 0.0005, 0.004) * 0.5, PRESS)
place(np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, 0.0005, 0.006) * 0.3, PRESS)
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for s, m in zip(STOPS, PENTA):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    place((np.sin(2 * np.pi * midi(m) * tt) + 0.3 * np.sin(2 * np.pi * midi(m + 12) * tt)) * env(n, 0.003, 0.14) * 0.09, s + ARRIVE)

# 7. Riser into the hit: noise swell plus a rising tone
rs, re_ = HIT - 4.0, HIT
n = int((re_ - rs) * SR)
tt = np.arange(n) / SR
x = tt / (re_ - rs)
noise = rng.standard_normal(n)
smooth = np.convolve(noise, np.ones(6) / 6, mode="same")
tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * x ** 2) / SR)
place((smooth * 0.10 + tone * 0.05) * x ** 2.2, rs)

# 8. The "power on" hit: sub boom, whoosh, and a bright stab
n = int(2.6 * SR)
tt = np.arange(n) / SR
f = 32 + 90 * np.exp(-tt * 12)
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6) * 0.7
whoosh = rng.standard_normal(n)
whoosh = np.convolve(whoosh, np.ones(10) / 10, mode="same") * np.exp(-tt * 3.5) * 0.25
_, notes = chord_at(HIT)
stab = sum(saw(midi(m + 12), tt, 6) for m in notes) * env(n, 0.002, 0.5) * 0.06
place(boom + whoosh + stab, HIT)

# Master: overall fade out, soft clip, normalise to -1 dBFS
out *= 1 - ramp(t, END + 0.5, DUR)
out *= np.minimum(1, t / 0.02)
out = np.tanh(out * 1.3)
out *= 10 ** (-1 / 20) / np.max(np.abs(out))

dest = Path(__file__).resolve().parent.parent / "public" / "audio" / "placeholder-synth.wav"
with wave.open(str(dest), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(f"wrote {dest} ({DUR:.1f}s, hit at {HIT:.2f}s)")
