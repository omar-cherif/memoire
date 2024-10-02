'use server';

import pinata from '#/lib/pinata';

const getFile = async (cid: string): Promise<Blob> => {
	if (!cid) {
		throw new Error('Missing required parameters');
	}

	try {
		const file = await pinata.gateways.get(cid);

		return file.data as Blob;
	} catch (error) {
		console.error('Error getting file:', error);
		throw new Error('Failed to retrieve file');
	}
}

export default getFile;
