import type { AppType } from 'next/app';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { trpcAPI } from '@utils/trpc';

import '@styles/globals.css';
import MainLayout from '@components/shared/core/Layouts/Main';
import { DefaultSeo } from 'next-seo';
import NextSEODefaults from '@utils/core/next-seo.config';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import ExtraScripts from '@components/shared/core/ExtraScripts';
const DynamicTopProgressBar = dynamic(
	() => import('@components/shared/common/TopProgressBar'),
	{ ssr: false }
);

// import '@styles/dist.css';

// yarn add -D concurrently

// "dev": "concurrently \"next dev --turbo --show-all\" \"tailwindcss -i src/styles/globals.css -o src/styles/dist.css -w\"",
// "build": "tailwindcss -m -i src/styles/globals.css -o src/styles/dist.css && next build",

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps }
}) => {
	return (
		<SessionProvider
			session={session}
			refetchOnWindowFocus={false}
			refetchInterval={60 * 30}
		>
			<DefaultSeo {...NextSEODefaults} />
			<Head>
				<script
					id='google-analytics-script'
					async
					src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8030984398568253'
					crossOrigin='anonymous'
				></script>
			</Head>
			<MainLayout>
				<DynamicTopProgressBar />
				<Component {...pageProps} />
				<ExtraScripts />
			</MainLayout>
		</SessionProvider>
	);
};

export default trpcAPI.withTRPC(MyApp);
