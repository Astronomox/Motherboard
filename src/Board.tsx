import React from 'react';
import {C} from './data';

export type Ink = {color: string; on: boolean; glow: number; strength: number};

// A part outline. Inked parts switch to their building colour and glow.
const Part: React.FC<{ink?: Ink; children: React.ReactNode}> = ({ink, children}) => {
	const on = ink?.on;
	return (
		<g
			stroke={on ? ink.color : C.line}
			opacity={on ? 0.5 + 0.5 * ink.strength : 0.6}
			style={on && ink.glow > 0.01 ? {filter: `drop-shadow(0 0 ${2 + 6 * ink.glow}px ${ink.color})`} : undefined}
		>
			{children}
		</g>
	);
};

const F = 'rgba(11,61,145,0.05)';

export const BoardArt: React.FC<{ink: (id: string) => Ink | undefined; showCodes: number}> = ({ink, showCodes}) => (
	<g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}>
		{/* dimensions */}
		<g stroke="rgba(11,61,145,.3)" strokeWidth={1.5}>
			<path d="M40 600h920M40 594v12M960 594v12" />
			<path d="M20 40v520M14 40h12M14 560h12" />
		</g>
		<g fill="rgba(11,61,145,.6)" stroke="none" fontFamily="JetBrains Mono" fontSize={13} opacity={showCodes}>
			<text x={500} y={592} textAnchor="middle">TOP SIDE · NOT TO SCALE</text>
		</g>
		{/* board outline and mounting holes */}
		<path d="M60 40h360v14h170V40h350a20 20 0 0 1 20 20v480a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20V60a20 20 0 0 1 20-20z" fill="rgba(11,61,145,.025)" stroke={C.line} strokeWidth={4} />
		<g stroke={C.line} opacity={0.5} strokeWidth={2}>
			<circle cx={70} cy={70} r={9} /><circle cx={930} cy={70} r={9} /><circle cx={70} cy={530} r={9} /><circle cx={930} cy={530} r={9} />
			<circle cx={70} cy={70} r={4} /><circle cx={930} cy={70} r={4} /><circle cx={70} cy={530} r={4} /><circle cx={930} cy={530} r={4} />
		</g>
		{/* background traces */}
		<g stroke={C.line} opacity={0.28} strokeWidth={2}>
			<path id="bgtraces" d="M240 160h60v60h40M240 170h50v80h50M590 250h40v-90h40M590 330h40v80h40M590 350h30v120h60M420 250h-30M420 330h-30M330 470h80v-100h20M150 490h120v-60M500 210V95M520 210V95M180 470h120M760 150v30h120V300M880 150v20M600 520h300M200 300h80v-40M120 300h80v100h90" />
		</g>

		<Part ink={ink('btn')}><rect x={86} y={80} width={64} height={26} rx={3} fill={F} /><path d="M96 88v10M106 88v10M116 88v10M126 88v10M136 88v10" /></Part>
		<Part ink={ink('ec')}><rect x={180} y={130} width={60} height={60} rx={3} fill={F} /><circle cx={192} cy={142} r={3} /><path d="M180 142h-8M180 154h-8M180 166h-8M180 178h-8M240 142h8M240 154h8M240 166h8M240 178h8M192 130v-8M204 130v-8M216 130v-8M228 130v-8" /></Part>
		<Part ink={ink('bat')}><rect x={62} y={452} width={96} height={44} rx={4} fill={F} /><path d="M74 464v20M86 464v20M98 464v20M110 464v20M122 464v20M134 464v20M146 464v20" /></Part>
		{[196, 244, 292, 340].map((y, i) => (
			<Part key={y} ink={ink('vrm' + (i + 1))}><rect x={320} y={y} width={48} height={40} rx={4} fill={F} /><path d={`M344 ${y + 14}v12`} /><rect x={290} y={y + 14} width={16} height={14} /></Part>
		))}
		<Part ink={ink('cpu')}><rect x={420} y={210} width={170} height={170} rx={6} fill={F} /><rect x={460} y={250} width={90} height={90} rx={2} /><path d="M475 250v90M490 250v90M505 250v90M520 250v90M535 250v90" opacity={0.35} /><circle cx={432} cy={222} r={4} /></Part>
		<Part ink={ink('bios')}><rect x={300} y={440} width={44} height={34} rx={2} fill={F} /><circle cx={309} cy={449} r={2.5} /><path d="M306 440v-8M317 440v-8M328 440v-8M339 440v-8M306 474v8M317 474v8M328 474v8M339 474v8" /></Part>
		{[640, 708, 776, 844].map((x, i) => (
			<Part key={x} ink={ink('ram' + (i + 1))}><rect x={x} y={80} width={56} height={70} rx={3} fill={F} /><path d={`M${x + 12} 140h32M${x + 12} 92h10`} /></Part>
		))}
		<Part ink={ink('ssd')}><rect x={630} y={440} width={260} height={64} rx={4} fill={F} /><path d="M630 450v44" /><rect x={660} y={455} width={70} height={34} rx={2} /><rect x={750} y={455} width={70} height={34} rx={2} /><circle cx={872} cy={472} r={7} /><path d="M630 466h-12v12h12" /></Part>
		<Part ink={ink('road')}><path id="roadpaths" d="M590 240h30v-60h40V150M590 260h46v-60h46v-50M590 280h62v-60h68v-70M590 300h78v-60h112V150" /><circle cx={620} cy={240} r={3} /><circle cx={636} cy={260} r={3} /><circle cx={652} cy={280} r={3} /><circle cx={668} cy={300} r={3} /></Part>
		<Part ink={ink('pch')}><rect x={660} y={300} width={80} height={80} rx={4} fill={F} /><circle cx={672} cy={312} r={3} /><path d="M740 340h188M740 320h100v-75h88M740 360h120v-65h68" /></Part>
		<Part ink={ink('usb1')}><rect x={928} y={230} width={34} height={30} rx={3} fill={F} /><rect x={936} y={240} width={18} height={10} rx={5} /></Part>
		<Part ink={ink('usb2')}><rect x={928} y={280} width={34} height={30} rx={3} fill={F} /><rect x={936} y={290} width={18} height={10} rx={5} /></Part>
		<Part ink={ink('hdmi')}><rect x={928} y={330} width={34} height={44} rx={3} fill={F} /><path d="M936 342h18l-3 20h-12z" /></Part>
		<Part ink={ink('wifi')}><rect x={790} y={380} width={70} height={40} rx={3} fill={F} /><path d="M808 400a10 10 0 0 1 14 0M803 395a17 17 0 0 1 24 0" /><circle cx={815} cy={406} r={2} /></Part>
		<Part ink={ink('disp')}><rect x={440} y={62} width={130} height={30} rx={3} fill={F} /><path d="M450 70v14M460 70v14M470 70v14M480 70v14M490 70v14M500 70v14M510 70v14M520 70v14M530 70v14M540 70v14M550 70v14M560 70v14" /></Part>

		{/* part codes, as printed on the silkscreen */}
		<g fill="rgba(11,61,145,.62)" stroke="none" fontFamily="JetBrains Mono" fontSize={12} opacity={showCodes}>
			<text x={86} y={124}>J_PWR</text><text x={180} y={212}>U_EC</text><text x={62} y={514}>J_BAT</text><text x={290} y={398}>L1–L4</text>
			<text x={420} y={398}>U_CPU</text><text x={300} y={498}>U_SPI</text><text x={640} y={168}>U_DRAM</text><text x={630} y={522}>M.2 2280</text>
			<text x={660} y={396}>U_PCH</text><text x={440} y={110}>J_EDP</text><text x={918} y={224} textAnchor="end">USB</text><text x={790} y={436}>WLAN</text>
		</g>
	</g>
);
