import Link from 'next/link';
import Image from 'next/image';
import { Button } from '#/components/ui/button';
import { cn } from '#/lib/utils';

interface ComingSoonSectionProps {
	isHome?: boolean;
};

const ComingSoonSection = ({
	isHome = true
}: ComingSoonSectionProps) => {
	return (
		<div className='h-full flex flex-col items-center justify-center space-y-4'>
			{isHome
				? <Image src='/images/rocket.png' width={96} height={96} alt='Coming soon' />
				: <Image src='/images/rocket.png' width={64} height={64} alt='Coming soon' />}
			
			<h2 className={cn('text-xl mt-4 font-medium', isHome && 'text-2xl')}>Launching Soon!</h2>
			{isHome && (
				<Link href='/'>
					<Button className='bg-core hover:bg-blue-600 transition-colors duration-300'>
						Go home
					</Button>
				</Link>
			)}
		</div>
	)
}

export default ComingSoonSection;
