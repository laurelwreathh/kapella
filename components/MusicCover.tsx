export default function MusicCover({ color, className = "" }: { color: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`shrink-0 overflow-hidden rounded-xl ${color} ${className}`}>
      <svg viewBox="0 0 200 200" fill="currentColor" className="h-full w-full">
        <circle cx="140" cy="55" r="28" opacity="0.45" />
        <path d="M-20 200 65 65l93 135ZM80 200l75-100 70 100Z" opacity="0.6" />
      </svg>
    </div>
  );
}
