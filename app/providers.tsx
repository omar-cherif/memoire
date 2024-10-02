'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '#/components/providers/ThemeProvider';
import { ModalProvider } from '#/components/providers/ModalProvider';

const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<SessionProvider>
			<ThemeProvider attribute='class' defaultTheme='light' storageKey='theme' disableTransitionOnChange>
				<ModalProvider />
				{children}
			</ThemeProvider>
		</SessionProvider>
	)
}

export default Providers;
