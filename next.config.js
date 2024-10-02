/** @type {import('next').NextConfig} */
const nextConfig = {
	// reactStrictMode: true,
	skipMiddlewareUrlNormalize: true,
	images: {
		dangerouslyAllowSVG: true,
		remotePatterns: [
			{ protocol: 'https', hostname: 'api.dicebear.com' },
			{ protocol: 'https', hostname: 'files.edgestore.dev' },
			{ protocol: 'https', hostname: 'aqua-deliberate-ox-482.mypinata.cloud' }
		]
	}
};

module.exports = nextConfig;
