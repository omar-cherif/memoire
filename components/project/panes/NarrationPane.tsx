'use client';

import { toast } from 'react-toastify';
import { Prisma } from '@prisma/client';
import { Label } from '#/components/ui/label';
import { Button } from '#/components/ui/button';
import { useDebounceCallback } from 'usehooks-ts';
import { Textarea } from '#/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { useCompletion } from '#/hooks/useCompletion';
import usePreviousValue from '#/hooks/usePreviousValue';
import { updateNarration } from '#/lib/actions/mutations';
import { ActivePane, NarrationType, Voice } from '#/types';
import { NarrationGenerationSchema } from '#/lib/validations';
import { cn, readingTimeInSeconds, voices } from '#/lib/utils';
import { useProject } from '#/components/contexts/ProjectContext';
import SidebarPaneHeader from '#/components/project/SidebarPaneHeader';
import SidebarPaneCloseButton from '#/components/project/SidebarPaneCloseButton';
import { ChangeEvent, FormEvent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { SquareIcon, SparklesIcon, ChevronDownIcon, MicIcon, PlayIcon, PauseIcon, PodcastIcon, AlertTriangleIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '#/components/ui/dropdown-menu';

interface NarrationPaneProps {
	activePane: ActivePane;
	onPaneChange: (pane: ActivePane) => void;
};

const NarrationPane = ({
	activePane,
	onPaneChange
}: NarrationPaneProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const voiceRef = useRef<HTMLAudioElement | null>(null);
	const [isVoiceSelectOpen, setIsVoiceSelectOpen] = useState(false);
	const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
	const [playingVoice, setPlayingVoice] = useState<Voice | null>(null);
	const { project, mediaItems, narration, setNarration } = useProject();
	const [narrationValue, setNarrationValue] = useState(narration?.transcript ?? '');
	const [fetchedVoices, setFetchedVoices] = useState<Map<string, string>>(new Map());
	const [abortController, setAbortController] = useState<AbortController | null>(null);
	const [selectedVoice, setSelectedVoice] = useState<Voice>(narration?.voice as Voice);
	const previousVoice = usePreviousValue(selectedVoice);

	const { mutate: updateNarrationMutation } = useMutation({
		mutationKey: [`project-${project.id}`],
		mutationFn: async (data: Prisma.NarrationUpdateInput) => {
			try {
				const updatedProject = await updateNarration(project.id, data);

				return updatedProject;
			} catch (error) {
				throw error;
			}
		},
		onSuccess: (data) => {
			setNarration({ transcript: data.transcript });
		}
	});

	const debouncedUpdateNarration = useDebounceCallback(updateNarrationMutation, 500);

	const stopGeneration = useCallback(() => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	}, [abortController]);

	const { completion: shortenedNarration, trigger: shorten, isLoading: isShortening, stop: stopShortening } = useCompletion({
		api: '/api/shorten',
		body: { projectId: project.id },
		onResponse: (res) => {
			if (res.status === 429) {
				toast.error(`You've been rate limited! Please try again later.`);
			}
		},
		onFinish(_, completion) {
			setNarrationValue(completion.trim());
			debouncedUpdateNarration({ transcript: completion.trim() });
		}
	});

	useEffect(() => {
		if (shortenedNarration) {
			setNarrationValue(shortenedNarration.trim());
		}
	}, [shortenedNarration]);
	
	const onClose = () => {
		onPaneChange(null);
	};

	const handleFormSubmit = async (e: FormEvent) => {
		e.preventDefault();

		const controller = new AbortController();
		setAbortController(controller);
		setIsLoading(true);

		try {
			const response = await fetch('/api/generateScript', {
				method: 'POST',
				body: JSON.stringify({ projectId: project.id }),
				signal: controller.signal
			});

			if (!response.ok) {
				return toast.error(await response.text());
			}

			const object = await response.json();
			const data = NarrationGenerationSchema.parse(object);
			const transcript  = data.mediaItems.map($ => $.narration).join('\n\n');
			setNarrationValue(transcript);

			console.log('Generation Data :>>', data);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Fetch request was aborted');
			} else {
				toast.error(error.message);
			}
		} finally {
			console.log('[finally] reached...');
			setIsLoading(false);
		}
	};

	const handleAudioGeneration = async () => {
		const controller = new AbortController();
		setAbortController(controller);
		setIsGeneratingAudio(true);

		try {
			const response = await fetch('/api/generateNarration', {
				method: 'POST',
				body: JSON.stringify({ projectId: project.id }),
				signal: controller.signal
			});

			if (!response.ok) {
				return toast.error(await response.text());
			}

			const result = await response.json() as { message: string; data: NarrationType };
			setNarration({ audioCid: result.data.audioCid });

			console.log('Audio Generation Data :>>', result);
		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setIsGeneratingAudio(false);
		}
	};

	const handleNarrationChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		if (isShortening) return;

		if (narrationValue) {
			debouncedUpdateNarration({ transcript: e.target.value });
		}

		setNarrationValue(e.target.value);
	};

	const handleVoiceSelect = (voice: Voice) => {
		if (previousVoice !== voice && narrationValue) {
			setSelectedVoice(voice);
			debouncedUpdateNarration({ voice });
		}

		setIsVoiceSelectOpen(false);
	};

	const onVoiceSelectOpenChange = (open: boolean) => {
		setIsVoiceSelectOpen(open);
	};

	const handleVoicePreviewClick = (e: MouseEvent<HTMLButtonElement>, voice: Voice) => {
		e.preventDefault();

		const fetchedVoiceUrl = fetchedVoices.get(voice);
		if (fetchedVoiceUrl) {
			if (voiceRef.current) {
				if (playingVoice === voice) {
					voiceRef.current.pause();
					setPlayingVoice(null);
				} else {
					voiceRef.current.src = fetchedVoiceUrl;
					voiceRef.current.play();
					setPlayingVoice(voice);
				}
			}
		}
	};

	useEffect(() => {
		const handleAudioEnded = () => setPlayingVoice(null);
		if (voiceRef.current) {
			voiceRef.current.addEventListener('ended', handleAudioEnded);
		}

		return () => {
			if (voiceRef.current) {
				// eslint-disable-next-line react-hooks/exhaustive-deps
				voiceRef.current.removeEventListener('ended', handleAudioEnded);
			}
		};
	}, []);

	useEffect(() => {
		const fetchVoices = async () => {
			const newFetchedVoices = new Map<string, string>();
			for (const voice of voices) {
				const response = await fetch(voice.src);
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				newFetchedVoices.set(voice.id, url);
			}

			setFetchedVoices(newFetchedVoices);
		};

		fetchVoices();
	}, []);

	const isDisabled = isLoading || isShortening || isGeneratingAudio;
	const totalDuration = mediaItems.reduce((total, item) => total + item.duration, 0);
	const isNarrationWarningActive = narrationValue.length > 0
		? readingTimeInSeconds(narrationValue) > totalDuration
		: false;

	console.log('totalDuration :>>', totalDuration);
	console.log('readingTimeInSeconds(narration) :>>', readingTimeInSeconds(narrationValue));

	return (
		<aside
			className={cn(
				'bg-white relative border-r z-20 w-full xs:w-[360px] h-full flex flex-col',
				activePane === 'narration' ? 'visible' : 'hidden'
			)}
		>
			<SidebarPaneHeader
				title='Narration'
				description='Create, review & update the AI-generated narration.'
			/>
				<div className='p-3 flex-1 scrollbar-thin overflow-y-auto overflow-x-hidden'>
					<div className='flex flex-col flex-1 gap-y-2 mr-px'>
						<div className='space-y-1 relative'>
							<Label htmlFor='transcript'>Transcript</Label>
							<form onSubmit={handleFormSubmit} className='absolute right-0 -top-2'>
								{isLoading ? (
									<Button size='sm' variant='outline' onClick={stopGeneration} className='bg-red-200 hover:bg-red-600 text-red-600 hover:text-white border-red-600 text-xs w-max h-7 px-2'>
										<SquareIcon className='size-3.5 mr-1.5' />
										Stop generation
									</Button>
								) : (
									<Button size='sm' type='submit' disabled={isDisabled} className='bg-core hover:bg-black text-white text-xs w-max h-7 px-2'>
										<SparklesIcon className='size-3.5 mr-1.5' />
										Generate with AI
									</Button>
								)}
							</form>
							<Textarea
								id='transcript'
								value={narrationValue}
								onChange={handleNarrationChange}
								maxLength={1500}
								className='p-2 h-40 resize-none scrollbar-thin'
								disabled={isDisabled}
								placeholder={`Please click the button above to ${narrationValue.length > 0 ? 're' : ''}generate your transcript`}
							/>
							<span className='text-xs text-muted-foreground absolute right-0 -bottom-5 select-none'>{narrationValue.length}/1500</span>
						</div>

						{/* Narration Warning */}
						{isNarrationWarningActive && (
							<div className='bg-yellow-500 border-l-4 border-primary/20 p-2.5 mt-3 rounded-lg relative overflow-hidden'>
								<AlertTriangleIcon className='h-36 w-36 text-white absolute right-2 -top-9 z-0 stroke-1 opacity-20' />
								<p className='text-sm font-bold text-white'>Warning</p>
								<p className='mt-1 text-sm text-white'>
									The time taken to read this narration exceeds the total duration of your project. Click the button below to shorten it.
								</p>
								{isShortening ? (
									<Button size='sm' variant='outline' onClick={stopShortening} className='mt-1.5 bg-red-600 text-white border-red-600 hover:border-black text-xs w-max h-7 px-2'>
										<SquareIcon className='size-3.5 mr-1.5' />
										Stop shortening
									</Button>
								) : (
									<Button size='sm' type='submit' onClick={() => shorten()} disabled={isDisabled} className='mt-1.5 bg-black/20 hover:bg-black text-white text-xs w-max h-7 px-2'>
										<SparklesIcon className='size-3.5 mr-1.5' />
										Shorten with AI
									</Button>
								)}
							</div>
						)}

						<div className='space-y-1'>
							<Label htmlFor='voice'>Voice</Label>
							<audio ref={voiceRef} className='sr-only' />
							<DropdownMenu open={isVoiceSelectOpen} onOpenChange={onVoiceSelectOpenChange}>
								<DropdownMenuTrigger disabled={fetchedVoices.size !== voices.length || isDisabled} asChild>
									<Button id='voice' variant='outline' className='w-full flex items-center justify-between px-2 [&[data-state=open]>svg]:rotate-180'>
										<div className='flex items-center gap-y-1'>
											<MicIcon className='w-4 h-4 mr-2' />
											<span>{voices.find($ => $.id === selectedVoice)?.text || 'Select Voice'}</span>
										</div>
										<ChevronDownIcon className='w-4 h-4 shrink-0 transition-transform duration-200' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='start' className='w-48 p-2'>
									<div className='grid gap-1'>
										{voices.map(voice => (
											<DropdownMenuItem
												key={voice.id}
												onSelect={() => handleVoiceSelect(voice.id)}
												className={cn(
													'flex items-center justify-between cursor-pointer rounded-md',
													selectedVoice === voice.id && 'bg-accent text-accent-foreground'
												)}
											>
												<div className='font-medium'>{voice.text}</div>
												<Button onClick={e => handleVoicePreviewClick(e, voice.id)} size='icon' className='rounded-full w-8 h-8'>
													{playingVoice === voice.id ? <PauseIcon className='w-4 h-4' /> : <PlayIcon className='w-4 h-4' />}
												</Button>
											</DropdownMenuItem>
										))}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<div className='mx-auto'>
							{isGeneratingAudio ? (
								<Button size='sm' variant='outline' onClick={stopGeneration} className='bg-red-200 hover:bg-red-600 text-red-600 hover:text-white border-red-600 text-xs w-max h-7 px-2'>
									<SquareIcon className='size-3.5 mr-1.5' />
									Cancel generation
								</Button>
							) : (
								<Button onClick={handleAudioGeneration} size='sm' disabled={isDisabled || !narrationValue} className='bg-black hover:bg-core text-white text-xs w-max h-7 px-2'>
									<PodcastIcon className='size-3.5 mr-1.5' />
									Generate narration
								</Button>
							)}
						</div>

						<audio src={narration?.audioUrl} className='w-full' controls>
							Your browser does not support the audio element.
						</audio>
					</div>
				</div>
			<SidebarPaneCloseButton pane='narration' activePane={activePane} onClick={onClose} />
		</aside>
	);
};

export default NarrationPane;
