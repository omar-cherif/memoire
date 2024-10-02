import { Skeleton } from '#/components/ui/skeleton';

const Loading = () => {
	return (
		<div className='h-svh flex flex-col'>
			{/* Navbar Skeleton */}
			<nav className='w-full flex items-center p-4 h-[4.5rem] gap-x-8 border-b'>
				<Skeleton className='ml-3 size-10 shrink-0' />
				<Skeleton className='h-9 flex-1 rounded-xl' />
			</nav>

			{/* Project Editor Skeleton */}
			<div className='absolute h-[calc(100%-4.5rem)] w-full top-[4.5rem] flex'>
				{/* Sidebar */}
				<aside className='bg-white flex flex-col w-[100px] z-30 h-full border-r overflow-y-auto'>
					<div className='flex flex-col m-1.5 space-y-1.5'>
						<div className='w-full h-[4.25rem]' />
					</div>
				</aside>
			</div>
		</div>
	);
}

export default Loading;
