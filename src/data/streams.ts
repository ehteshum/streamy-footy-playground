
export interface StreamData {
  id: string;
  url: string;
  title: string;
  league?: string;
  description?: string;
}

// Predefined streams
export const predefinedStreams: StreamData[] = [
  {
    id: "premier-league-1",
    url: "https://live-test.tsports.com/live-02/1080/master_1080p.m3u8",
    title: "T-Sports",
    league: "Premier League",
    description: "Testing"
  },
  {
    id: "Sony Aath",
    url: "https://bldcmprod-cdn.toffeelive.com/cdn/live/sports_highlights/playlist.m3u8",
    title: "Sony Aath",
    league: "La Liga",
    description: "Spanish La Liga El Clasico"
  },
  /*{
    id: "bundesliga-1",
    url: "https://example.com/stream3.m3u8",
    title: "Bundesliga: Bayern Munich vs Borussia Dortmund",
    league: "Bundesliga",
    description: "German Bundesliga Der Klassiker"
  }*/
];

// Function to get all available streams
export function getAvailableStreams(): StreamData[] {
  return predefinedStreams;
}

// Function to get a stream by ID
export function getStreamById(id: string): StreamData | undefined {
  return predefinedStreams.find(stream => stream.id === id);
}
