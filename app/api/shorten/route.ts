import { streamText } from 'ai';
import prisma from '#/lib/prisma';
import { Redis } from '@upstash/redis';
import { google } from '@ai-sdk/google';
import { getToken } from 'next-auth/jwt';
import { secondsToWords } from '#/lib/utils';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s')
});

export const POST = async (req: NextRequest, res: NextResponse) => {
	const token = await getToken({ req });
	if (!token) {
    return NextResponse.json({ message: 'Unauthenticated!' }, { status: 401 });
  }

  const { success } = await ratelimit.limit('shorten');
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
  if (!narration || (narration && narration.transcript.length === 0)) {
		return new Response('No narration yet!', { status: 400 });
	}
	if (media.length === 0) {
		return new Response('No media uploaded yet!', { status: 400 });
	}

	const hasDescriptionMedia = media.filter($ => $.description && $.description.trim() !== '');
	if (hasDescriptionMedia.length !== media.length) {
		return new Response('One or more media descriptions are missing!', { status: 400 });
	}
  
  const totalDuration = media.reduce((total, item) => total + item.duration, 0);
	console.log('totalDuration :>>', totalDuration);
	console.log('wordCount :>>', secondsToWords(totalDuration));

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

  const prompt = `You are an AI writing assistant tasked with shortening a given text to a specified word count while preserving its original structure. Your task:

1. Shorten the following text to EXACTLY ${secondsToWords(totalDuration)} words.
2. Maintain the original paragraph structure, including all line breaks.
3. Preserve the key ideas and main points from each paragraph.
4. Ensure the shortened text flows naturally and maintains coherence.
5. Do not add any new information or ideas not present in the original text.
6. Respond with only the shortened text, without any additional comments or explanations.

Here is the text to be shortened:

${narration.transcript}

Remember: The output must be EXACTLY ${secondsToWords(totalDuration)} words long, preserving all original paragraph breaks.`;
	
	const result = await streamText({
    model,
    prompt,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  });

  return result.toAIStreamResponse();
};
