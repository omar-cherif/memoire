'server only';

import { PinataSDK as Pinata } from 'pinata';

export const UPLOAD_ENDPOINT = `https://uploads.pinata.cloud/v3/files`;

const pinata = new Pinata({
	pinataJwt: `${process.env.PINATA_JWT}`,
	pinataGateway: `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}`
});

export default pinata;
