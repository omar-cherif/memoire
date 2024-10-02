'use server';

import pinata from '#/lib/pinata';
import { TimeUnit } from '#/types';
import { parseDuration } from '#/lib/utils';
import { rateLimit, setRateLimitConfig } from '#/lib/rateLimit';
import { getCache, setCache, setCacheConfig } from '#/lib/cache';

setRateLimitConfig('getSignedUrl', '1 m', 1000); // 1000 requests per minute
setCacheConfig('signedUrls', { max: 1000, ttl: 1000 * 60 * 60 }); // 1000 items, 1 hour TTL

const getSignedUrl = async (cid: string, width: number, height: number, expires: `${number} ${TimeUnit}` = '1 h'): Promise<string> => {
	if (!cid || !width || !height) {
		throw new Error('Missing required parameters');
	}

	const isLimited = await rateLimit('getSignedUrl');
	if (isLimited) {
		throw new Error('Rate limit exceeded');
	}

	const cacheKey = `signedUrl:${cid}:${width}:${height}`;

	try {
		const cachedUrl = getCache<string>('signedUrls', cacheKey);
		if (cachedUrl) {
			return cachedUrl;
		}

		const url = await pinata.gateways
			.createSignedURL({ cid, expires: parseDuration(expires) * 1000 })
			.optimizeImage({
				width,
				height,
				format: 'auto'
			});

		setCache('signedUrls', cacheKey, url);

		return url;
	} catch (error) {
		console.error('Error generating or caching signed URL:', error);
		throw new Error('Failed to generate or retrieve signed URL');
	}
}

export default getSignedUrl;
