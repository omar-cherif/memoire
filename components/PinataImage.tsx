'use client';

import { TimeUnit } from '#/types';
import { db } from '#/lib/browserDatabase';
import Image, { type ImageProps } from 'next/image';
import { Skeleton } from '#/components/ui/skeleton';
import { FC, memo, useState, useEffect, useMemo } from 'react';

interface PinataImageProps extends Omit<ImageProps, 'src'> {
	cid?: string;
	src?: string;
	expires?: `${number} ${TimeUnit}`;
}

const PinataImage: FC<PinataImageProps> = ({ cid, src, width, height, alt, className, expires = '1 h', ...props }) => {
	const [imageUrl, setImageUrl] = useState<string | null>(src || null);

	useEffect(() => {
		if (src) {
			setImageUrl(src);
			return;
		}

		if (!cid) return;

		const getImage = async () => {
			try {
				const cachedImage = await db.images.where({ cid, width, height }).first();
				if (cachedImage) {
					setImageUrl(URL.createObjectURL(cachedImage.blob));
					return;
				}

				const params = new URLSearchParams({
					cid,
					width: width?.toString() || '',
					height: height?.toString() || '',
					expires
				});

				const response = await fetch(`/api/getSignedUrl?${params}`);

				if (!response.ok) {
					throw new Error('Failed to fetch signed URL');
				}

				const data = await response.json() as { url: string };

				// Use the new API route to fetch the image
				const imageResponse = await fetch(`/api/getImage?url=${encodeURIComponent(data.url)}`);

				if (!imageResponse.ok) {
					throw new Error('Failed to fetch image');
				}

				const blob = await imageResponse.blob();
				const objectUrl = URL.createObjectURL(blob);
				setImageUrl(objectUrl);

				// Save to IndexedDB
				await db.images.put({ cid, width: Number(width), height: Number(height), blob });
			} catch (error) {
				console.error('Error fetching image :>>', error);
			}
		};

		getImage();
	}, [cid, src, width, height, expires]);

	const renderedImage = useMemo(() => {
		if (imageUrl) {
			return (
				<Image
					src={imageUrl}
					unoptimized={!!src}
					width={Number(width)}
					height={Number(height)}
					alt={alt}
					className={className}
					crossOrigin='anonymous'
					{...props}
				/>
			);
		} else {
			return (
				<Skeleton className={className} />
			);
		}
	}, [imageUrl, width, height, src, alt, className, props]);

	return renderedImage;
};

export default memo(PinataImage);
