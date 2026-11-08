import { notFound } from "next/navigation";
import ArtistView from "@/components/ArtistView";
import { artists, tracks } from "@/lib/demo-music";

export function generateStaticParams() {
  return artists.map(({ id }) => ({ id }));
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = artists.find((item) => item.id === id);
  if (!artist) notFound();

  return (
    <ArtistView
      key={artist.id}
      artist={artist}
      tracks={tracks.filter((track) => track.artistId === id)}
      similarArtists={artists.filter((item) => artist.similarIds.includes(item.id))}
    />
  );
}
