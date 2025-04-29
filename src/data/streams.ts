export interface StreamData {
  id: string;
  url: string;
  title: string;
  league?: string;
  description?: string;
  isEmbedded?: boolean;
}

// Predefined streams
export const predefinedStreams: StreamData[] = [
  {
    id: "Star Sports 1 ",
    url: "https://1.thepotatosman.xyz/hls/0/stream.m3u8",
    title: "Arsenal Vs PSG",
    league: "Premier League",
    description: ""
  },
 /* {
    id: "Sony Aath",
    url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono41/mono.m3u8",
    title: "Barcelona Vs Athletico",
    league: "La Liga",
    description: ""
  },
  {
    id: "bundesliga-1",
    url: "https://top1-cdnnew.newkso.ru/top1-cdn/rkwC7xgQZu/mono.m3u8 ",
    title: "Barcelona vs Atm -2",
    league: "Bundesliga",
    description: "test"
  },
  {
    id: "premier-league-2",
    url: "https://24a.pricesaskeloadsc.com/skycricket/index.m3u8?token=4fcea732d440d1af4ed0d7269be1b4c634d4f807-24-1743035411-1743003011",
    title: "Sky Sports HD",
    league: "Premier Leae",
    description: ""
  },
  {
    id: "stream-415",
    url: "https://embedme.top/embed/admin/admin-barcelona-vs-osasuna/1",
    title: "Barca VS Osasuna HD (ADS)",
    league: "Football",
    description: "Featured football stream",
    isEmbedded: true
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
