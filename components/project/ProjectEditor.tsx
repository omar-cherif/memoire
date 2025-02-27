'use client';

import { useState } from 'react';
import { ActivePane } from '#/types';
import Sidebar from '#/components/project/Sidebar';
import VideoPreview from '#/components/VideoPreview';
import MediaPane from '#/components/project/panes/MediaPane';
import MusicPane from '#/components/project/panes/MusicPane';
import { useProject } from '#/components/contexts/ProjectContext';
import SettingsPane from '#/components/project/panes/SettingsPane';
import SubtitlePane from '#/components/project/panes/SubtitlePane';
import NarrationPane from '#/components/project/panes/NarrationPane';

const ProjectEditor = () => {
	const { project } = useProject();
	const [activePane, setActivePane] = useState<ActivePane>('media');

	const onPaneChange = (pane: ActivePane) => {
		setActivePane(activePane === pane ? null : pane);
	};

	return (
		<div className='absolute h-[calc(100%-4.5rem)] w-full top-[4.5rem] flex'>
			<Sidebar
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<MediaPane
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<NarrationPane
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<MusicPane
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<SubtitlePane
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<SettingsPane
				projectId={project.id}
				activePane={activePane}
				onPaneChange={onPaneChange}
			/>
			<main className='bg-muted flex-1 overflow-hidden relative'>
				<VideoPreview />
				{/* <CanvasVideoPreview /> */}
			</main>
		</div>
	)
}

export default ProjectEditor;
