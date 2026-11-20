import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadDisplay} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadBody} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {
	C, CENTER, CTA, DH, DW, FPS, LAPTOP_CUT, PAYOFF, pointAt, ROUTE_D, ROUTE_LEN,
	SCENES, STOP_LEN, STOPS, TRAVEL,
} from './data';
import {BoardArt, Ink} from './Board';
import {Icon} from './icons';
import {AUDIO, PHOTOS} from './config';

const display = loadDisplay('normal', {weights: ['700'], subsets: ['latin']}).fontFamily;
const body = loadBody('normal', {weights: ['800'], subsets: ['latin']}).fontFamily;
const mono = loadMono('normal', {weights: ['600'], subsets: ['latin']}).fontFamily;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Cam = {cx: number; cy: number; z: number};
const OVERVIEW: Cam = {cx: 500, cy: 300, z: 1.04};
const stopCam = (i: number): Cam => ({cx: STOPS[i].at[0], cy: STOPS[i].at[1], z: STOPS[i].zoom});
const stopEnd = (i: number) => (i < STOPS.length - 1 ? STOPS[i + 1].start : 48) * FPS;
const PUSH = 0.07; // slow push-in while dwelling

const currentStop = (f: number) => {
	for (let i = STOPS.length - 1; i >= 0; i--) if (f >= STOPS[i].start * FPS && f < stopEnd(i)) return i;
	return -1;
};

const camera = (f: number): Cam => {
	if (f < STOPS[0].start * FPS) {
		return {...OVERVIEW, z: interpolate(f, [90, 180], [0.9, 1.04], {...clamp, easing: Easing.out(Easing.quad)})};
	}
	if (f >= PAYOFF) {
		const k = interpolate(f, [PAYOFF, PAYOFF + 75], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
		return {cx: 500, cy: 300, z: lerp(1.6, 0.98, k)};
	}
	const i = currentStop(f);
	const S = STOPS[i].start * FPS;
	const from = i === 0 ? OVERVIEW : {...stopCam(i - 1), z: stopCam(i - 1).z * (1 + PUSH)};
	const to = stopCam(i);
	const k = Math.min(1, (f - S) / TRAVEL);
	if (k < 1) {
		const e = ease(k);
		// Dolly out a little mid-move, like a camera following a car.
		const z = lerp(from.z, to.z, e) * (1 - 0.32 * Math.sin(Math.PI * e));
		return {cx: lerp(from.cx, to.cx, e), cy: lerp(from.cy, to.cy, e), z};
	}
	const p = (f - S - TRAVEL) / (stopEnd(i) - S - TRAVEL);
	return {...to, z: to.z * (1 + PUSH * p)};
};

const project = (pt: [number, number], cam: Cam): [number, number] => [
	CENTER[0] + (pt[0] - cam.cx) * cam.z,
	CENTER[1] + (pt[1] - cam.cy) * cam.z,
];

const electronLen = (f: number) => {
	const i = currentStop(f);
	if (i < 0) return f < STOPS[0].start * FPS ? 0 : ROUTE_LEN;
	const S = STOPS[i].start * FPS;
	const a = i === 0 ? 0 : STOP_LEN[i - 1];
	return lerp(a, STOP_LEN[i], ease(Math.min(1, (f - S) / TRAVEL)));
};

const inkFor = (f: number) => {
	const map: Record<string, Ink> = {};
	STOPS.forEach((s, j) => {
		const S = s.start * FPS + TRAVEL - 2;
		s.parts.forEach((id, m) => {
			const t0 = S + m * 5;
			if (f >= PAYOFF) {
				const a = PAYOFF + 10 + j * 4;
				const g = interpolate(f, [a, a + 8], [0, 1], clamp);
				map[id] = {color: s.color, on: true, glow: g, strength: Math.max(0.1, g)};
			} else if (f >= t0) {
				const live = f < stopEnd(j);
				const g = live ? interpolate(f, [t0, t0 + 5, t0 + 24], [0, 1, 0.6], clamp) : 0;
				map[id] = {color: s.color, on: true, glow: g, strength: live ? 1 : 0.1};
			}
		});
	});
	return (id: string) => map[id];
};

/* ---------- pieces ---------- */

const Grid: React.FC = () => (
	<>
		<defs>
			<pattern id="g-minor" width={20} height={20} patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(190,220,255,.08)" strokeWidth={1} vectorEffect="non-scaling-stroke" /></pattern>
			<pattern id="g-major" width={100} height={100} patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(190,220,255,.16)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" /></pattern>
		</defs>
		<rect x={-3000} y={-3000} width={7000} height={7000} fill="url(#g-minor)" />
		<rect x={-3000} y={-3000} width={7000} height={7000} fill="url(#g-major)" />
	</>
);

const Pin: React.FC<{label: string; icon: any; color: string; scale: number; opacity: number; dy: number}> = ({label, icon, color, scale, opacity, dy}) => (
	<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity, transform: `translateY(${dy}px)`}}>
		<div style={{
			display: 'flex', alignItems: 'center', gap: 16, padding: '18px 30px 18px 22px', border: `5px solid ${color}`, borderRadius: 14,
			background: 'rgba(7,31,61,.92)', transform: `scale(${scale})`, transformOrigin: 'bottom center', boxShadow: `0 0 40px ${color}55`,
		}}>
			<Icon k={icon} size={52} accent={color} stroke={2.2} />
			<span style={{fontFamily: display, fontWeight: 700, fontSize: 46, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.line, whiteSpace: 'nowrap'}}>{label}</span>
		</div>
		<div style={{width: 5, height: 34, background: color}} />
		<div style={{width: 20, height: 20, borderRadius: 10, background: color, boxShadow: `0 0 0 ${8 * scale}px ${color}33, 0 0 24px ${color}`}} />
	</div>
);

