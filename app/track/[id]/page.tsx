import { notFound } from "next/navigation";
import TrackView from "@/components/TrackView";
import { artists, tracks } from "@/lib/demo-music";

export function generateStaticParams() {
  return tracks.map(({ id }) => ({ id: String(id) }));
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = tracks.find((item) => String(item.id) === id);
  if (!track) notFound();
  const artist = artists.find((item) => item.id === track.artistId);
  if (!artist) notFound();

  // Демонстрационный подбор: сначала треки того же исполнителя, затем похожих.
  const similarTracks = [
    ...tracks.filter((item) => item.id !== track.id && item.artistId === artist.id),
    ...tracks.filter((item) => artist.similarIds.includes(item.artistId)),
  ].slice(0, 3);

  return <TrackView key={track.id} track={track} year={artist.year} similarTracks={similarTracks} />;
}
