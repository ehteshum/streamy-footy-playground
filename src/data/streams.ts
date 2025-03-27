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
    url: "https://smart.bengaldigital.live/T-Sports_HD/index.m3u8",
    title: "T Sports",
    league: "Premier League",
    description: ""
  },
  {
    id: "Sony Aath",
    url: "https://director.taihotel.asia/v4/variant/VE1gTdz0mLzRnLv52bt9SMhFjdtM3ajFmc09CN0QGMlN2YlhTOhVWLxIGO40yM3UDNtgTNmFWLyUzY5ATMlV2L.m3u8",
    title: "Barcelona Vs Osasuna",
    league: "La Liga",
    description: ""
  },
/*  {
    id: "bundesliga-1",
    url: "https://love2live.wideiptv.top/DSTVCRICKET/index.fmp4.m3u8?token=42e2e4ed8519acfe582433a9714ee8263082abb3-59b9ec75ffc76070294e8e751d0d391c-1743022318-1743011518",
    title: "IPL - Test",
    league: "Bundesliga",
    description: "test"
  },
  {
    id: "premier-league-2",
    url: "https://24a.pricesaskeloadsc.com/skycricket/index.m3u8?token=4fcea732d440d1af4ed0d7269be1b4c634d4f807-24-1743035411-1743003011",
    title: "Sky Sports HD",
    league: "Premier Leae",
    description: ""
  },*/
  {
    id: "stream-415",
    url: "https://embedme.top/embed/admin/admin-barcelona-vs-osasuna/1",
    title: "Barca VS Osasuna HD (ADS)",
    league: "Football",
    description: "Featured football stream",
    isEmbedded: true
  }
];

// Function to get all available streams
export function getAvailableStreams(): StreamData[] {
  return predefinedStreams;
}

// Function to get a stream by ID
export function getStreamById(id: string): StreamData | undefined {
  return predefinedStreams.find(stream => stream.id === id);
}
