import pinata from '#/lib/pinata';
import { TimeUnit } from '#/types';
import { parseDuration } from '#/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, setRateLimitConfig } from '#/lib/rateLimit';
import { getCache, setCache, setCacheConfig } from '#/lib/cache';

export const dynamic = 'force-dynamic';

setRateLimitConfig('getSignedUrl', '1 m', 1000); // 1000 requests per minute
setCacheConfig('signedUrls', { max: 1000, ttl: 1000 * 60 * 60 }); // 1000 items, 1 hour TTL

const GET = async (req: NextRequest, res: NextResponse) => {
	try {
		const { searchParams } = new URL(req.url);
		const cid = searchParams.get('cid');
		const width = parseInt(searchParams.get('width') || '', 10);
		const height = parseInt(searchParams.get('height') || '', 10);
		const expires = (searchParams.get('expires') || '1 h') as `${number} ${TimeUnit}`;

		if (!cid || !width || !height) {
			return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
		}

		const isLimited = await rateLimit('getSignedUrl');
		if (isLimited) {
			return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
		}

		const cacheKey = `signedUrl:${cid}:${width}:${height}`;

		const cachedUrl = getCache<string>('signedUrls', cacheKey);
		if (cachedUrl) {
			return NextResponse.json({ url: cachedUrl }, { status: 200 });
		}

		const url = await pinata.gateways
			.createSignedURL({ cid, expires: parseDuration(expires) * 1000 })
			.optimizeImage({
				width,
				height,
				format: 'auto'
			});

		setCache('signedUrls', cacheKey, url);

		return NextResponse.json({ url }, { status: 200 });
	} catch (error) {
		console.error('Error generating or caching signed URL:', error);
		return NextResponse.json({ error: 'Failed to generate or retrieve signed URL' }, { status: 500 });
	}
};

export { GET };
