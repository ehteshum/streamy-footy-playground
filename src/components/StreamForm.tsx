
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';

interface StreamFormProps {
  onStreamSubmit: (url: string, title: string) => void;
}

const StreamForm: React.FC<StreamFormProps> = ({ onStreamSubmit }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a stream URL');
      return;
    }
    
    if (!url.includes('m3u8')) {
      toast.warning('URL may not be a valid M3U8 stream');
    }
    
    try {
      setIsLoading(true);
      
      // Simulate a network check
      setTimeout(() => {
        onStreamSubmit(url, title || 'Untitled Stream');
        toast.success('Stream loaded successfully');
        setUrl('');
        setTitle('');
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
          <label htmlFor="stream-url" className="block text-sm font-medium">
            Stream URL (M3U8)
          </label>
          <Input
            id="stream-url"
            type="url"
            placeholder="https://example.com/stream.m3u8"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full transition-all duration-300 ease-out focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
      </div>
      
      <div className="space-y-1">
        <label htmlFor="stream-title" className="block text-sm font-medium">
          Stream Title (Optional)
        </label>
        <Input
          id="stream-title"
          type="text"
          placeholder="Premier League: Team A vs Team B"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full transition-all duration-300 ease-out focus:ring-2 focus:ring-primary/50"
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="btn-hover-effect transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Play Stream'}
        </Button>
      </div>
    </form>
  );
};

export default StreamForm;
