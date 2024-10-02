import prisma from '#/lib/prisma';
import type { Metadata } from 'next';
import authConfig from '#/auth.config';
import { notFound } from 'next/navigation';
import { reorderByField } from '#/lib/utils';
import { Session, getServerSession } from 'next-auth';
import { getProjectTitle } from '#/lib/actions/queries';
import ProjectId from '#/app/project/[projectId]/ProjectId';
import { ProjectProvider } from '#/components/contexts/ProjectContext';

export const generateMetadata = async ({ params }: PageProps) => {
	const projectTitle = await getProjectTitle(params.projectId);
	if (!projectTitle) {
		notFound();
	}

	return {
		title: `${projectTitle} / Project ~ Memoire`
	} as Metadata;
};

interface PageProps {
	params: {
		projectId: string;
	};
};

const Page = async ({ params }: PageProps) => {
	const session = await getServerSession(authConfig) as Session;
	const [project, mediaItems, narration] = await Promise.all([
		prisma.project.findUnique({ where: { id: params.projectId, userId: session.user.id } }),
		prisma.media.findMany({ where: { projectId: params.projectId } }),
		prisma.narration.findUnique({ where: { projectId: params.projectId }, select: { transcript: true, audioCid: true, voice: true } })
	]);

	if (!project) {
		notFound();
	}

	const reorderedMediaItems = reorderByField(mediaItems, project.mediaOrder, 'id');

	return (
		<ProjectProvider initialProject={project} initialMediaItems={reorderedMediaItems} initialNarration={narration}>
			<ProjectId initialData={project} params={params} />
		</ProjectProvider>
	);
};

export default Page;
