/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['socialinternship.kluniversity.in'],
    },
    allowedDevOrigins: [
        'socialinternship.kluniversity.in',
        'https://socialinternship.kluniversity.in'
    ],
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'https://socialinternship.kluniversity.in',
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
