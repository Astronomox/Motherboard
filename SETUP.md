# Setup guide

This guide takes you from a fresh Windows laptop to a finished 4K video. Steps 1–4 are all you need
to render. Steps 5–8 are for changing the photos, voice, music or script.

## 1. Install the tools (once)

| Tool | Needed for | Get it |
|---|---|---|
| **Git** | Downloading the project | https://git-scm.com/download/win (keep the defaults) |
| **Node.js 20 or newer (LTS)** | Previewing and rendering | https://nodejs.org (the LTS button) |
| **Python 3.10 or newer** | Only if you regenerate the voice or music | https://www.python.org/downloads/ (tick **Add python.exe to PATH**) |

You don't need to install Chrome or ffmpeg. Remotion downloads its own copies the first time it runs.

Close and reopen your terminal after installing, then check each tool by running these lines one at
a time:

```bash
git --version
```

```bash
node --version
```

```bash
python --version
```

## 2. Download the project

```bash
git clone https://github.com/Astronomox/Motherboard.git
```

```bash
cd Motherboard
```

## 3. Install the project's packages

```bash
npm install
```

This takes a minute or two the first time.

## 4. Preview and render

Open the live preview in your browser. You can scrub through the timeline and play it with sound.

```bash
npm run studio
```

Render the 4K master. The file is written to `out/city-wakes-4k.mp4`.

```bash
npm run render:4k
```

Before a 4K render:

- Plug in the charger. On battery, the CPU slows itself down.
- Set **Settings → System → Power → Power mode** to **Best performance**.
- Close Chrome and other heavy apps.

On an i7-8650U, expect roughly 25–50 minutes for the whole video. The two other renders are:

| Command | Output |
|---|---|
| `npm run render:draft` | A 1080p version for quick checks |
| `npm run render:prores` | A 4K ProRes file, very large, for editing or colour grading |

## 5. Add your own photos (optional)

1. Shoot each part on your phone's main 1× camera, at full resolution, in daylight, with the phone
   held still. Send the original files to your computer by cable or cloud. Don't send them through
   WhatsApp, which compresses them.
2. Copy them into `public/photos/`.
3. Open `src/config.ts` and set each one's path, for example `hall: 'photos/cpu.jpg'`.

Each photo gets the blueprint look automatically, with the drawn board over it.

| Key in `config.ts` | What to photograph |
|---|---|
| `board` | The whole board from above |
| `doorbell` | The power button connector |
| `reservoir` | The battery connector |
| `station` | The VRMs: the grey chokes next to the CPU |
| `hall` | The CPU |
| `rulebook` | The BIOS chip, a small 8-pin chip |
| `desk` | The RAM |
| `warehouse` | The M.2 SSD |
| `roads` | A close-up of the copper traces |
| `gates` | The ports and the chipset area |
| `lights` | The display ribbon connector |

If you open the laptop, shut it down fully first. Then, once the bottom cover is off, unplug the
battery connector before touching anything else.

## 6. Use a different AI voice (optional)

The voice is made by Kokoro, a text-to-speech model that runs offline. The video's timing comes from
the voice: every scene is exactly as long as its line needs, so nothing is rushed.

Install the Python packages:

```bash
pip install kokoro-onnx soundfile numpy
```

Download the two model files (about 350 MB in total) into `tools/kokoro/`:

```bash
curl -L --create-dirs -o tools/kokoro/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
```

```bash
curl -L -o tools/kokoro/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

Generate the voice. This also rewrites the scene timings in `src/timeline.json`.

```bash
python tools/make_voiceover.py af_heart
```

Some voices to try:

| Voice | Sound |
|---|---|
| `af_heart` | Warm, calm American female (the default) |
| `af_bella` | Softer American female |
| `am_michael` | Calm American male |
| `bm_george` | Deep British male |

Then regenerate the music so it follows the new timing (step 7).

## 7. Regenerate the music (optional)

Run this after any change to the voice, so the beat, the blips and the "power on" hit stay in sync:

```bash
python tools/make_placeholder_music.py
```

To use real music instead, put the file in `public/audio/` and set `music` in `src/config.ts`.

## 8. Use your own voice recording (optional)

1. Record each line in a quiet room, as WAV if you can.
2. Make sure each line starts when its scene starts in `src/timeline.json`. The `voStart` times
   there say when each line begins. Lay the lines out in any audio editor, such as Audacity, which is
   free.
3. Export one file to `public/audio/`, and set `voiceover` in `src/config.ts` to its path.

If you'd rather fit the video to your recording, adjust the `start`, `end`, `voStart` and `voEnd`
times in `src/timeline.json` to match it.

## Changing a line of the script

A line appears in two places, and both must match:

- `tools/make_voiceover.py`: what the voice says, and the scene timing.
- `src/data.ts`: the on-screen captions, in the `vo` field of each stop and of the hook, city, payoff
  and end scenes.

After editing both, run steps 6 and 7 again.

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` or `node` isn't recognised | Reopen the terminal after installing Node.js. If it still fails, reinstall Node.js and keep **Add to PATH** ticked. |
| The render is very slow, or the laptop gets hot | Add `--concurrency=2` to the render command in `package.json`. |
| Fonts look wrong in the render | The first run downloads fonts from Google Fonts, so make sure you're online. |
| `python` isn't recognised | Reinstall Python with **Add python.exe to PATH** ticked, or use `py` instead of `python`. |
| The voice and visuals are out of sync | Run steps 6 and 7 again, so the voice, music and `src/timeline.json` all match. |
