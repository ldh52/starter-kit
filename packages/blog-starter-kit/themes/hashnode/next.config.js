const { request, gql } = require('graphql-request');

const ANALYTICS_BASE_URL = 'https://hn-ping2.hashnode.com';
const HASHNODE_ADVANCED_ANALYTICS_URL = 'https://user-analytics.hashnode.com';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;

const getBasePath = () => {
	if (BASE_URL && BASE_URL.indexOf('/') !== -1) {
		return BASE_URL.substring(BASE_URL.indexOf('/'));
	}
	return undefined;
};

const getRedirectionRules = async () => {
	const query = gql`
		query GetRedirectionRules {
			publication(host: "${host}") {
				id
				redirectionRules {
					source
					destination
					type
				}
			}
		}
  	`;

	const data = await request(GQL_ENDPOINT, query);

	if (!data.publication) {
		throw 'Please ensure you have set the env var NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST correctly.';
	}

	const redirectionRules = data.publication.redirectionRules;

	const redirects = redirectionRules
		.filter((rule) => {
			return rule.source.indexOf('*') === -1;
		})
		.map((rule) => {
			return {
				source: rule.source,
				destination: rule.destination,
				permanent: rule.type === 'PERMANENT',
			};
		});

	return redirects;
};

/**
 * @type {import('next').NextConfig}
 */
const config = {
	transpilePackages: ['@starter-kit/utils'],
	basePath: getBasePath(),
	experimental: {
		scrollRestoration: true,
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.hashnode.com',
			},
		],
	},
	async rewrites() {
		return [
			{
				source: '/ping/data-event',
				destination: `${ANALYTICS_BASE_URL}/api/data-event`,
			},
			{
				source: '/api/analytics',
				destination: `${HASHNODE_ADVANCED_ANALYTICS_URL}/api/analytics`,
			},
		];
	},
	async redirects() {
		return await getRedirectionRules();
	},
	// 추가된 메타데이터 설정
	metadata: {
		title: 'Companion Animal News',
		description: '지역별 반려동물 뉴스 & 반려동물 돌봄, 문화, 산업정보 큐레이션',
		openGraph: {
			title: 'Companion Animal News',
			description: '지역별 반려동물 뉴스 & 반려동물 돌봄, 문화, 산업정보 큐레이션',
			images: [
				{
					url: 'https://cdn.hashnode.com/res/hashnode/image/upload/v1739371517986/c139d17c-5629-440c-bcb3-9a489c609ca4.jpeg',
					width: 1200,
					height: 630,
				},
			],
		},
	},
};

module.exports = config;
