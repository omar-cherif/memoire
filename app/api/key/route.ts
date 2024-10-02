import pinata from '#/lib/pinata';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GET = async (req: NextRequest, res: NextResponse) => {
	try {
		const uuid = crypto.randomUUID();
		const keyData = await pinata.keys.create({
			keyName: uuid.toString(),
			permissions: {
				endpoints: {
					pinning: {
						pinFileToIPFS: true
					}
				}
			},
			maxUses: 1
		});

		return NextResponse.json(keyData, { status: 200 });
	} catch (error) {
		console.log('Error creating upload API key :>>', error);
		return NextResponse.json({ text: 'Failed to create upload API key' }, { status: 500 });
	}
};

export { GET };
