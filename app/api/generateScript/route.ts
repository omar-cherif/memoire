import prisma from '#/lib/prisma';
import { generateObject } from 'ai';
import { Redis } from '@upstash/redis';
import { google } from '@ai-sdk/google';
import { getToken } from 'next-auth/jwt';
import { wordsInSeconds } from '#/lib/utils';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest, NextResponse } from 'next/server';
import { NarrationGenerationSchema } from '#/lib/validations';

export const maxDuration = 30;
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(6, '60 s')
});

export const POST = async (req: NextRequest, res: NextResponse) => {
	const token = await getToken({ req });
	if (!token) {
    return NextResponse.json({ message: 'Unauthenticated!' }, { status: 401 });
  }

  const { success } = await ratelimit.limit('generateScript');
  if (!success) {
    return new Response('Rate limited!', { status: 429 });
  }

  const { projectId } = await req.json();
	
	const [project, media, narration] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId, userId: token.sub } }),
    prisma.media.findMany({ where: { projectId } }),
    prisma.narration.findUnique({ where: { projectId } })
  ]);

  if (!project) {
		return new Response('Project not found!', { status: 400 });
	}
  if (!project.description) {
		return new Response('Project description not found!', { status: 400 });
	}
  if (media.length === 0) {
		return new Response('No media uploaded yet!', { status: 400 });
	}

	const hasDescriptionMedia = media.filter($ => $.description && $.description.trim() !== '');
	if (hasDescriptionMedia.length !== media.length) {
		return new Response('One or more media descriptions are missing!', { status: 400 });
	}

	const formattedMedia = media.map(($, idx) => {
		return `${idx + 1}.
    ID: ${$.id}
    Type: ${$.type}
    Description: ${$.description}
    Narration Word Count: ${wordsInSeconds($.duration, 182)}`;
	});

  const model = google('models/gemini-1.5-flash-latest', {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
      }
    ]
  });

  const prompt = `You are a professional video scriptwriter tasked with creating a cohesive narrative for a series of photos and videos. Your goal is to craft a story that flows naturally while adhering to strict word count limits for each media item.

Instructions:
1. Create a narrative that chronologically describes the media items using first-person past tense.
2. Adopt a casual, conversational tone as if sharing the experience with friends.
3. Ensure continuity between items without inventing details not present in the descriptions.
4. Use concise, engaging language to maintain interest and clarity.
5. Strictly adhere to the specified word count for each media item's narration.
6. Do not mention the media type (photo/video) in your narrations.
7. If the project description is vague, infer the project's theme from the media descriptions.
8. Craft the narrative to flow smoothly from one item to the next, creating a cohesive story.
9. Maintain the exact order of media items as provided in the input. Do not rearrange or omit any items.

Output JSON in the following format:

{
  "title": "Project Title",
  "description": "A brief, engaging description of the overall project",
  "hashtags": ["#RelevantHashtag1", "#RelevantHashtag2"],
  "mediaItems": [
    {
      "id": "unique_id_1",
      "type": "PHOTO", // or VIDEO
      "narration": "Concise narration within the specified word count"
    },
    // ... additional media items in the same order as provided in the input
  ]
}

Project Description:
${project.description}

Media Items:
${formattedMedia.join('\n\n')}

Remember: 
- Each narration MUST NOT exceed its specified word count. 
- Create a flowing narrative that connects all items cohesively.
- Preserve the exact order of media items as given in the input.`;

  console.log(':>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  console.log('prompt :>>', prompt);
  console.log(':>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  const result = await generateObject({
    model,
		prompt,
    temperature: 0.5,
		schema: NarrationGenerationSchema,
		mode: 'json'
  });

  // console.log(':>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  // console.log('Result Object :>>', JSON.stringify(result.object, null, 2));
  // console.log(':>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');

  const sortedMediaItems = [...result.object.mediaItems].sort((first, next) =>
    project.mediaOrder.indexOf(first.id) - project.mediaOrder.indexOf(next.id)
  );

	const transcript = sortedMediaItems.map($ => $.narration).join('\n\n');

  if (narration) {
    await prisma.narration.update({ where: { id: narration.id }, data: { transcript } });
  } else {
    await prisma.narration.create({ data: { transcript, projectId: project.id } });
  }

  return result.toJsonResponse();
};
