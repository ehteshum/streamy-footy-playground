import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { type StreamEntry } from '@/hooks/useStreamHistory';
import { Card, CardContent } from '@/components/ui/card';

interface RecentStreamsProps {
  streams: StreamEntry[];
  onStreamSelect: (stream: StreamEntry) => void;
  onStreamRemove: (id: string) => void;
  onClearAll: () => void;
}

const RecentStreams: React.FC<RecentStreamsProps> = ({
  streams,
  onStreamSelect,
  onStreamRemove,
  onClearAll
}) => {
  if (streams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground animate-fade-in">
        <p>No recent streams</p>
        <p className="text-sm mt-2">Streams you add will appear here for quick access</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    // If stream was added today, show time only
    const today = new Date();
    const streamDate = new Date(date);
    
    if (
      today.getDate() === streamDate.getDate() &&
      today.getMonth() === streamDate.getMonth() &&
      today.getFullYear() === streamDate.getFullYear()
    ) {
      return streamDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date and time
    return streamDate.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Recent Streams</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {streams.map((stream) => (
          <Card 
            key={stream.id} 
            className="stream-item hover:bg-accent/50 transition-all duration-300 overflow-hidden group"
          >
            <CardContent className="p-3 flex items-center">
              <button
                onClick={() => onStreamSelect(stream)}
                className="flex-1 text-left flex flex-col"
              >
                <span className="font-medium truncate">{stream.title}</span>
                <span className="text-xs text-muted-foreground truncate max-w-xs">
                  {stream.url}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDate(stream.addedAt)}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onStreamRemove(stream.id);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecentStreams;
