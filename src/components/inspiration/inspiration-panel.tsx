import { listMoodboards, listInspirationImages } from "@/lib/data/inspiration";
import { listRoomOptions } from "@/lib/data/rooms";
import { UploadImageDialog } from "./upload-image-dialog";
import { MoodboardFormDialog } from "./moodboard-form-dialog";
import { MoodboardList } from "./moodboard-list";
import { ImageGallery } from "./image-gallery";

export async function InspirationPanel({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const [moodboards, images, rooms] = await Promise.all([
    listMoodboards(organizationId, projectId),
    listInspirationImages(organizationId, projectId),
    listRoomOptions(organizationId, projectId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Reference images, moodboards, and material notes for this project — kept separate from cost calculations.
        </p>
        <div className="flex gap-2">
          <MoodboardFormDialog projectId={projectId} />
          <UploadImageDialog projectId={projectId} rooms={rooms} moodboards={moodboards} />
        </div>
      </div>
      <MoodboardList projectId={projectId} moodboards={moodboards} />
      <ImageGallery projectId={projectId} images={images} moodboards={moodboards} />
    </div>
  );
}
