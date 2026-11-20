import {Config} from '@remotion/cli/config';

// Lossless frames before encoding: JPEG intermediates soften thin lines and glows.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
