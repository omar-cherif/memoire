'use client';

import { cn } from '#/lib/utils';
import { ActivePane } from '#/types';
import ComingSoonSection from '#/components/ComingSoonSection';
import SidebarPaneHeader from '#/components/project/SidebarPaneHeader';
import SidebarPaneCloseButton from '#/components/project/SidebarPaneCloseButton';

interface MusicPaneProps {
	activePane: ActivePane;
	onPaneChange: (pane: ActivePane) => void;
};

const MusicPane = ({
	activePane,
	onPaneChange
}: MusicPaneProps) => {
	const onClose = () => {
		onPaneChange(null);
	};

	return (
		<aside
			className={cn(
				'bg-white relative border-r z-20 w-full xs:w-[360px] h-full flex flex-col',
				activePane === 'music' ? 'visible' : 'hidden'
			)}
		>
			<SidebarPaneHeader
				title='Music'
				description='Generate background music for your project with AI.'
			/>
			<div className='p-3 flex-1 scrollbar-thin overflow-y-auto overflow-x-hidden'>
				<ComingSoonSection isHome={false} />
			</div>
			<SidebarPaneCloseButton pane='music' activePane={activePane} onClick={onClose} />
		</aside>
	);
};

export default MusicPane;
