import T from './timeline.json';

// Scene timings come from the voiceover (tools/make_voiceover.py writes timeline.json),
// so every scene is exactly as long as its line needs.
export const FPS = 30;
const fr = (sec: number) => Math.round(sec * FPS);
const sc = (id: string) => (T.scenes as Record<string, {start: number; end: number; voStart: number; voEnd: number}>)[id];
export const DURATION = fr(T.duration);
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
// Everything is designed on a 1080 x 1920 canvas and zoomed to the output size.
export const DW = 1080;
export const DH = 1920;
// Where the camera puts its target on screen: a bit above the middle, so captions sit below.
export const CENTER: [number, number] = [540, 840];

export const C = {
	paper: '#F7FAFF', // page white, a hair of blue
	deep: '#E6EFFC', // edge of the vignette, laptop body
	night: '#FFFFFF', // full-white cards (hook, end card)
	line: '#0B3D91', // blueprint ink: linework and text
	electron: '#FFD60A', // highlighter yellow: electron glow, spoken word
	trail: '#FFA800', // the electron's path, deeper so it reads on white
	tint: '#2F6FD6', // blue wash over photos
};

export type IconKey =
	| 'doorbell' | 'reservoir' | 'station' | 'hall' | 'rulebook'
	| 'desk' | 'warehouse' | 'roads' | 'gates' | 'lights';

export type Stop = {
	key: IconKey;
	sc: string;
	t: string;
	start: number; // seconds
	label: string;
	color: string;
	parts: string[]; // inked one after another
	at: [number, number]; // where the electron stops (board units)
	pin: [number, number]; // where the map pin points
	zoom: number;
	hud: string;
	vo: string;
};

export const STOPS: Stop[] = [
	{key: 'doorbell', sc: '03', t: '', start: 0, label: 'The doorbell', color: '#E07B00', parts: ['btn', 'ec'], at: [210, 160], pin: [210, 126], zoom: 2.9, hud: '5.0 V STANDBY', vo: 'The button rings the doorbell. A tiny chip, the embedded controller, wakes up first.'},
	{key: 'reservoir', sc: '04', t: '', start: 0, label: 'The reservoir', color: '#00A37A', parts: ['bat'], at: [110, 474], pin: [110, 450], zoom: 3.2, hud: '19.5 V IN', vo: 'It opens the reservoir. Power flows in from the battery or charger.'},
	{key: 'station', sc: '05', t: '', start: 0, label: 'Power station', color: '#F0441C', parts: ['vrm1', 'vrm2', 'vrm3', 'vrm4'], at: [344, 288], pin: [344, 192], zoom: 2.6, hud: '19 V → ~1 V', vo: 'But it is too strong. The power station steps it down to about one volt for the CPU.'},
	{key: 'hall', sc: '06', t: '', start: 0, label: 'City hall', color: '#C99A00', parts: ['cpu'], at: [505, 295], pin: [505, 206], zoom: 2.5, hud: 'VCORE 1.05 V', vo: 'City hall wakes up. But it has no idea what to do.'},
	{key: 'rulebook', sc: '07', t: '', start: 0, label: 'The rulebook', color: '#7C4DFF', parts: ['bios'], at: [322, 457], pin: [322, 426], zoom: 3.6, hud: 'SPI FLASH · 16 MB', vo: 'So it reads the rulebook. The BIOS chip holds the first instructions.'},
	{key: 'desk', sc: '08', t: '', start: 0, label: 'The desk', color: '#E0307E', parts: ['ram1', 'ram2', 'ram3', 'ram4'], at: [770, 115], pin: [770, 76], zoom: 2.4, hud: 'DDR4 · 2400 MT/s', vo: 'Next, its desk. The RAM, where it keeps what it is working on right now.'},
	{key: 'warehouse', sc: '09', t: '', start: 0, label: 'The warehouse', color: '#0091D5', parts: ['ssd'], at: [760, 472], pin: [760, 436], zoom: 2.4, hud: 'NVMe · M.2 2280', vo: 'Then the warehouse. The SSD, where your system and files live.'},
	{key: 'roads', sc: '10', t: '', start: 0, label: 'The roads', color: '#B5602A', parts: ['road'], at: [652, 280], pin: [652, 232], zoom: 3.4, hud: 'TRACE 0.1 mm', vo: 'Everything moves on these roads. Copper lines thinner than a hair.'},
	{key: 'gates', sc: '11', t: '', start: 0, label: 'City gates', color: '#3A9A12', parts: ['pch', 'usb1', 'usb2', 'hdmi', 'wifi'], at: [700, 340], pin: [700, 296], zoom: 2.1, hud: 'USB · WI-FI · KEYBOARD', vo: 'The gates open. USB, Wi-Fi, keyboard, all connected.'},
	{key: 'lights', sc: '12', t: '', start: 0, label: 'Lights on', color: '#0B3D91', parts: ['disp'], at: [505, 77], pin: [505, 58], zoom: 3.0, hud: 'eDP · LINK UP', vo: 'Last stop, the screen. Lights on.'},
];

