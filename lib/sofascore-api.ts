const RAPID_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
const RAPID_HOST = process.env.NEXT_PUBLIC_RAPIDAPI_HOST || 'sofascore.p.rapidapi.com';

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': RAPID_KEY as string,
    'X-RapidAPI-Host': RAPID_HOST,
  }
};

/**
 * SofaScore API Wrapper
 */
export const SofaScore = {
  /**
   * 특정 날짜의 경기 목록 가져오기 (YYYY-MM-DD)
   */
  getMatchesByDate: async (date: string) => {
    const res = await fetch(`https://${RAPID_HOST}/events/get-list?date=${date}`, options);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  /**
   * 경기 상세 정보 (스코어, 시간, 상태 등)
   */
  getMatchDetails: async (eventId: number | string) => {
    const res = await fetch(`https://${RAPID_HOST}/events/get-details?event_id=${eventId}`, options);
    if (!res.ok) throw new Error('Failed to fetch match details');
    return res.json();
  },

  /**
   * 경기 주요 사건 (골, 카드, 교체 등)
   */
  getMatchIncidents: async (eventId: number | string) => {
    const res = await fetch(`https://${RAPID_HOST}/events/get-incidents?event_id=${eventId}`, options);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  /**
   * 팀 라인업 및 포메이션
   */
  getMatchLineups: async (eventId: number | string) => {
    const res = await fetch(`https://${RAPID_HOST}/events/get-lineups?event_id=${eventId}`, options);
    if (!res.ok) throw new Error('Failed to fetch lineups');
    return res.json();
  }
};

/**
 * SofaScore 데이터를 프로젝트 Match 타입으로 변환하는 헬퍼 (예시)
 */
export function mapSofaScoreToMatch(sofaData: any, incidentsData: any[]): any {
  const { event } = sofaData;
  return {
    id: event.id,
    home: {
      name: event.homeTeam.name,
      short: event.homeTeam.nameCode,
      color: event.homeTeam.teamColorPrimary || '#E63946',
      score: event.homeScore.current || 0,
      logo: `https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image`,
      formation: '', // Lineups API에서 별도 호출 필요
    },
    away: {
      name: event.awayTeam.name,
      short: event.awayTeam.nameCode,
      color: event.awayTeam.teamColorPrimary || '#457B9D',
      score: event.awayScore.current || 0,
      logo: `https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image`,
      formation: '',
    },
    league: event.tournament.name,
    stadium: event.venue?.name || 'Unknown Stadium',
    capacity: 0,
    attendance: 0,
    time: event.status.description === 'Live' ? `${event.status.displayTime}'` : event.status.description,
    half: event.status.periodInfo?.current || 0,
    status: mapStatus(event.status.type),
    events: incidentsData.map(inc => ({
      time: `${inc.time}'`,
      type: mapEventType(inc.incidentType),
      team: inc.isHome ? 'home' : 'away',
      player: inc.player?.name || 'Unknown',
      icon: getIcon(inc.incidentType),
      desc: inc.incidentClass || '',
    })),
  };
}

function mapStatus(type: string) {
  if (type === 'inprogress') return 'LIVE';
  if (type === 'finished') return 'END';
  return 'UPCOMING';
}

function mapEventType(type: string) {
  if (type === 'goal') return 'goal';
  if (type === 'card' || type === 'yellow') return 'yellow'; // Simplified
  return 'var';
}

function getIcon(type: string) {
  if (type === 'goal') return '⚽';
  if (type === 'card') return '🟨';
  return '📺';
}
