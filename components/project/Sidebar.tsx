'use client';

import {
	MicIcon,
	MusicIcon,
	SettingsIcon,
	ImagePlusIcon,
	SubtitlesIcon
} from 'lucide-react';
import { ActivePane } from '#/types';
import SidebarItem from '#/components/project/SidebarItem';

interface SidebarProps {
	activePane: ActivePane;
	onPaneChange: (pane: ActivePane) => void;
};

const Sidebar = ({
	activePane,
	onPaneChange
}: SidebarProps) => {
	return (
		<aside className='bg-white flex flex-col flex-shrink-0 w-[88px] xs:w-[100px] z-30 h-full border-r overflow-y-auto'>
			<div className='flex flex-col m-1.5 space-y-1.5'>
				<SidebarItem
					id='mediaButton'
					icon={ImagePlusIcon}
					label='Media'
					isActive={activePane === 'media'}
					onClick={() => onPaneChange('media')}
				/>
				<SidebarItem
					id='narrationButton'
					icon={MicIcon}
					label='Narration'
					isActive={activePane === 'narration'}
					onClick={() => onPaneChange('narration')}
				/>
				<SidebarItem
					id='musicButton'
					icon={MusicIcon}
					label='Music'
					isActive={activePane === 'music'}
					onClick={() => onPaneChange('music')}
				/>
				<SidebarItem
					id='subtitleButton'
					icon={SubtitlesIcon}
					label='Subtitle'
					isActive={activePane === 'subtitle'}
					onClick={() => onPaneChange('subtitle')}
				/>
				<SidebarItem
					id='settingsButton'
					icon={SettingsIcon}
					label='Settings'
					isActive={activePane === 'settings'}
					onClick={() => onPaneChange('settings')}
				/>
			</div>
		</aside>
	);
};

export default Sidebar;
