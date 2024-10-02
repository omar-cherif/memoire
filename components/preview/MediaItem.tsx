'use client';

import { MediaItemType } from '#/types';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface MediaItemProps {
	url: string;
	media: MediaItemType;
};

const MediaItem: React.FC<MediaItemProps> = ({ url, media }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const opacity = interpolate(
		frame,
		[0, 5, media.duration * fps - 5, media.duration * fps],
		[0, 1, 1, 0]
	);

	return (
		<AbsoluteFill style={{ opacity }}>
			<Img
				src={url}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain'
				}}
			/>
		</AbsoluteFill>
	);
};

export default MediaItem;
