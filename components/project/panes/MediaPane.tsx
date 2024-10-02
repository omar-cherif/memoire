'use client';

import Image from 'next/image';
import { Prisma } from '@prisma/client';
import { db } from '#/lib/browserDatabase';
import axios, { AxiosResponse } from 'axios';
import { UPLOAD_ENDPOINT } from '#/lib/pinata';
import { Button } from '#/components/ui/button';
import useExitPrompt from '#/hooks/useExitPrompt';
import { useDebounceCallback } from 'usehooks-ts';
import { SaveIcon, StarIcon } from 'lucide-react';
import PinataImage from '#/components/PinataImage';
import { useMutation } from '@tanstack/react-query';
import MediaItem from '#/components/project/MediaItem';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useProject } from '#/components/contexts/ProjectContext';
import SidebarPaneHeader from '#/components/project/SidebarPaneHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';
import { saveMedia, saveMediaOrder, updateMedia } from '#/lib/actions/mutations';
import SidebarPaneCloseButton from '#/components/project/SidebarPaneCloseButton';
import { MultiFileDropzone, type FileState } from '#/components/MultiFileDropzone';
import { ActivePane, MediaMetadata, TransitionType, PinataUploadResponse } from '#/types';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn, acceptedFileTypes, reorderByField, updateItemById, getPhotoDimensions, getVideoDimensions } from '#/lib/utils';
import { DndContext, DragOverlay, DragEndEvent, PointerSensor, TouchSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10 MB

interface MediaPaneProps {
	activePane: ActivePane;
	onPaneChange: (pane: ActivePane) => void;
};

const MediaPane = ({
	activePane,
	onPaneChange
}: MediaPaneProps) => {
	const tabBottomRef = useRef<HTMLDivElement>(null);
	const [_, setShowExitPrompt] = useExitPrompt(false);
	const [isSaveDisabled, setIsSaveDisabled] = useState(true);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [fileStates, setFileStates] = useState<FileState[]>([]);
	const [isUploadDisabled, setIsUploadDisabled] = useState(false);
	const { project, setProject, mediaItems, setMediaItems } = useProject();
	const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata[]>([]);
	const [mediaTab, setMediaTab] = useState<'upload' | 'manage'>('upload');

	const { mutate: saveMediaMutation } = useMutation({
		mutationKey: [`project-${project.id}`],
		mutationFn: async ({ projectId, mediaMetadata }: { projectId: string; mediaMetadata: MediaMetadata[] }) => {
			try {
				const data = await saveMedia({ projectId, mediaMetadata });

				return data;
			} catch (error) {
				throw error;
			}
		},
		onMutate: () => {
			setIsUploadDisabled(true);
			setShowExitPrompt(true);
		},
		onSuccess: async (data) => {
			// Save files to IndexedDB
			await Promise.all(fileStates.map(async (fileState) => {
				if (fileState.cid) {
					const blob = await fileState.file.arrayBuffer().then(buffer => new Blob([buffer]));
					await db.media.add({
						cid: fileState.cid,
						file: blob,
						projectId: project.id
					});
				}
			}));

			alert('Files saved to IndexedDB!');
			
			const reorderedMediaItems = reorderByField(data.media, data.mediaOrder, 'id');

			setMediaItems(reorderedMediaItems);
			alert('Files reordered & set!');

			// Switch to manage tab
			setMediaTab('manage');

			setShowExitPrompt(false);
			setIsUploadDisabled(false);
			setFileStates([]);
			setMediaMetadata([]);
			alert('Files upload completed!');
		},
		onError: () => {
			setIsUploadDisabled(true);
		}
	});

	const { mutate: updateMediaMutation } = useMutation({
		mutationKey: [`project-${project.id}`],
		mutationFn: async (variables: { mediaId: string; data: Prisma.MediaUpdateInput }) => {
			try {
				const media = await updateMedia({ projectId: project.id, ...variables });

				return media;
			} catch (error) {
				throw error;
			}
		},
		onSuccess: async (data) => {
			const updatedItems = updateItemById(mediaItems, data.id, data);
			setMediaItems(updatedItems);
		}
	});

	const { mutate: saveMediaOrderMutation } = useMutation({
		mutationKey: [`project-${project.id}`],
		mutationFn: async (newMediaOrder: string[]) => {
			try {
				await saveMediaOrder({ projectId: project.id, newMediaOrder });

				return newMediaOrder;
			} catch (error) {
				throw error;
			}
		},
		onSuccess: async (newMediaOrder) => {
			setProject({ mediaOrder: newMediaOrder });
		}
	});

	const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
	const debouncedUpdateMedia = useDebounceCallback(updateMediaMutation, 500);

	useEffect(() => {
		const pendingFiles = fileStates.filter(({ progress }) => typeof progress === 'number' && progress < 100 || progress === 'PENDING');
		const erroredFiles = fileStates.filter(state => state.progress === 'ERROR');

		if (pendingFiles.length === 0 && fileStates.length > erroredFiles.length) {
			setIsSaveDisabled(false);
		} else {
			setIsSaveDisabled(true);
		}

		if (tabBottomRef.current && fileStates.length > 0) {
			tabBottomRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fileStates]);

	const updateFileProgress = (key: string, progress: FileState['progress']) => {
		setFileStates(fileStates => {
			const newFileStates = structuredClone(fileStates);
			const fileState = newFileStates.find(state => state.key === key);
			if (fileState) {
				fileState.progress = progress;
			}

			return newFileStates;
		});
	};

	const clearFailedUploads = () => {
		setFileStates(fileStates => {
			const newFileStates = fileStates.filter(state => state.progress !== 'ERROR');

			return newFileStates;
		});
	};

	const savePhotosToDatabase = async () => {
		// Then, check if some files errored out. If yes, get a confirmation from user
		const erroredFiles = fileStates.filter(state => state.progress === 'ERROR');
		if (erroredFiles.length > 0) {
			const message = erroredFiles.length === 1
				? `An error occurred while uploading a file. Proceed?`
				: `An error occurred while uploading ${erroredFiles.length} files. Proceed?`;

			if (!confirm(message)) return;
		}

		saveMediaMutation({ projectId: project.id, mediaMetadata });
	};

	const onClose = () => {
		onPaneChange(null);
	};

	const onMediaTabChange = (value: string) => {
		setMediaTab(value as 'upload' | 'manage');
	};

	const handleDurationChange = (mediaId: string) => (e: ChangeEvent<HTMLInputElement>) => {
		debouncedUpdateMedia({ mediaId, data: { duration: parseInt(e.target.value, 10) } });
	};

	const handleDescriptionChange = (mediaId: string) => (newDescription: string) => {
		debouncedUpdateMedia({ mediaId, data: { description: newDescription } });
	};

	const handleTransitionChange = (mediaId: string) => (newTransition: TransitionType) => {
		debouncedUpdateMedia({ mediaId, data: { transition: newTransition } });
	};

	const getMediaPosition = (id: string) => mediaItems.findIndex(media => media.id === id);

	const handleMediaDragStart = (e: DragEndEvent) => {
		setActiveId(e.active.id as string);
	};

	const handleMediaDragEnd = (e: DragEndEvent) => {
		const { active, over } = e;

		if (over) {
			if (active.id === over.id) return;
			const originalPosition = getMediaPosition(active.id as string);
			const newPosition = getMediaPosition(over.id as string);

			const newItems = arrayMove(mediaItems, originalPosition, newPosition);
			setMediaItems(newItems);
			setActiveId(null);

			// Save new media order
			saveMediaOrderMutation(newItems.map(item => item.id));
		}
	};

	const onMediaDelete = (id: string) => {
		setMediaItems(mediaItems.filter(item => item.id !== id));
	};

	const completedFiles = fileStates.filter(({ progress }) => typeof progress === 'number' && progress === 100 || progress === 'COMPLETE');

	return (
		<aside
			className={cn(
				'bg-white relative border-r z-20 w-full xs:w-[360px] h-full flex flex-col',
				activePane === 'media' ? 'visible' : 'hidden'
			)}
		>
			<SidebarPaneHeader
				title='Media'
				description='Upload & manage your project media files.'
			/>
			<div className='p-3 flex-1 scrollbar-thin overflow-y-auto overflow-x-hidden'>
				<Tabs defaultValue='upload' value={mediaTab} onValueChange={onMediaTabChange} className='w-full'>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='upload'>Upload</TabsTrigger>
						<TabsTrigger value='manage'>Manage</TabsTrigger>
					</TabsList>
					<TabsContent value='upload' className='flex flex-col items-center gap-y-2'>
						<MultiFileDropzone
							value={fileStates}
							disabled={isUploadDisabled}
							dropzoneOptions={{
								accept: acceptedFileTypes,
								maxFiles: 5,
								maxSize: MAX_FILE_SIZE
							}}
							onFilesAdded={async (addedFiles) => {
								setFileStates([...fileStates, ...addedFiles]);
								await Promise.all(
									addedFiles.map(async (addedFileState) => {
										try {
											const keyRequest = await fetch('/api/key');
											const keyData = await keyRequest.json() as { JWT: string };

											const formData = new FormData();
											formData.append(`file`, addedFileState.file);

											const { data: uploadResponse }: AxiosResponse<{ data: PinataUploadResponse }> = await axios.post(UPLOAD_ENDPOINT, formData, {
												headers: {
													Authorization: `Bearer ${keyData.JWT}`
												},
												onUploadProgress: async (progressEvent) => {
													if (progressEvent.total) {
														const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
														// console.log(`Upload progress: ${percentComplete.toFixed(2)}%`);
														updateFileProgress(addedFileState.key, percentComplete);
													}
												}
											});

											// console.log('Pinata Upload Response :>>', uploadResponse.data);

											await new Promise(resolve => setTimeout(resolve, 1000));
											updateFileProgress(addedFileState.key, 'COMPLETE');

											const data = addedFileState.type === 'PHOTO'
												? await getPhotoDimensions(addedFileState.preview)
												: await getVideoDimensions(addedFileState.preview);
											
											const metadata = { ...data, cid: uploadResponse.data.cid, type: addedFileState.type };
											setMediaMetadata(mediaMetadata => [...mediaMetadata, metadata]);
											setFileStates(previousStates => previousStates.map(state =>
												state.key === addedFileState.key ? { ...state, cid: uploadResponse.data.cid } : state
											));
										} catch (error) {
											updateFileProgress(addedFileState.key, 'ERROR');
										}
									})
								);
							}}
						/>

						<Button
							size='sm'
							variant='destructive'
							onClick={clearFailedUploads}
							className={cn(
								'rounded-lg shadow-sm hidden',
								fileStates.filter(state => state.progress === 'ERROR').length > 0 && 'block'
							)}
						>
							Clear failed uploads
						</Button>

						<Button
							size='sm'
							onClick={savePhotosToDatabase}
							className='bg-black hover:bg-core text-white w-max'
							disabled={isSaveDisabled || isUploadDisabled || completedFiles.length !== mediaMetadata.length}
						>
							<SaveIcon className='size-4 mr-2' />
							Save
						</Button>

						<div ref={tabBottomRef} />
					</TabsContent>
					<TabsContent value='manage' className='mt-0'>
						<div className='w-full'>
							{/* Tip */}
							{mediaItems.length > 0 && (
								<div className='bg-core border-l-4 border-primary/20 p-2.5 mt-3 rounded-lg relative overflow-hidden'>
									<StarIcon className='h-36 w-36 text-white absolute right-2 -top-9 z-0 stroke-1 opacity-20' />
									<p className='text-sm font-bold text-white'>Pro Tip</p>
									<p className='mt-1 text-sm text-white'>
										Arrange your media in chronological order for best results.
									</p>
								</div>
							)}

							<DndContext
								sensors={sensors}
								onDragStart={handleMediaDragStart}
								onDragEnd={handleMediaDragEnd}
								collisionDetection={closestCorners}
								modifiers={[restrictToVerticalAxis]}
							>
								{mediaItems.length > 0 && mediaItems.map((media, idx, array) => (
									<SortableContext
										key={media.id}
										items={mediaItems}
										strategy={verticalListSortingStrategy}
									>
										<MediaItem
											media={media}
											onMediaDelete={onMediaDelete}
											mediaNumber={`${idx + 1}`.padStart(`${array.length}`.length, '0')}
											handleDurationChange={handleDurationChange(media.id)}
											handleDescriptionChange={handleDescriptionChange(media.id)}
											handleTransitionChange={handleTransitionChange(media.id)}
										/>
									</SortableContext>
								))}

								<DragOverlay>
									{activeId ? (
										<PinataImage
											alt='...'
											width={80}
											height={80}
											className='w-20 h-20 object-cover rounded-md cursor-grabbing shadow-md'
											cid={mediaItems.find($ => $.id === activeId)?.cid || (mediaItems.find($ => $.id === activeId)?.previewCid ?? '')}
										/>
									) : null}
								</DragOverlay>
							</DndContext>

							{/* Empty state */}
							{mediaItems.length === 0 && (
								<div className='h-72 flex flex-col items-center justify-center gap-y-2'>
									<Image
										src='/images/empty-state-dark.svg'
										height='150'
										width='150'
										alt='No media yet'
										fetchPriority='high'
										className='hidden dark:block'
									/>
									<Image
										src='/images/empty-state-light.svg'
										height='150'
										width='150'
										alt='No media yet'
										fetchPriority='high'
										className='block dark:hidden'
									/>
									<h2 className='text-xl font-medium'>No Media Yet</h2>
									<p className='text-muted-foreground text-sm'>Upload your project media to get started</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</div>
			<SidebarPaneCloseButton pane='media' activePane={activePane} onClick={onClose} />
		</aside>
	);
};

export default MediaPane;
