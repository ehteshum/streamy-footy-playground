
import { useState, useEffect } from 'react';

export interface StreamEntry {
  id: string;
  url: string;
  title: string;
  addedAt: Date;
}

export function useStreamHistory() {
  const [streams, setStreams] = useState<StreamEntry[]>([]);
  
  useEffect(() => {
    // Load saved streams from localStorage on component mount
    const savedStreams = localStorage.getItem('streamHistory');
    if (savedStreams) {
      try {
        const parsedStreams = JSON.parse(savedStreams);
        setStreams(parsedStreams.map((stream: any) => ({
          ...stream,
          addedAt: new Date(stream.addedAt)
        })));
      } catch (error) {
        console.error('Failed to parse stream history:', error);
      }
    }
  }, []);

  // Save streams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('streamHistory', JSON.stringify(streams));
  }, [streams]);

  const addStream = (url: string, title: string = 'Untitled Stream') => {
    const newStream: StreamEntry = {
      id: crypto.randomUUID(),
      url,
      title,
      addedAt: new Date()
    };
    
    // Check if stream already exists
    const existingStreamIndex = streams.findIndex(stream => stream.url === url);
    
    if (existingStreamIndex >= 0) {
      // Update existing stream with new timestamp
      const updatedStreams = [...streams];
      updatedStreams[existingStreamIndex] = {
        ...updatedStreams[existingStreamIndex],
        title, // Update title if changed
        addedAt: new Date() // Update timestamp
      };
      setStreams(updatedStreams);
    } else {
      // Add new stream
      setStreams(prevStreams => [newStream, ...prevStreams]);
    }
    
    return newStream;
  };

  const removeStream = (id: string) => {
    setStreams(prevStreams => prevStreams.filter(stream => stream.id !== id));
  };

  const clearHistory = () => {
    setStreams([]);
  };

  return {
    streams,
    addStream,
    removeStream,
    clearHistory
  };
}