const Captions: React.FC<{f: number}> = ({f}) => {
	const sc = SCENES.find((s) => f >= s.start && f < s.end);
	if (!sc) return null;
	const words = sc.vo.split(' ');
	const a = sc.start + 4, b = sc.end - 10;
	const n = interpolate(f, [a, b], [0, words.length], clamp);
	const fadeOut = interpolate(f, [sc.end - 6, sc.end], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', left: 90, right: 150, top: 1300, textAlign: 'center', opacity: fadeOut}}>
			<div style={{fontFamily: body, fontWeight: 800, fontSize: 70, lineHeight: 1.16, letterSpacing: '-0.01em', textWrap: 'balance' as any}}>
				{words.map((w, i) => {
					const shown = i < n;
					const now = shown && i >= n - 1;
					const pop = shown ? interpolate(n - i, [0, 0.4], [0.86, 1], clamp) : 1;
					return (
						<span key={i} style={{
							display: 'inline-block', marginRight: '0.26em', opacity: shown ? 1 : 0,
							color: now ? C.electron : C.line, transform: `scale(${pop})`,
							textShadow: '0 4px 0 rgba(4,14,29,.9), 0 0 30px rgba(4,14,29,.95)',
						}}>{w}</span>
					);
				})}
			</div>
		</div>
	);
};

