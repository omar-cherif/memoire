import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';
import { OutputQuality, TimeUnit } from '#/types';

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};

export const getScrollbarWidth = () => {
  const div = document.createElement('div');

  div.style.width = '100px';
  div.style.height = '100px';
  div.style.overflow = 'scroll';
  div.style.position = 'absolute';
  div.style.top = '-9999px';

  document.body.appendChild(div);

  // Calculate the scrollbar width
  const scrollbarWidth = div.offsetWidth - div.clientWidth;

  document.body.removeChild(div);

  return scrollbarWidth;
};

export const generateDefaultAvatar = (seed: string) => {
  return `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${seed}`;
};

export const blurActiveElement = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement) activeElement.blur();
};

export const generateRandomChars = (() => {
	const generateChars = (min: number, max: number): string[] => Array.from({ length: max - min + 1 }, (_, i) => String.fromCharCode(min + i));

	const sets = {
		numeric: generateChars(48, 57),
		lowerCase: generateChars(97, 122),
		upperCase: generateChars(65, 90),
		special: [...`~!@#$%^&*()_+-=[]\{}|;:'",./<>?`],
		alphanumeric: [
			...generateChars(48, 57),
			...generateChars(65, 90),
			...generateChars(97, 122)
		]
	};

	const iter = function* (
		len: number,
		set: string[] | undefined
	): Generator<string, void, unknown> {
		if (set && set.length < 1) set = Object.values(sets).flat();
		for (let i = 0; i < len; i++) yield set![(Math.random() * set!.length) | 0];
	};

	return Object.assign(
		(len: number, ...set: string[]) => [...iter(len, set.flat())].join(''),
		sets
	);
})();

export const generateOneTimePassword = (length: number): string => {
  const chars = '0123456789';
  const charsLength = chars.length;
  const isBrowser = typeof window !== 'undefined' && typeof window.crypto !== 'undefined';
  
  let oneTimePassword = '';
  const randomValues = new Uint8Array(length);
  if (isBrowser) {
    window.crypto.getRandomValues(randomValues);
  } else {
    // Node.js environment
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      randomValues[i] = bytes[i];
    }
  }

  for (let i = 0; i < length; i++) {
    oneTimePassword += chars[randomValues[i] % charsLength];
  }

  return oneTimePassword;
};

export const UUIDRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const publicRoutes = ['/', '/terms', '/privacy-policy', '/api/edgestore/init'];
export const authRoutes = [
	'/auth/totp',
	'/auth/error',
	'/auth/sign-up',
	'/auth/sign-in',
	'/auth/verify-account',
	'/auth/forgot-password',
	'/auth/reset-password'
];
export const metaRoutes = [
	'/android-chrome-192x192.png',
	'/android-chrome-512x512.png',
	'/apple-touch-icon.png',
	'/browserconfig.xml',
	'/favicon-32x32.png',
	'/favicon-16x16.png',
	'/mstile-150x150.png',
	'/manifest.webmanifest',
	'/safari-pinned-tab.svg'
];

export const API_AUTH_PREFIX = '/api/auth';
export const SIGN_IN_ROUTE = '/auth/sign-in';
export const DEFAULT_SIGN_IN_REDIRECT = '/home';

export const compileTemplate = <T extends Record<string, any>>(template: string, values: T): string => {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim() as string;
    return trimmedKey in values ? String(values[trimmedKey]) : `{{${trimmedKey}}}`;
  });
};

export const acceptedFileTypes = {
  'image/png': ['.png'],
  'image/jpg': ['.jpg'],
  'image/jpeg': ['.jpeg'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tiff'],
  // 'video/mp4': ['.mp4'],
  // 'video/x-msvideo': ['.avi'],
  // 'video/x-matroska': ['.mkv'],
  // 'video/quicktime': ['.mov'],
  // 'video/webm': ['.webm']
};

export const getPhotoDimensions = (dataURI: string): Promise<{ width: number; height: number }> => {
  return new Promise(resolve => {
    const image = new Image();

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight
      };
      image.remove();
      resolve(dimensions);
    };
    
    image.src = dataURI;
  });
};

