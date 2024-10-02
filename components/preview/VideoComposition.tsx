'use client';

import { FC, Fragment } from 'react';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';
import MediaItem from '#/components/preview/MediaItem';
import { MediaItemType, NarrationType } from '#/types';
import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming, TransitionPresentation } from '@remotion/transitions';

interface VideoCompositionProps {
	audioUrl?: string | null;
	mediaItems: (MediaItemType & { url: string })[];
	fadePreview?: boolean;
	fadeInDuration?: number;
	fadeOutDuration?: number;
};

const MIN_FADE_DURATION = 0.5;
const MAX_FADE_DURATION = 1.5;
const TRANSITION_DURATION_SECONDS = 0.5;

const getTransition = (type: string): TransitionPresentation<any> => {
	switch (type) {
		case 'slide':
			return slide();
		case 'fade':
			return fade();
		case 'wipe':
			return wipe();
		default:
			return slide();
	}
};

const VideoComposition: FC<VideoCompositionProps> = ({
	audioUrl,
	mediaItems,
	fadePreview = true,
	fadeInDuration = 1.5,
	fadeOutDuration = 1.5
}) => {
	const { fps } = useVideoConfig();

	const clampedFadeInDuration = Math.max(MIN_FADE_DURATION, Math.min(MAX_FADE_DURATION, fadeInDuration));
	const clampedFadeOutDuration = Math.max(MIN_FADE_DURATION, Math.min(MAX_FADE_DURATION, fadeOutDuration));

	const fadeInFrames = Math.round(clampedFadeInDuration * fps);
	const fadeOutFrames = Math.round(clampedFadeOutDuration * fps);
	const transitionFrames = Math.round(TRANSITION_DURATION_SECONDS * fps);

	const totalDuration = mediaItems.reduce((sum, item) => sum + item.duration, 0) +
		(fadePreview ? clampedFadeInDuration + clampedFadeOutDuration : 0);

	console.log('Total calculated duration:', totalDuration);

	return (
		<AbsoluteFill className='bg-black'>
			<TransitionSeries>
				{fadePreview && (
					<TransitionSeries.Transition
						presentation={fade()}
						timing={linearTiming({ durationInFrames: fadeInFrames })}
					/>
				)}

				{mediaItems.map((media, index) => {
					const isLast = index === mediaItems.length - 1;
					const mediaDurationFrames = Math.round(media.duration * fps) + (transitionFrames / 2);

					return (
						<Fragment key={media.id}>
							<TransitionSeries.Sequence durationInFrames={mediaDurationFrames}>
								<MediaItem media={media} url={media.url} />
							</TransitionSeries.Sequence>

							{!isLast && (
								<TransitionSeries.Transition
									presentation={wipe()}
									timing={linearTiming({ durationInFrames: transitionFrames })}
								/>
							)}
						</Fragment>
					);
				})}

				{fadePreview && (
					<TransitionSeries.Transition
						presentation={fade()}
						timing={linearTiming({ durationInFrames: fadeOutFrames })}
					/>
				)}
			</TransitionSeries>
			{audioUrl && (
				<Audio src={audioUrl} />
			)}
		</AbsoluteFill>
	);
};

export default VideoComposition;
