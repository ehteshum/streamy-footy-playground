import { cn } from '@/lib/utils';

interface EmbeddedPlayerProps {
  streamUrl: string;
  title?: string;
  className?: string;
}

const EmbeddedPlayer = ({ 
  streamUrl, 
  title, 
  className 
}: EmbeddedPlayerProps) => {
  return (
    <div 
      className={cn(
        "relative w-full h-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg",
        className
      )}
    >
      {title && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h2 className="text-white font-medium text-lg truncate">{title}</h2>
        </div>
      )}
      
      <iframe
        src={streamUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        title={title || "Embedded Stream"}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default EmbeddedPlayer; 