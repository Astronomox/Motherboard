import React from 'react';
import {Composition} from 'remotion';
import {CityWakes} from './CityWakes';
import {DURATION, FPS} from './data';

export const Root: React.FC = () => (
	<>
		{/* The master: native 4K, 9:16. Everything is vector, so it is drawn at full resolution. */}
		<Composition id="CityWakes" component={CityWakes} durationInFrames={DURATION} fps={FPS} width={2160} height={3840} />
		{/* Same video at 1080p, for quick test renders. */}
		<Composition id="CityWakesDraft" component={CityWakes} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
	</>
);
