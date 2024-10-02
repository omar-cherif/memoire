'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'react-toastify';
import { Button } from '#/components/ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';

const ModeToggle = () => {
	const { setTheme, theme } = useTheme();

	const toggleTheme = () => {
		return toast.info('Not implemented yet ;(');
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	return (
		<Button className='bg-white dark:bg-black hover:bg-black/10 dark:hover:bg-white/25 rounded-full' variant='outline' size='icon' onClick={toggleTheme}>
			<SunIcon className='block h-5 w-5 dark:hidden' />
			<MoonIcon className='hidden h-5 w-5 dark:block' />
			<span className='sr-only'>Toggle theme</span>
		</Button>
	);
};

export default ModeToggle;
