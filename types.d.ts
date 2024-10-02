import { Prisma, $Enums } from '@prisma/client';
import { type DefaultSession } from 'next-auth';
import { transitions, voices, aspectRatios, frameRates } from '#/lib/utils';

export type ExtendedUser = DefaultSession['user'] & {
  id: string;
  role: $Enums.Role;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends ExtendedUser {}
}

export type ProjectType = Prisma.ProjectGetPayload<true>;
export type MediaItemType = Prisma.MediaGetPayload<true>;
export type NarrationType = Prisma.NarrationGetPayload<true>;

export type ActivePane = 'media' | 'narration' | 'music' | 'subtitle' | 'settings' | null;

export interface UploadResult {
  cid: string;
  preview?: string;
  file?: File;
};

export interface MediaMetadata extends UploadResult {
  width: number;
  height: number;
  type: $Enums.MediaType;
};

export interface PinataUploadResponse {
  id: string;
  name: string;
  cid: string;
  size: number;
  created_at: string;
  number_of_files: number;
  mime_type: string;
  user_id: string;
  group_id: string | null;
};

export type TransitionType = typeof transitions[number]['id'];
export type Voice = typeof voices[number]['id'];
export type AspectRatio = typeof aspectRatios[number]['ratio'];
export type FrameRate = typeof frameRates[number]['value'];
export type OutputQuality = '4K' | '1080P' | '720P' | '480P';

export type TimeUnit =
  | 's' | 'sec' | 'seconds'
  | 'm' | 'min' | 'minutes'
  | 'h' | 'hour' | 'hours'
  | 'd' | 'day' | 'days'
  | 'w' | 'week' | 'weeks'
  | 'm' | 'month' | 'months'
  | 'y' | 'year' | 'years';
