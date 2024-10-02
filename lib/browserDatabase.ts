import Dexie, { Table } from 'dexie';

interface Media {
  cid: string;
  file: Blob;
  projectId: string;
};

interface Image {
  cid: string;
  width: number;
  height: number;
  blob: Blob;
};

interface Audio {
  cid: string;
  file: Blob;
  projectId: string;
};

class MemoireDatabase extends Dexie {
  media!: Table<Media>;
  images!: Table<Image>;
  audio!: Table<Audio>;

  constructor() {
    super('Memoire');
    this.version(2).stores({
      media: '++cid, file, projectId',
      images: '[cid+width+height], blob',
      audio: '++cid, file, projectId'
    });
  }
}

const db = new MemoireDatabase();

export { db };
