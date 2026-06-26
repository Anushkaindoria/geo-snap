import Photo from "../models/Photo.js";
import { generateTagsFromImage } from "./imageTagging.js";

// Starts a non-blocking Gemini tagging task after a photo has already been saved.
export function startPhotoTagging(photoId: string) {
  void generateTagsForPhoto(photoId).catch((error) => {
    console.error(`Photo tagging job crashed: ${photoId}`, error);
  });
}

// Counts photos whose tags are not searchable yet. This is informational only.
export async function countPhotosPendingIndexing() {
  return Photo.countDocuments({
    tagStatus: {
      $in: ["pending", "failed"],
    },
  });
}

// Runs one Gemini tagging attempt for one existing photo without creating a duplicate upload.
export async function generateTagsForPhoto(photoId: string) {
  const photo = await Photo.findOne({ id: photoId });

  if (!photo) {
    return null;
  }

  await Photo.findOneAndUpdate(
    { id: photoId },
    {
      $set: {
        tagStatus: "pending",
      },
    },
  );

  try {
    const tags = await generateTagsFromImage(photo.url);

    const updatedPhoto = await Photo.findOneAndUpdate(
      { id: photoId },
      {
        $set: {
          tags,
          tagStatus: "completed",
        },
      },
      {
        new: true,
      },
    );

    console.log(`Photo tagging completed: ${photoId}`);
    return updatedPhoto;
  } catch (error) {
    console.error(`Photo tagging failed: ${photoId}`, error);

    await Photo.findOneAndUpdate(
      { id: photoId },
      {
        $set: {
          tagStatus: "failed",
        },
      },
    );

    throw error;
  }
}
