// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MatchStatus = 'LIVE' | 'END' | 'UPCOMING'
export type EventType   = 'goal' | 'yellow' | 'red' | 'sub' | 'var'
export type ViewpointId = 'center' | 'goal' | 'bench'

export interface Team {
  name:  string
  short: string
  color: string
  score: number
  logo:  string
  formation: string
  cheers?: number
}

export interface MatchEvent {
  time:   string
  type:   EventType
  team:   'home' | 'away'
  player: string
  icon:   string
  desc?:  string
}

export interface Match {
  id:       number
  home:     Team
  away:     Team
  league:   string
  stadium:  string
  capacity: number
  time:     string
  half:     number
  status:   MatchStatus
  events:   MatchEvent[]
  attendance: number
  home_cheers?: number
  away_cheers?: number
}

export interface Viewpoint {
  id:      ViewpointId
  label:   string
  labelEn: string
  icon:    string
  desc:    string
  fov:     string
  tip:     string
  videoId: string
  mapX:    number   // 0-100 (percentage in SVG)
  mapY:    number
  bestFor: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

export const MATCHES: Match[] = [
  {
    id: 1,
    home: {
      name: '서울 FC', short: 'SEO', color: '#E63946', score: 2,
      logo: '🔴', formation: '4-3-3',
    },
    away: {
      name: '부산 유나이티드', short: 'BSN', color: '#457B9D', score: 1,
      logo: '🔵', formation: '4-2-3-1',
    },
    league: 'K리그 1',
    stadium: '서울 월드컵 경기장',
    capacity: 66704,
    attendance: 52000,
    time: '73:24',
    half: 2,
    status: 'LIVE',
    events: [
      { time: "08'", type: 'goal',   team: 'home', player: '김민준', icon: '⚽', desc: '헤더골' },
      { time: "31'", type: 'yellow', team: 'away', player: '박도현', icon: '🟨', desc: '반칙' },
      { time: "55'", type: 'goal',   team: 'home', player: '이강인', icon: '⚽', desc: '프리킥' },
      { time: "68'", type: 'goal',   team: 'away', player: '최원식', icon: '⚽', desc: '역습' },
      { time: "71'", type: 'red',    team: 'away', player: '정현우', icon: '🟥', desc: '2번째 경고' },
    ],
  },
  {
    id: 2,
    home: {
      name: '전북 현대', short: 'JBK', color: '#F4A261', score: 1,
      logo: '🟡', formation: '4-4-2',
    },
    away: {
      name: '울산 HD', short: 'USN', color: '#2A9D8F', score: 1,
      logo: '🟢', formation: '3-4-3',
    },
    league: 'K리그 1',
    stadium: '전주 월드컵 경기장',
    capacity: 42477,
    attendance: 35000,
    time: '38:12',
    half: 1,
    status: 'LIVE',
    events: [
      { time: "09'", type: 'yellow', team: 'home', player: '윤승원', icon: '🟨' },
      { time: "22'", type: 'goal',   team: 'home', player: '한교원', icon: '⚽', desc: '왼발 슛' },
      { time: "29'", type: 'goal',   team: 'away', player: '주민규', icon: '⚽', desc: '페널티킥' },
    ],
  },
  {
    id: 3,
    home: {
      name: '수원 삼성', short: 'SWN', color: '#1565C0', score: 3,
      logo: '🔷', formation: '4-1-4-1',
    },
    away: {
      name: '인천 유나이티드', short: 'ICN', color: '#E9C46A', score: 2,
      logo: '🟩', formation: '4-3-3',
    },
    league: 'K리그 1',
    stadium: '수원 월드컵 경기장',
    capacity: 43959,
    attendance: 28000,
    time: '90+3',
    half: 2,
    status: 'END',
    events: [
      { time: "14'", type: 'goal',   team: 'home', player: '강현우', icon: '⚽' },
      { time: "29'", type: 'goal',   team: 'away', player: '오민재', icon: '⚽' },
      { time: "44'", type: 'yellow', team: 'home', player: '박진수', icon: '🟨' },
      { time: "61'", type: 'goal',   team: 'home', player: '강현우', icon: '⚽', desc: '멀티골' },
      { time: "71'", type: 'var',    team: 'away', player: 'VAR',   icon: '📺', desc: '골 취소' },
      { time: "77'", type: 'goal',   team: 'away', player: '이태양', icon: '⚽' },
      { time: "88'", type: 'goal',   team: 'home', player: '김건호', icon: '⚽', desc: '결승골' },
    ],
  },
  {
    id: 4,
    home: {
      name: '대구 FC', short: 'DGU', color: '#7B2FBE', score: 0,
      logo: '🟣', formation: '4-2-3-1',
    },
    away: {
      name: '강원 FC', short: 'GWN', color: '#00BBF9', score: 0,
      logo: '🩵', formation: '4-4-2',
    },
    league: 'K리그 1',
    stadium: 'DGB대구은행파크',
    capacity: 12000,
    attendance: 0,
    time: '19:30',
    half: 0,
    status: 'UPCOMING',
    events: [],
  },
]

export const VIEWPOINTS: Viewpoint[] = [
  {
    id:      'center',
    label:   '중앙 관중석',
    labelEn: 'CENTER STAND',
    icon:    '🏟️',
    desc:    '전체 경기 흐름을 한눈에 파악할 수 있는 최적의 시점입니다.',
    fov:     '180°',
    tip:     '전술·패턴 분석에 최고',
    videoId: 'LXb3EKWsInQ',
    mapX:    50,
    mapY:    15,
    bestFor: ['전술 분석', '패스 흐름', '포메이션'],
  },
  {
    id:      'goal',
    label:   '골대 뒤',
    labelEn: 'BEHIND THE GOAL',
    icon:    '🥅',
    desc:    '슛과 골 장면을 가장 생생하게 체험할 수 있는 시점입니다.',
    fov:     '360°',
    tip:     '득점 순간 최고의 몰입감',
    videoId: 'LXb3EKWsInQ',
    mapX:    5,
    mapY:    50,
    bestFor: ['슛 장면', '코너킥', '골 세리머니'],
  },
  {
    id:      'bench',
    label:   '벤치 근처',
    labelEn: 'DUGOUT SIDE',
    icon:    '🪑',
    desc:    '선수·감독의 표정과 전술 지시까지 생생하게 볼 수 있습니다.',
    fov:     '120°',
    tip:     '감독 전술 지시 관찰 가능',
    videoId: 'LXb3EKWsInQ',
    mapX:    50,
    mapY:    88,
    bestFor: ['교체 장면', '감독 리액션', '선수 대화'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
    : '255, 255, 255'
}

export function getEventLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    goal:   '득점',
    yellow: '경고',
    red:    '퇴장',
    sub:    '교체',
    var:    'VAR',
  }
  return map[type]
}
