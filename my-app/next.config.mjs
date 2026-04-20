/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'socialinternship.kluniversity.in',
            },
            {
                protocol: 'https',
                hostname: 'i.imghippo.com',
            },
            {
                protocol: 'https',
                hostname: 'www.imghippo.com',
            },
            {
                protocol: 'https',
                hostname: 'loremflickr.com',
            },
        ],
    },
    allowedDevOrigins: [
        'socialinternship.kluniversity.in',
        '192.168.2.49',
    ],
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NODE_ENV === 'production' 
                            ? 'https://socialinternship.kluniversity.in' 
                            : '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
                    },
                ],
            },
        ]
    },
};

export default nextConfig;
