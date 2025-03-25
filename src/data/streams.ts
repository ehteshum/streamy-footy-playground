
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
    url: "https://vsd115.okcdn.ru/hls/8060523776567.m3u8/sig/8tgx4l_1RnA/expires/1742996081440/srcIp/92.62.121.212/urls/45.136.22.91/clientType/1/srcAg/CHROME_ANDROID/mid/9244018679351/video.m3u8?p",
    title: "BD VS IND",
    league: "Premier League",
    description: "Bangladesh vs India"
  },
  {
    id: "Sony Aath",
    url: "https://live-test.tsports.com/live-01/master_480.m3u8?hdntl=Expires=1742996874~_GO=Generated~URLPrefix=aHR0cHM6Ly9saXZlLXRlc3QudHNwb3J0cy5jb20v~Signature=AXH73bb41230MDxlnngSsmBZoonAidwSTpjbrBmi8yiF_bTkbPaCW61aO60zirW7TacRgATW0Okpy7psP1ogO-LIOskF",
    title: "BD VS IND - 2",
    league: "La Liga",
    description: "Bangladesh vs India"
  },
 /* {
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
