
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import VideoPlayer from '@/components/VideoPlayer';
import StreamForm from '@/components/StreamForm';
import { type StreamEntry } from '@/hooks/useStreamHistory';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/lib/toast';

const Index = () => {
  const [currentStream, setCurrentStream] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  const handleStreamSubmit = (url: string, title: string) => {
    setCurrentStream(url);
    setCurrentTitle(title);
    toast.success(`Loading: ${title}`);
  };

  const handleStreamSelect = (stream: StreamEntry) => {
    setCurrentStream(stream.url);
    setCurrentTitle(stream.title);
    toast.success(`Loading: ${stream.title}`);
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-8 py-6">
        {/* Video Player Section */}
        <section className="w-full animate-scale-in">
          {currentStream ? (
            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
              <VideoPlayer streamUrl={currentStream} title={currentTitle || undefined} />
            </div>
          ) : (
            <Card className="w-full aspect-video bg-muted/20 flex items-center justify-center rounded-lg shadow-lg overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-6 h-full w-full">
                <div className="text-center space-y-4 max-w-md">
                  <h2 className="text-2xl font-semibold tracking-tight">Select a Stream to Begin</h2>
                  <p className="text-muted-foreground">
                    Choose from the available streams below
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Stream Controls Section */}
        <section className="w-full max-w-2xl mx-auto">
          <Card className="animate-slide-up">
            <CardContent className="p-6">
              <StreamForm onStreamSubmit={handleStreamSubmit} />
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
