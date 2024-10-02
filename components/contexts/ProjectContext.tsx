'use client';

import { ProjectType, MediaItemType, NarrationType } from '#/types';
import { createContext, FC, ReactNode, useContext, useState } from 'react';

type ProjectContextType = {
  mediaItems: MediaItemType[];
  setMediaItems: (mediaItems: MediaItemType[]) => void;
  project: ProjectType;
  setProject: (project: Partial<ProjectType>) => void;
  narration: Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'> & { audioUrl?: string } | null;
  setNarration: (narration: Partial<Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'> & { audioUrl?: string }> | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

type ProjectProviderProps = {
  initialMediaItems: MediaItemType[];
  initialProject: ProjectType;
  initialNarration: Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'> | null;
  children: ReactNode;
};

export const ProjectProvider: FC<ProjectProviderProps> = ({
  initialMediaItems,
  initialProject,
  initialNarration,
  children
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItemType[]>(initialMediaItems);
  const [project, setProject] = useState<ProjectType>(initialProject);
  const [narration, setNarration] = useState<Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'> | null>(initialNarration);

  const updateProject = (updatedFields: Partial<ProjectType>) => {
    setProject(previousProject => ({ ...previousProject, ...updatedFields }));
  };

  const updateNarration = (updatedFields: Partial<Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'>> | null) => {
    if (updatedFields === null) {
      setNarration(null);
    } else {
      setNarration(previousNarration => previousNarration ? { ...previousNarration, ...updatedFields } : updatedFields as Pick<NarrationType, 'transcript' | 'audioCid' | 'voice'>);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        mediaItems,
        setMediaItems,
        project,
        setProject: updateProject,
        narration,
        setNarration: updateNarration
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// useProject hook
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