const Title: React.FC<{f: number}> = ({f}) => {
	const sc = SCENES.find((s) => f >= s.start && f < s.end && s.title);
	if (!sc || sc.id === 'hook' || sc.id === 'cta') return null;
	const t = f - sc.start;
	const o = interpolate(t, [2, 10], [0, 1], clamp) * interpolate(f, [sc.end - 8, sc.end], [1, 0], clamp);
	const y = interpolate(t, [2, 12], [30, 0], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', left: 80, right: 80, top: 230, textAlign: 'center', opacity: o, transform: `translateY(${y}px)`}}>
			{sc.eyebrow && <div style={{fontFamily: mono, fontWeight: 600, fontSize: 30, letterSpacing: '0.16em', color: 'rgba(232,241,255,.7)', marginBottom: 20}}>{sc.eyebrow}</div>}
			<div style={{fontFamily: display, fontWeight: 700, fontSize: 88, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.03em', color: C.line, textWrap: 'balance' as any}}>{sc.title}</div>
		</div>
	);
};

const Hud: React.FC<{f: number}> = ({f}) => {
	const i = currentStop(f);
	let left = '', right = '';
	if (f >= 90 && f < STOPS[0].start * FPS) { left = 'SC 02 · 0:03'; right = 'S5 → S0'; }
	else if (i >= 0 && f < LAPTOP_CUT) { left = `SC ${STOPS[i].sc} · ${STOPS[i].t}`; right = STOPS[i].hud; }
	else if (f >= PAYOFF && f < CTA) { left = 'SC 13 · 0:48'; right = 'ALL SYSTEMS ON'; }
	if (!left) return null;
	const box: React.CSSProperties = {background: 'rgba(7,31,61,.88)', border: '2px solid rgba(232,241,255,.3)', padding: '10px 18px'};
	const blink = Math.floor(f / 15) % 2 === 0;
	return (
		<div style={{position: 'absolute', top: 120, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontWeight: 600, fontSize: 30, color: C.line, letterSpacing: '0.04em'}}>
			<span style={box}><span style={{display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: C.electron, marginRight: 14, opacity: blink ? 1 : 0.2}} />{left}</span>
			<span style={{...box, color: i >= 0 && f < LAPTOP_CUT ? STOPS[i].color : C.line}}>{right}</span>
		</div>
	);
};

const PhotoLayer: React.FC<{f: number}> = ({f}) => {
	const i = currentStop(f);
	const key = f >= PAYOFF || (f >= 90 && f < STOPS[0].start * FPS) ? 'board' : i >= 0 ? STOPS[i].key : null;
	const src = key ? PHOTOS[key] : null;
	if (!src) return null;
	const sc = SCENES.find((s) => f >= s.start && f < s.end)!;
	const p = (f - sc.start) / (sc.end - sc.start);
	const o = interpolate(f, [sc.start, sc.start + 8, sc.end - 6, sc.end], [0, 1, 1, 0], clamp);
	return (
		<AbsoluteFill style={{opacity: o}}>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + 0.05 * p})`, filter: 'grayscale(1) contrast(1.25) brightness(.85)'}} />
			{/* blueprint grade: tint the photo into the sheet blue */}
			<AbsoluteFill style={{background: C.paper, mixBlendMode: 'multiply', opacity: 0.85}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,14,29,.55), rgba(4,14,29,0) 30%, rgba(4,14,29,0) 55%, rgba(4,14,29,.8))'}} />
		</AbsoluteFill>
	);
};

/* ---------- special scenes ---------- */

const Hook: React.FC<{f: number}> = ({f}) => {
	if (f >= 90) return null;
	const press = f < 16;
	const s = press ? interpolate(f, [0, 8, 11, 16], [1.06, 1, 0.9, 1], clamp) : 1;
	const ring = interpolate(f, [10, 22], [0, 1], clamp);
	const words = 'What happens in the next 2 seconds?'.split(' ');
	return (
		<AbsoluteFill style={{background: press ? C.paper : C.night}}>
			{press ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<div style={{width: 520, height: 520, borderRadius: 260, border: `8px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`, boxShadow: f > 10 ? `0 0 ${120 * (1 - ring)}px ${C.electron}` : 'none'}}>
						<Icon k="power" size={280} accent={C.electron} color={f > 10 ? C.electron : C.line} stroke={1.6} />
					</div>
					<div style={{position: 'absolute', width: 520, height: 520, borderRadius: 260, border: `6px solid ${C.electron}`, transform: `scale(${1 + ring * 1.4})`, opacity: f > 10 ? 1 - ring : 0}} />
				</AbsoluteFill>
			) : (
				<div style={{position: 'absolute', left: 80, right: 80, top: 560, textAlign: 'center', fontFamily: display, fontWeight: 700, fontSize: 116, lineHeight: 1.02, textTransform: 'uppercase', color: C.line}}>
					{words.map((w, i) => {
						const o = interpolate(f, [20 + i * 4, 24 + i * 4], [0, 1], clamp);
						return <span key={i} style={{display: 'inline-block', marginRight: '0.22em', opacity: o, color: w.startsWith('2') ? C.electron : C.line}}>{w}</span>;
					})}
				</div>
			)}
			{/* flash on press */}
			<AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [15, 16, 20], [0, 0.9, 0], clamp)}} />
		</AbsoluteFill>
	);
};

const Laptop: React.FC<{f: number}> = ({f}) => {
	if (f < LAPTOP_CUT || f >= PAYOFF) return null;
	const t = f - LAPTOP_CUT;
	const on = interpolate(t, [4, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const pin = spring({frame: t - 14, fps: FPS, config: {damping: 11, stiffness: 180}});
	return (
		<AbsoluteFill style={{background: C.night}}>
			<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<defs>
					<radialGradient id="bloom" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55 * on} /><stop offset="1" stopColor="#9EE8FF" stopOpacity={0} /></radialGradient>
					<linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2F7BD8" /><stop offset="1" stopColor="#0E3A6E" /></linearGradient>
				</defs>
				<ellipse cx={540} cy={900} rx={720} ry={620} fill="url(#bloom)" />
				<g fill="none" stroke={C.line} strokeWidth={6} strokeLinejoin="round">
					<rect x={160} y={620} width={760} height={500} rx={22} fill={C.deep} />
					<rect x={192} y={652} width={696} height={436} rx={6} fill="#02060c" />
					<rect x={192} y={652} width={696} height={436} rx={6} fill="url(#scr)" opacity={on} stroke="none" />
					<path d="M100 1140h880l-40 52H140z" fill={C.deep} />
					<path d="M470 1140v14h140v-14" />
				</g>
				<g opacity={interpolate(t, [10, 18], [0, 1], clamp)}>
					<g transform="translate(540 870) scale(5) translate(-12 -12)"><path d="M12 3v8M7 6.5a7 7 0 1 0 10 0" fill="none" stroke={C.line} strokeWidth={2} strokeLinecap="round" /></g>
				</g>
			</svg>
			<AbsoluteFill style={{background: '#fff', opacity: interpolate(t, [0, 2, 8], [0, 0.95, 0], clamp)}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center'}}>
				<Pin label="Lights on" icon="lights" color="#FFFFFF" scale={Math.max(0, pin)} opacity={t > 13 ? 1 : 0} dy={0} />
			</div>
		</AbsoluteFill>
	);
};

const Cta: React.FC<{f: number}> = ({f}) => {
	if (f < CTA) return null;
	const t = f - CTA;
	const o = interpolate(t, [0, 12], [0, 1], clamp);
	const s = spring({frame: t - 6, fps: FPS, config: {damping: 12}});
	return (
		<AbsoluteFill style={{background: `rgba(4,14,29,${0.94 * o})`, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 330}}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50, opacity: o, transform: `translateY(${(1 - s) * 40}px)`}}>
				<div style={{border: '5px solid #FF6B3D', borderRadius: 30, padding: 44, boxShadow: '0 0 60px #FF6B3D55'}}>
					<Icon k="dead" size={220} accent="#FF6B3D" stroke={1.4} />
				</div>
				<div style={{fontFamily: mono, fontWeight: 600, fontSize: 34, letterSpacing: '0.2em', color: '#FF6B3D'}}>PART 2</div>
				<div style={{fontFamily: display, fontWeight: 700, fontSize: 120, lineHeight: 0.98, textTransform: 'uppercase', textAlign: 'center', color: C.line, padding: '0 80px'}}>Why laptops die</div>
			</div>
		</AbsoluteFill>
	);
};

/* ---------- main ---------- */

export const CityWakes: React.FC = () => {
	const f = useCurrentFrame();
	const {width} = useVideoConfig();
	const cam = camera(f);
	const ink = inkFor(f);
	const L = electronLen(f);
	const i = currentStop(f);
	const hasPhoto = (i >= 0 && PHOTOS[STOPS[i].key]) || ((f >= PAYOFF || f < STOPS[0].start * FPS) && PHOTOS.board);

	// electron
	const ePos = project(pointAt(L), cam);
	const eOpacity = interpolate(f, [110, 124], [0, 1], clamp) * interpolate(f, [PAYOFF, PAYOFF + 12], [1, 0], clamp);
	const moving = i >= 0 && f - STOPS[i].start * FPS < TRAVEL;
	const pulse = 1 + 0.12 * Math.sin(f / 3);

	// map pin for the current stop
	let pin: React.ReactNode = null;
	if (i >= 0 && f < LAPTOP_CUT) {
		const s = STOPS[i];
		const t = f - (s.start * FPS + TRAVEL - 2);
		const end = Math.min(stopEnd(i), LAPTOP_CUT);
		const sc = spring({frame: t, fps: FPS, config: {damping: 10, stiffness: 200, mass: 0.6}});
		const out = interpolate(f, [end - 6, end], [0, 1], clamp);
		const [px, py] = project(s.pin, cam);
		if (t >= 0) pin = (
			<div style={{position: 'absolute', left: px, top: py, transform: 'translate(-50%, -100%)'}}>
				<Pin label={s.label} icon={s.key} color={s.color} scale={sc} opacity={1 - out} dy={out * 12} />
			</div>
		);
	}

	// moving light along roads and data streams
	const streams = (i >= 0 && ['roads', 'rulebook', 'desk', 'warehouse'].includes(STOPS[i].key)) || f >= PAYOFF;
	const streamColor = f >= PAYOFF ? C.electron : i >= 0 ? STOPS[i].color : C.electron;
	const streamPaths: Record<string, string> = {
		roads: 'M590 240h30v-60h40V150M590 260h46v-60h46v-50M590 280h62v-60h68v-70M590 300h78v-60h112V150',
		rulebook: 'M322 432V408h88v-40h10M330 432v-14h90v-60',
		desk: 'M590 240h30v-60h40V150M590 300h78v-60h112V150',
		warehouse: 'M590 350h30v120h10M590 330h40v80h70v30',
	};
	const streamD = f >= PAYOFF ? Object.values(streamPaths).join(' ') + ' M240 160h60v60h40M240 170h50v80h50M150 490h120v-60M330 470h80v-100h20' : i >= 0 ? streamPaths[STOPS[i].key] : '';

	return (
		<AbsoluteFill style={{background: C.night}}>
			<div style={{width: DW, height: DH, zoom: width / DW, position: 'relative', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 40%, ${C.paper}, ${C.deep} 75%)`}}>
				<PhotoLayer f={f} />
				<svg viewBox={`0 0 ${DW} ${DH}`} width={DW} height={DH} style={{position: 'absolute', inset: 0, opacity: hasPhoto ? 0.85 : 1}}>
					<g transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
						{!hasPhoto && <Grid />}
						<g style={{vectorEffect: 'non-scaling-stroke'} as any} className="b">
							<style>{'.b *{vector-effect:non-scaling-stroke}'}</style>
							<BoardArt ink={ink} showCodes={interpolate(cam.z, [1, 1.6], [0.9, 1], clamp)} />
							{/* the path the electron has travelled */}
							<path d={ROUTE_D} fill="none" stroke={C.electron} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={ROUTE_LEN}
								strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN - L} opacity={0.5 * eOpacity + (f >= PAYOFF ? 0.4 : 0)} style={{filter: `drop-shadow(0 0 6px ${C.electron})`}} />
							{streams && streamD && (
								<path d={streamD} fill="none" stroke={streamColor} strokeWidth={6} strokeLinecap="round" strokeDasharray="14 46" strokeDashoffset={-f * 6}
									style={{filter: `drop-shadow(0 0 6px ${streamColor})`}} opacity={f >= PAYOFF ? interpolate(f, [PAYOFF + 20, PAYOFF + 40], [0, 1], clamp) : 1} />
							)}
							{/* City hall has no idea what to do */}
							{i === 3 && (() => {
								const t = f - (STOPS[3].start * FPS + TRAVEL);
								const q = spring({frame: t - 22, fps: FPS, config: {damping: 9}});
								return t > 20 ? <text x={505} y={318} textAnchor="middle" fontFamily={display} fontWeight={700} fontSize={70} fill="#FFC93C" opacity={interpolate(t, [80, 95], [1, 0], clamp)} transform={`translate(505 300) scale(${q}) translate(-505 -300)`} style={{filter: 'drop-shadow(0 0 8px #FFC93C)'}}>?</text> : null;
							})()}
						</g>
					</g>
				</svg>

				{/* electron, drawn at a fixed screen size so it stays crisp at any zoom */}
				<svg viewBox={`0 0 ${DW} ${DH}`} width={DW} height={DH} style={{position: 'absolute', inset: 0, opacity: eOpacity}}>
					<defs><filter id="eglow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation={14} /></filter></defs>
					<circle cx={ePos[0]} cy={ePos[1]} r={34 * pulse * (moving ? 1.2 : 1)} fill={C.electron} filter="url(#eglow)" opacity={0.9} />
					<circle cx={ePos[0]} cy={ePos[1]} r={16} fill={C.electron} />
					<circle cx={ePos[0]} cy={ePos[1]} r={9} fill="#FFFFFF" />
				</svg>

				{pin}
				<Title f={f} />
				<Hud f={f} />
				<Captions f={f} />
				<Laptop f={f} />
				{f >= LAPTOP_CUT && f < PAYOFF && <Captions f={f} />}
				<Hook f={f} />
				{f < 90 && <Captions f={f} />}
				<Cta f={f} />
				{f >= CTA && <Captions f={f} />}
				{/* fade from the laptop back into the city */}
				<AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [PAYOFF, PAYOFF + 1, PAYOFF + 8], [0, 0.6, 0], clamp), pointerEvents: 'none'}} />
			</div>
			{AUDIO.voiceover && <Audio src={staticFile(AUDIO.voiceover)} />}
			{AUDIO.music && <Audio src={staticFile(AUDIO.music)} volume={AUDIO.musicVolume} />}
		</AbsoluteFill>
	);
};
