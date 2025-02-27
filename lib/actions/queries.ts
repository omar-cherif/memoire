'use server';

import prisma from '#/lib/prisma';
import { Prisma } from '@prisma/client';

export const getProjectsByUserId = async (userId: string, isStarred: boolean) => {
	let where: Prisma.ProjectWhereInput = { userId };
	if (isStarred) where = { userId, isStarred };

	const projects = await prisma.project.findMany({
		where,
		orderBy: { createdAt: 'desc' }
	});

	return projects;
};

export const getProjectTitle = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

	if (!project) return null;

  return project.title;
};
