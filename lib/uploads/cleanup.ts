import type { PrivateObjectStore } from "@/lib/storage/types";

interface CleanupDb {
  uploadedPhoto: {
    updateMany(input: {
      where: { userId: string; id: { in: string[] }; deletedAt: null };
      data: { deletedAt: Date };
    }): Promise<unknown>;
  };
}

export interface SourcePhotoForCleanup {
  id: string;
  storageKey: string;
}

export async function cleanupSourcePhotos(input: {
  db: CleanupDb;
  storage: PrivateObjectStore;
  userId: string;
  photos: SourcePhotoForCleanup[];
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const uniquePhotos = Array.from(new Map(input.photos.map((photo) => [photo.id, photo])).values());

  await Promise.all(uniquePhotos.map((photo) => input.storage.delete(photo.storageKey)));
  await input.db.uploadedPhoto.updateMany({
    where: {
      userId: input.userId,
      id: { in: uniquePhotos.map((photo) => photo.id) },
      deletedAt: null,
    },
    data: { deletedAt: now },
  });
}
