import React from 'react';
import {IconKey} from './data';

// One family: 24px grid, 2px round strokes, no fills, one glowing accent dot.
const P: Record<IconKey | 'power' | 'dead', {d: string[]; rects?: number[][]; circles?: number[][]; dot: [number, number, number]}> = {
	doorbell: {d: ['M5.5 17V11a6.5 6.5 0 0 1 13 0v6l1.5 1.5H4z', 'M12 8.5v3', 'M9.6 10.1a3.2 3.2 0 1 0 4.8 0'], dot: [12, 21, 1.8]},
	reservoir: {d: ['M10.5 3h3', 'M12 5c3.6 4.4 6 7.4 6 10.3a6 6 0 0 1-12 0C6 12.4 8.4 9.4 12 5z', 'M9.8 15.5h4.4M12 13.3v4.4'], dot: [16.6, 9.2, 1.6]},
	station: {d: ['M4 21l3.5-16L11 21', 'M2.5 8.5h10M5.2 14h4.6', 'M14 5h3v5h2.5v5H22'], dot: [22, 19.5, 1.6]},
	hall: {d: ['M3 9.5L12 4l9 5.5z', 'M6 12.5v5.5M10 12.5v5.5M14 12.5v5.5M18 12.5v5.5', 'M3 21h18', 'M7 4.6V3M17 4.6V3M12 4V2'], dot: [12, 7.4, 1.4]},
	rulebook: {d: ['M12 7.5c-2-1.4-5-1.9-8.5-1.4v12.8c3.5-.5 6.5 0 8.5 1.4 2-1.4 5-1.9 8.5-1.4V12', 'M12 7.5v12.3', 'M13.6 4h1.4M13.6 6.5h1.4M19.5 4h1.4M19.5 6.5h1.4'], rects: [[15, 2, 4.5, 6.5, 0.6]], dot: [17.25, 3.9, 1]},
	desk: {d: ['M8 8.5v-1.6M11 8.5v-1.6M14 8.5v-1.6', 'M2.5 11h19', 'M5 11v9M19 11v9', 'M13 14h6'], rects: [[5, 3.5, 14, 5, 0.6]], dot: [17, 6, 1.1]},
	warehouse: {d: ['M2.5 8L12 3.5 21.5 8', 'M4 8v12.5h6v-2h2v2h8V8', 'M7.5 11.5h9M7.5 15h9'], dot: [12, 7, 1.2]},
	roads: {d: ['M2.5 19h6l6-6h3', 'M2.5 14.5h4l6-6h9'], circles: [[19.5, 13, 2]], dot: [8.5, 19, 1.6]},
	gates: {d: ['M4.5 21V11a7.5 7.5 0 0 1 15 0v10', 'M2 21h20'], rects: [[8.5, 12, 7, 3.6, 1.8]], dot: [12, 7, 1.3]},
	lights: {d: ['M8.6 15A6.2 6.2 0 1 1 15.4 15c-.8.8-1 1.5-1 2.5H9.6c0-1-.2-1.7-1-2.5z', 'M10 20.5h4', 'M9.5 11.5c.8-1.6 1.7-1.6 2.5 0s1.7 1.6 2.5 0'], dot: [12, 4.6, 1.1]},
	power: {d: ['M12 3v8', 'M7 6.5a7 7 0 1 0 10 0'], dot: [12, 3, 0]},
	// A battery with a crack through it and a flatline: part 2's teaser.
	dead: {d: ['M21 10v4', 'M10 6.5l-1.5 4 3 1.5-2 5.5', 'M4 12h2.5l1-1.5 1 3 .8-1.5H13'], rects: [[2, 6.5, 17, 11, 1.8]], dot: [16, 12, 1.4]},
};

export const Icon: React.FC<{k: keyof typeof P; size: number; color?: string; accent: string; stroke?: number}> = ({k, size, color = '#0B3D91', accent, stroke = 2}) => {
	const p = P[k];
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{overflow: 'visible', display: 'block'}}>
			<g fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
				{p.d.map((d, i) => <path key={i} d={d} />)}
				{p.rects?.map((r, i) => <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />)}
				{p.circles?.map((c, i) => <circle key={i} cx={c[0]} cy={c[1]} r={c[2]} />)}
			</g>
			{p.dot[2] > 0 && <circle cx={p.dot[0]} cy={p.dot[1]} r={p.dot[2]} fill={accent} style={{filter: `drop-shadow(0 0 1.5px ${accent})`}} />}
		</svg>
	);
};