export const getVideoDimensions = (dataURI: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.onloadedmetadata = () => {
      const dimensions = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      video.remove();
      resolve(dimensions);
    };

    video.onerror = (error) => {
      reject(error);
    };

    video.src = dataURI;
  });
};

export const transitions = [
  {
    id: 'fade',
    text: 'Fade',
    preview: '/images/transitions/fade.gif'
  },
  {
    id: 'fadeblack',
    text: 'Fade To Black',
    preview: '/images/transitions/fadeblack.gif'
  },
  {
    id: 'fadewhite',
    text: 'Fade To White',
    preview: '/images/transitions/fadewhite.gif'
  },
  {
    id: 'distance',
    text: 'Distance',
    preview: '/images/transitions/distance.gif'
  },
  {
    id: 'wipeleft',
    text: 'Wipe Left',
    preview: '/images/transitions/wipeleft.gif'
  },
  {
    id: 'wiperight',
    text: 'Wipe Right',
    preview: '/images/transitions/wiperight.gif'
  },
  {
    id: 'wipeup',
    text: 'Wipe Up',
    preview: '/images/transitions/wipeup.gif'
  },
  {
    id: 'wipedown',
    text: 'Wipe Down',
    preview: '/images/transitions/wipedown.gif'
  },
  {
    id: 'slideleft',
    text: 'Slide Left',
    preview: '/images/transitions/slideleft.gif'
  },
  {
    id: 'slideright',
    text: 'Slide Right',
    preview: '/images/transitions/slideright.gif'
  },
  {
    id: 'slideup',
    text: 'Slide Up',
    preview: '/images/transitions/slideup.gif'
  },
  {
    id: 'slidedown',
    text: 'Slide Down',
    preview: '/images/transitions/slidedown.gif'
  },
  {
    id: 'smoothleft',
    text: 'Smooth Left',
    preview: '/images/transitions/smoothleft.gif'
  },
  {
    id: 'smoothright',
    text: 'Smooth Right',
    preview: '/images/transitions/smoothright.gif'
  },
  {
    id: 'smoothup',
    text: 'Smooth Up',
    preview: '/images/transitions/smoothup.gif'
  },
  {
    id: 'smoothdown',
    text: 'Smooth Down',
    preview: '/images/transitions/smoothdown.gif'
  }
] as const;

export const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+Pr1638ACaED3/nOThIAAAAASUVORK5CYII=';

export const areArraysEqual = (firstArray: string[], otherArray: string[]): boolean => {
  if (firstArray.length !== otherArray.length) {
    return false;
  }
  
  const sortedFirstArray = [...firstArray].sort();
  const sortedOtherArray = [...otherArray].sort();
  
  return sortedFirstArray.every((value, index) => value === sortedOtherArray[index]);
};

export const reorderByField = <T>(items: T[], sortedIds: any[], field: keyof T): T[] => {
  const itemMap: Record<string, T> = {};
  items.forEach(item => {
    const key = item[field] as unknown as string;
    itemMap[key] = item;
  });

  return sortedIds.map(id => itemMap[id as unknown as string]).filter(Boolean);
};

export const updateItemById = <T extends { id: string }>(array: T[], id: string, newData: Partial<T>): T[] => {
  return array.map(item => {
    if (item.id === id) {
      return { ...item, ...newData };
    }

    return item;
  });
};

export const voices = [
  { id: 'echo', src: '/voices/echo', text: 'Echo' },
  { id: 'alloy', src: '/voices/alloy', text: 'Alloy' },
  { id: 'fable', src: '/voices/fable', text: 'Fable' },
  { id: 'onyx', src: '/voices/onyx', text: 'Onyx' },
  { id: 'nova', src: '/voices/nova', text: 'Nova' },
  { id: 'shimmer', src: '/voices/shimmer', text: 'Shimmer' }
] as const;

