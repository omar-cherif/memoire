import pinata from '#/lib/pinata';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GET = async (req: NextRequest, res: NextResponse) => {
	try {
		const { searchParams } = new URL(req.url);
		const cid = searchParams.get('cid');

		if (!cid) {
			return NextResponse.json({ error: 'Missing required parameter: cid' }, { status: 400 });
		}

		const file = await pinata.gateways.get(cid);

		const headers = new Headers();
		headers.set('Content-Type', file.contentType as string);

		// Return the file data as a Blob
		return new NextResponse(file.data as Blob, { status: 200, headers });
	} catch (error) {
		console.error('Error getting file:', error);
		return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
	}
};

export { GET };
