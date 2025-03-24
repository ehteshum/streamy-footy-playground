
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableStreams, type StreamData } from '@/data/streams';

interface StreamFormProps {
  onStreamSubmit: (url: string, title: string) => void;
}

const StreamForm: React.FC<StreamFormProps> = ({ onStreamSubmit }) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const availableStreams = getAvailableStreams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStreamId) {
      toast.error('Please select a stream');
      return;
    }
    
    const selectedStream = availableStreams.find(stream => stream.id === selectedStreamId);
    
    if (!selectedStream) {
      toast.error('Invalid stream selection');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Simulate a network check
      setTimeout(() => {
        onStreamSubmit(selectedStream.url, selectedStream.title);
        toast.success('Stream loaded successfully');
        setIsLoading(false);
      }, 800);
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to load stream');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 animate-scale-in">
      <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md mb-4 border border-amber-200 dark:border-amber-800">
        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
          Admin Only Area - Stream Management
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="stream-selector" className="block text-sm font-medium">
            Select Stream
          </label>
          <Select 
            value={selectedStreamId} 
            onValueChange={setSelectedStreamId}
          >
            <SelectTrigger id="stream-selector" className="w-full">
              <SelectValue placeholder="Select a stream" />
            </SelectTrigger>
            <SelectContent>
              {availableStreams.map(stream => (
                <SelectItem key={stream.id} value={stream.id}>
                  {stream.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedStreamId && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{availableStreams.find(s => s.id === selectedStreamId)?.title}</p>
              {availableStreams.find(s => s.id === selectedStreamId)?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {availableStreams.find(s => s.id === selectedStreamId)?.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="btn-hover-effect transition-all duration-300"
          disabled={isLoading || !selectedStreamId}
        >
          {isLoading ? 'Loading...' : 'Play Stream'}
        </Button>
      </div>
    </form>
  );
};

export default StreamForm;
