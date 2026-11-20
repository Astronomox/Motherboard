// Drop your files into /public and put their paths here. Leave null to use the drawn board.
//
// Photos: shoot on the main 1x camera, full resolution, in daylight, phone held still.
// Put them in public/photos/ and write e.g. 'photos/cpu.jpg'.
export const PHOTOS: Record<string, string | null> = {
	board: null, // whole board from above (scenes 2 and 13)
	doorbell: null, // power button connector
	reservoir: null, // battery connector
	station: null, // VRMs: chokes and MOSFETs near the CPU
	hall: null, // CPU
	rulebook: null, // BIOS chip (small 8-pin chip)
	desk: null, // RAM
	warehouse: null, // M.2 SSD
	roads: null, // macro of the copper traces
	gates: null, // ports and chipset area
	lights: null, // display ribbon connector
};

// Audio: put files in public/audio/ and write e.g. 'audio/voiceover.wav'.
export const AUDIO = {
	// Kokoro voice af_heart, regenerate with: python3 tools/make_voiceover.py
	voiceover: 'audio/voiceover.wav' as string | null,
	// Placeholder synth track, regenerate with: python3 tools/make_placeholder_music.py
	music: 'audio/placeholder-synth.wav' as string | null,
	// Kept low so the voice sits on top.
	musicVolume: 0.3,
};