for (const s of STOPS) {
	s.start = sc(s.key).start;
	s.t = mmss(s.start);
}

export const TRAVEL = 24; // frames the electron spends moving between stops
// Cut to the laptop as the voice reaches "Lights on".
export const LAPTOP_CUT = fr(sc('lights').voStart + 0.62 * (sc('lights').voEnd - sc('lights').voStart));
export const PAYOFF = fr(sc('payoff').start);
export const CTA = fr(sc('cta').start);
export const HOOK_END = fr(sc('hook').end);
export const CITY_START = fr(sc('city').start);
export const SCENE_TIME = (id: string) => mmss(sc(id).start);

export type Scene = {id: string; start: number; end: number; voStart: number; voEnd: number; vo: string; title?: string; eyebrow?: string};
const frames = (id: string) => ({start: fr(sc(id).start), end: fr(sc(id).end), voStart: fr(sc(id).voStart), voEnd: fr(sc(id).voEnd)});

export const SCENES: Scene[] = [
	{id: 'hook', ...frames('hook'), vo: 'You press power. In the next two seconds, a whole city wakes up.', title: 'What happens in the next 2 seconds?'},
	{id: 'city', ...frames('city'), vo: 'This is the city. Let’s follow one electron.', title: 'The motherboard = a city', eyebrow: 'HP ELITEBOOK 840 G5'},
	...STOPS.map((s) => ({
		id: s.key,
		...frames(s.key),
		vo: s.vo,
	})),
	{id: 'payoff', ...frames('payoff'), vo: 'All of that, in two seconds. Every time you press power.', title: 'All of that in 2 seconds'},
	{id: 'cta', ...frames('cta'), vo: 'Follow for part two: why laptops die.', title: 'Part 2: why laptops die'},
];

// The electron's wire: from the power button, an L-shaped run to each stop.
export const START: [number, number] = [118, 93];
export const ROUTE: [number, number][] = (() => {
	const pts: [number, number][] = [START];
	for (const s of STOPS) {
		const p = pts[pts.length - 1];
		pts.push([s.at[0], p[1]], s.at);
	}
	return pts;
})();
const CUM = ROUTE.map((_, i) => 0);
for (let i = 1; i < ROUTE.length; i++) {
	CUM[i] = CUM[i - 1] + Math.abs(ROUTE[i][0] - ROUTE[i - 1][0]) + Math.abs(ROUTE[i][1] - ROUTE[i - 1][1]);
}
export const ROUTE_LEN = CUM[CUM.length - 1];
export const STOP_LEN = STOPS.map((_, i) => CUM[2 * (i + 1)]);
export const ROUTE_D = 'M' + ROUTE.map((p) => p.join(' ')).join(' L');
export const pointAt = (L: number): [number, number] => {
	for (let i = 1; i < ROUTE.length; i++) {
		if (L <= CUM[i]) {
			const a = ROUTE[i - 1], b = ROUTE[i];
			const f = (L - CUM[i - 1]) / (CUM[i] - CUM[i - 1] || 1);
			return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
		}
	}
	return ROUTE[ROUTE.length - 1];
};
