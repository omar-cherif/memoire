'use client';

import Image from 'next/image';
import Loader from 'react-ts-loaders';
import { OutputQuality } from '#/types';
import { DownloadIcon } from 'lucide-react';
import { FC, useState, useEffect } from 'react';
import { Button } from '#/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '#/components/ui/dialog';

interface ExportModalProps {
	isOpen: boolean;
	onClose: () => void;
	quality: OutputQuality | null;
	projectId: string;
};

const ExportModal: FC<ExportModalProps> = ({ isOpen, onClose, quality, projectId }) => {
	const [isGenerating, setIsGenerating] = useState(false);
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen && quality) {
			generatePreview();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, quality]);

	const downloadExport = () => {
		// Automatically trigger download
		const link = document.createElement('a');
		link.href = downloadUrl as string;
		link.download = `preview-${projectId} (${quality}).mp4`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const generatePreview = async () => {
		if (!quality) return;
		setIsGenerating(true);
		
		try {
			const response = await fetch(`/api/generatePreview?projectId=${projectId}&quality=${quality}`);
			if (!response.ok) {
				throw new Error('Failed to generate preview');
			}

			const data = await response.json();
			setDownloadUrl(data.data.preview);

			downloadExport();
		} catch (error) {
			console.error('Export error :>>', error);
			// Show error message to user...
		} finally {
			setIsGenerating(false);
		}
	};

	const onOpenChange = (open: boolean) => {
		if (isGenerating) return;
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className='!w-auto px-16'>
				{isGenerating ? (
					<>
						<DialogHeader className='text-center my-3 mx-auto'>
							<Loader size={72} type='spinner' className='text-black dark:text-white p-8' />
						</DialogHeader>

						<h4 className='italic text-center text-[1.25rem] text-muted-foreground'>
							Generating preview... Please wait.
						</h4>
					</>
				) : (
					<>
						<DialogHeader className='text-center my-3 mx-auto'>
							<Image
								src='/images/rocket.png'
								width={96}
								height={96}
								alt='Video exported successfully!'
							/>
						</DialogHeader>
						<h4 className='italic text-center text-[1.25rem] text-muted-foreground'>
							Video exported successfully!
						</h4>
						<Button onClick={downloadExport} size='sm' className='bg-core hover:bg-black text-white mx-auto'>
							Download
							<DownloadIcon className='size-4 ml-2' />
						</Button>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ExportModal;
