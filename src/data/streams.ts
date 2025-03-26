
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
    id: "Star Sports 1 ",
    url: "https://9361edfe-185f-40b2-8656-2f450faeef7c.deepnoteproject.com/api/star1in.m3u8",
    title: "Star Sports 1",
    league: "Premier League",
    description: ""
  },
  {
    id: "Sony Aath",
    url: "https://live-test.tsports.com/live-01/master_480.m3u8?hdntl=Expires=1742996874~_GO=Generated~URLPrefix=aHR0cHM6Ly9saXZlLXRlc3QudHNwb3J0cy5jb20v~Signature=AXH73bb41230MDxlnngSsmBZoonAidwSTpjbrBmi8yiF_bTkbPaCW61aO60zirW7TacRgATW0Okpy7psP1ogO-LIOskF",
    title: "BD VS IND - 2",
    league: "La Liga",
    description: "Bangladesh vs India"
  },
  {
    id: "bundesliga-1",
    url: "https://nix1-dc4-cdnnew.koskoros.ru/nix1-dc4-cdn/mono40/mono.m3u8",
    title: "Argentina Vs Brazil -2",
    league: "Bundesliga",
    description: ""
  },
{
    id: "premier-league-2",
    url: "https://stream.sainaertebat.com/hls2/ssc1.m3u8",
    title: "Argentina Vs Brazil -3 (better q)",
    league: "Premier Leae",
    description: "Argentina Vs Brazil"
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
