import React, { useState } from 'react';
import Layout from '@/components/Layout';
import VideoPlayer from '@/components/VideoPlayer';
import StreamForm from '@/components/StreamForm';
import RecentStreams from '@/components/RecentStreams';
import { useStreamHistory, type StreamEntry } from '@/hooks/useStreamHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';

const Index = () => {
  const [currentStream, setCurrentStream] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const { streams, addStream, removeStream, clearHistory } = useStreamHistory();

  const handleStreamSubmit = (url: string, title: string) => {
    setCurrentStream(url);
    setCurrentTitle(title);
    addStream(url, title);
  };

  const handleStreamSelect = (stream: StreamEntry) => {
    setCurrentStream(stream.url);
    setCurrentTitle(stream.title);
    toast.success(`Loading: ${stream.title}`);
  };

  const handleStreamRemove = (id: string) => {
    removeStream(id);
    toast.success('Stream removed from history');
  };

  const handleClearAll = () => {
    clearHistory();
    toast.success('Stream history cleared');
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
                  <h2 className="text-2xl font-semibold tracking-tight">Add a Stream to Begin</h2>
                  <p className="text-muted-foreground">
                    Enter an M3U8 stream URL below or select from your recent streams
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Stream Controls Section */}
        <section className="w-full max-w-2xl mx-auto">
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="add" className="text-sm">Add Stream</TabsTrigger>
              <TabsTrigger value="recent" className="text-sm">Recent Streams</TabsTrigger>
            </TabsList>
            <TabsContent value="add" className="animate-slide-up">
              <Card>
                <CardContent className="p-6">
                  <StreamForm onStreamSubmit={handleStreamSubmit} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="recent" className="animate-slide-up">
              <Card>
                <CardContent className="p-6">
                  <RecentStreams 
                    streams={streams}
                    onStreamSelect={handleStreamSelect}
                    onStreamRemove={handleStreamRemove}
                    onClearAll={handleClearAll}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