export const aspectRatios = [
  { ratio: '16:9', description: 'Widescreen (HD)' },
  { ratio: '4:3', description: 'Standard (SD)' },
  { ratio: '1:1', description: 'Square' },
  { ratio: '21:9', description: 'Ultra-Widescreen' },
  { ratio: '3:2', description: 'Classic' },
  { ratio: '9:16', description: 'Portrait' },
  { ratio: '2.35:1', description: 'Cinematic' },
  { ratio: '5:4', description: 'Older Monitors' },
  { ratio: '1.85:1', description: 'Widescreen Cinema' },
  { ratio: '2:3', description: 'Medium Format Photography' }
] as const;

export const frameRates = [
  { value: 24, text: '24 FPS' },
  { value: 30, text: '30 FPS' },
  { value: 60, text: '60 FPS' }
] as const;

export const wordsInSeconds = (seconds: number, wordsPerMinute = 182) => {
  const wordsPerSecond = wordsPerMinute / 60;

  return Math.floor(seconds * wordsPerSecond);
};

export const readingTimeInSeconds = (text: string, wordsPerMinute = 182, bufferPercentage = 0.05) => {
  const words = text.split(/\s+/).length;
  const wordsPerSecond = wordsPerMinute / 60;
  const readingTime = words / wordsPerSecond;
  
  const bufferTime = readingTime * bufferPercentage;
  
  return Math.ceil(readingTime + bufferTime);
};

export const secondsToWords = (seconds: number, wordsPerMinute = 182) => {
	const wordsPerSecond = wordsPerMinute / 60;

	return Math.ceil(seconds * wordsPerSecond);
};

export const getOutputDimensions = (quality: OutputQuality, aspectRatio: string): [number, number] => {
  const [width, height] = aspectRatio.split(':').map(Number);
  const ratio = width / height;

  switch (quality) {
    case '4K':
      return [3840, Math.round(3840 / ratio)];
    case '1080P':
      return [1920, Math.round(1920 / ratio)];
    case '720P':
      return [1280, Math.round(1280 / ratio)];
    case '480P':
      return [854, Math.round(854 / ratio)];
  }
};

export const bitrates = {
  '4K': '15000k',
  '1080P': '5000k',
  '720P': '2500k',
  '480p': '1000k'
};

export const getEncodingOptions = (outputQuality: OutputQuality) => {
  const bitrates = {
    '4K': '15000k',
    '1080P': '5000k',
    '720P': '2500k',
    '480P': '1000k'
  };

  return {
    videoBitrate: bitrates[outputQuality],
    audioBitrate: outputQuality === '4K' ? '256k' : '192k',
    videoCodec: outputQuality === '4K' ? 'libx265' : 'libx264',
    preset: outputQuality === '4K' ? 'slow' : 'medium',
    crf: outputQuality === '4K' ? '18' : '23'
  };
};

export const parseDuration = (duration: `${number} ${TimeUnit}`): number => {
  const timeUnits: { [key: number]: TimeUnit[] } = {
    1: ['s', 'sec', 'seconds'],
    60: ['m', 'min', 'minutes'],
    3600: ['h', 'hour', 'hours'],
    86400: ['d', 'day', 'days'],
    604800: ['w', 'week', 'weeks'],
    2592000: ['m', 'month', 'months'],
    31536000: ['y', 'year', 'years']
  };

  const match = duration.match(/(\d+)\s*([a-zA-Z]+)/);
  if (!match) throw new Error('Invalid duration format');

  const [_, value, unit] = match;

  const unitValue = Object.keys(timeUnits).find(key =>
    timeUnits[+key].includes(unit as TimeUnit)
  );

  if (!unitValue) throw new Error(`Invalid time unit: ${unit}`);

  return parseInt(value) * parseInt(unitValue);
};
