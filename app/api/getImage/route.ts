import { NextRequest, NextResponse } from 'next/server';

const GET = async (req: NextRequest, res: NextResponse) => {
	const { searchParams } = new URL(req.url);
	const imageUrl = searchParams.get('url');

	if (!imageUrl) {
		return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
	}

	try {
		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			throw new Error('Failed to fetch image');
		}

		const blob = await imageResponse.blob();

		return new NextResponse(blob, {
			status: 200,
			headers: {
				'Content-Type': blob.type,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (error) {
		console.error('Error fetching image:', error);
		return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
	}
};

export { GET };
