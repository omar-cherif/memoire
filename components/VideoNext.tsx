'use client';

import Image from 'next/image';
import { MediaItemType } from '#/types';
import { Player } from '@remotion/player';
import { db } from '#/lib/browserDatabase';
import { getOutputDimensions } from '#/lib/utils';
import { useProject } from '#/components/contexts/ProjectContext';
import VideoComposition from '#/components/preview/VideoComposition';
import { useEffect, useState, useCallback, useMemo, memo, FC } from 'react';

interface MemoizedPlayerProps {
	videoComposition: () => React.ReactNode;
	totalDurationInFrames: number;
	compositionWidth: number;
	compositionHeight: number;
	frameRate: number;
};

const MemoizedPlayer: FC<MemoizedPlayerProps> = memo(({ videoComposition, totalDurationInFrames, compositionWidth, compositionHeight, frameRate }) => {
	return (
		<Player
			component={videoComposition}
			durationInFrames={totalDurationInFrames}
			compositionWidth={compositionWidth}
			compositionHeight={compositionHeight}
			fps={frameRate}
			style={{ width: '100%' }}
			controls
		/>
	);
});

MemoizedPlayer.displayName = 'MemoizedPlayer';

const VideoPreview = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [loadedAudioUrl, setLoadedAudioUrl] = useState('');
	const { project, mediaItems, narration, setNarration } = useProject();
	const [loadedMediaItems, setLoadedMediaItems] = useState<(MediaItemType & { url: string })[]>([]);

	const compositionDimensions = useMemo(() => {
		return getOutputDimensions('720P', project.aspectRatio);
	}, [project.aspectRatio]);

	const [compositionWidth, compositionHeight] = compositionDimensions;

	const getMediaUrl = useCallback(async (cid: string, projectId: string, type: 'media' | 'audio'): Promise<string> => {
		try {

			if (typeof window === 'undefined') {
				return '';
			}

			const table = type === 'media' ? db.media : db.audio;
			let item = await table.where({ cid }).first();
			if (item) {
				return URL.createObjectURL(item.file);
			}

			const response = await fetch(`/api/getFile?cid=${encodeURIComponent(cid)}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();

			// Use upsert instead of add
			await table.put({
				cid,
				file: blob,
				projectId
			});

			return URL.createObjectURL(blob);
		} catch (error) {
			console.log(`Get Media Error [${type.toUpperCase()}]:>>`, error);
			return ''
		}
	}, []);

	const loadAudio = useCallback(async () => {
		if (narration?.audioCid) {
			const audioUrl = await getMediaUrl(narration.audioCid, project.id, 'audio');
			setLoadedAudioUrl(audioUrl);
			setNarration({ audioUrl });
		}
	}, [narration?.audioCid, project.id, getMediaUrl, setNarration]);

	const loadMediaItems = useCallback(async () => {
		try {
			setIsLoading(true);
			const loadedItems = await Promise.all(
				mediaItems.map(async (media) => ({
					...media,
					url: await getMediaUrl(media.cid, project.id, 'media')
				}))
			);

			const sortedMediaItems = [...loadedItems].sort((first, next) =>
				project.mediaOrder.indexOf(first.id) - project.mediaOrder.indexOf(next.id)
			);

			setLoadedMediaItems(sortedMediaItems);
			await loadAudio();
		} catch (error) {
			console.error('Error loading media items :>>', error);
		} finally {
			setIsLoading(false);
		}
	}, [mediaItems, getMediaUrl, project.id, project.mediaOrder, loadAudio]);

	useEffect(() => {
		loadMediaItems();
	}, [loadMediaItems]);

	const totalDurationInFrames = useMemo(() => {
		const totalDurationInSeconds = loadedMediaItems.reduce((total, item) => total + item.duration, 0);
		return Math.round(totalDurationInSeconds * project.frameRate);
	}, [loadedMediaItems, project.frameRate]);

	const videoComposition = useCallback(() => {
		return VideoComposition({
			audioUrl: loadedAudioUrl,
			mediaItems: loadedMediaItems
		});
	}, [loadedAudioUrl, loadedMediaItems]);

	if (mediaItems.length === 0) {
		return (
			<div className='w-full h-full flex flex-col'>
				<div className='flex flex-col items-center justify-center h-svh gap-y-4'>
					<Image
						src='/images/no-video-dark.svg'
						height='300'
						width='300'
						alt='No Media Yet'
						fetchPriority='high'
						className='hidden dark:block'
					/>
					<Image
						src='/images/no-video-light.svg'
						height='300'
						width='300'
						alt='No Media Yet'
						fetchPriority='high'
						className='block dark:hidden'
					/>
					<h2 className='text-xl font-medium'>No Media Yet</h2>
					<p className='text-muted-foreground text-sm'>Feel free to start uploading your media</p>
				</div>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className='w-full h-full flex flex-col'>
				<div className='flex flex-col items-center justify-center h-svh gap-y-4'>
					<Image
						src='/images/preview-loading-dark.svg'
						height='300'
						width='300'
						alt='Preview Loading'
						fetchPriority='high'
						className='hidden dark:block animate-pulse'
					/>
					<Image
						src='/images/preview-loading-light.svg'
						height='300'
						width='300'
						alt='Preview Loading'
						fetchPriority='high'
						className='block dark:hidden animate-pulse'
					/>
					<h2 className='text-xl font-medium -mt-14'>Loading Preview...</h2>
					<p className='text-muted-foreground text-sm'>Your preview will be ready shortly</p>
				</div>
			</div>
		);
	}

	return (
		<div className='w-full h-full flex flex-col bg-muted relative'>
			<div className='absolute inset-0 m-auto max-h-full max-w-full' style={{ aspectRatio: `${compositionWidth} / ${compositionHeight}` }}>
				<MemoizedPlayer
					videoComposition={videoComposition}
					totalDurationInFrames={totalDurationInFrames}
					compositionWidth={compositionWidth}
					compositionHeight={compositionHeight}
					frameRate={project.frameRate}
				/>
			</div>
		</div>
	);
};

export default VideoPreview;
