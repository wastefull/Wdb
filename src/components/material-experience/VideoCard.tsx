import { Play } from "lucide-react";
import type { MaterialVideoResource } from "../../types/materialExperience";
import {
  formatResourceContext,
  formatUnderscoredLabel,
} from "../../utils/labels";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export type VideoCardType = "default" | "short";

export function VideoCard({
  video,
  type,
}: {
  video: MaterialVideoResource;
  type: VideoCardType;
}) {
  const isShortForm = type === "short";
  const thumbnail =
    video.thumbnailUrl ||
    (video.youtubeId
      ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
      : undefined);
  const canEmbed = video.embeddable === true && video.youtubeId;
  const embedUrl = canEmbed
    ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`
    : null;

  return (
    <Card
      className={`group overflow-hidden border-[1.5px] border-[#211f1c]/25 shadow-none dark:border-white/20 ${
        isShortForm ? "w-full max-w-[280px] justify-self-center" : ""
      }`}
    >
      {embedUrl ? (
        <div
          className={`overflow-hidden bg-black/5 ${
            isShortForm ? "aspect-[9/16]" : "aspect-video"
          }`}
        >
          <iframe
            src={embedUrl}
            title={video.title}
            loading="lazy"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        thumbnail && (
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className={`relative block overflow-hidden bg-black/5 ${
              isShortForm ? "aspect-[9/16]" : "aspect-video"
            }`}
          >
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className={`size-full transition-transform duration-300 group-hover:scale-[1.03] ${
                isShortForm ? "object-contain bg-black" : "object-cover"
              }`}
            />
            <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/20">
              <span className="grid size-11 place-items-center rounded-full bg-white/90 text-black shadow-sm">
                <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
              </span>
            </span>
          </a>
        )
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="mt-2 text-base leading-6">
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {video.title}
            </a>
          </CardTitle>
          {isShortForm && (
            <Badge variant="outline" className="mt-1 shrink-0">
              Shorts
            </Badge>
          )}
        </div>
        {video.channelName && (
          <CardDescription>{video.channelName}</CardDescription>
        )}
        {video.lifecycleFocus && (
          <CardDescription>
            {formatUnderscoredLabel(video.lifecycleFocus)}
          </CardDescription>
        )}
        {video.embeddable === true && (
          <CardDescription>Embedded player available</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <a href={video.youtubeUrl} target="_blank" rel="noreferrer">
            <Play className="size-4" aria-hidden="true" /> Watch video
          </a>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          {formatResourceContext(video.role, "video")}
        </p>
      </CardContent>
    </Card>
  );
}
