'use server'

import { SofaScore, mapSofaScoreToMatch } from '@/lib/sofascore-api';
import { supabase } from '@/lib/supabase';
import { type Match } from '@/lib/data';

/**
 * 오늘의 모든 경기 목록을 가져와서 우리 프로젝트 형식으로 변환 (DB 캐싱 포함)
 */
export async function getTodayMatches() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await SofaScore.getMatchesByDate(today);
    
    if (!data.events) return { success: true, data: [] };

    // DB에서 모든 경기 응원 데이터 한꺼번에 가져오기
    const { data: dbMatches } = await supabase
      .from('matches')
      .select('id, home_cheers, away_cheers');

    const formattedMatches = data.events.map((ev: any) => {
      const dbMatch = dbMatches?.find(m => m.id === ev.id);
      return {
        id: ev.id,
        home: {
          name: ev.homeTeam.name,
          short: ev.homeTeam.nameCode || ev.homeTeam.name.substring(0, 3).toUpperCase(),
          color: ev.homeTeam.teamColorPrimary || '#E63946',
          score: ev.homeScore?.current ?? 0,
          logo: `https://api.sofascore.app/api/v1/team/${ev.homeTeam.id}/image`,
        },
        away: {
          name: ev.awayTeam.name,
          short: ev.awayTeam.nameCode || ev.awayTeam.name.substring(0, 3).toUpperCase(),
          color: ev.awayTeam.teamColorPrimary || '#457B9D',
          score: ev.awayScore?.current ?? 0,
          logo: `https://api.sofascore.app/api/v1/team/${ev.awayTeam.id}/image`,
        },
        league: ev.tournament.uniqueTournament?.name || ev.tournament.name,
        stadium: ev.venue?.name || 'Stadium',
        time: ev.status.type === 'inprogress' ? `${ev.status.displayTime}'` : ev.status.description,
        status: ev.status.type === 'inprogress' ? 'LIVE' : (ev.status.type === 'finished' ? 'END' : 'UPCOMING'),
        events: [],
        home_cheers: dbMatch?.home_cheers || 0,
        away_cheers: dbMatch?.away_cheers || 0
      };
    });

    return { success: true, data: formattedMatches };
  } catch (error) {
    console.error('Fetch today matches failed:', error);
    return { success: false, error: 'Failed to fetch matches' };
  }
}

/**
 * SofaScore에서 특정 경기를 가져와서 데이터를 반환 (DB 캐싱 로직 포함)
 */
export async function syncMatchFromSofaScore(eventId: number) {
  try {
    // 1. DB에서 해당 경기의 캐시된 데이터가 있는지 확인 (최근 1분 이내)
    const { data: cachedMatch } = await supabase
      .from('matches')
      .select('*, updated_at')
      .eq('id', eventId)
      .single();

    const now = new Date();
    const cacheLimit = 60 * 1000;

    // 캐시가 유효하면 추가 API 호출 없이 DB 데이터 사용 가능 (추후 확장 가능)
    // 현재는 실시간성을 위해 항상 최신 API 데이터를 병합함

    // 2. API 호출
    const details = await SofaScore.getMatchDetails(eventId);
    const incidents = await SofaScore.getMatchIncidents(eventId);
    const matchData = mapSofaScoreToMatch(details, incidents.incidents || []);

    // 3. DB 데이터와 병합 (실시간 응원 카운트)
    const { data: dbData } = await supabase
      .from('matches')
      .select('home_cheers, away_cheers')
      .eq('id', eventId)
      .single();

    if (dbData) {
      matchData.home_cheers = dbData.home_cheers || 0;
      matchData.away_cheers = dbData.away_cheers || 0;
    }

    return { success: true, data: matchData };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error: 'Failed to sync data' };
  }
}

/**
 * 실시간 응원하기: DB의 응원 카운트를 1 증가시킴
 */
export async function addCheer(matchId: number, team: 'home' | 'away') {
  try {
    const column = team === 'home' ? 'home_cheers' : 'away_cheers';
    
    // RPC를 사용하거나 직접 쿼리로 카운트 증가
    const { data, error } = await supabase
      .from('matches')
      .select(column)
      .eq('id', matchId)
      .single();

    if (error) throw error;

    const newCount = (data[column] || 0) + 1;

    const { error: updateError } = await supabase
      .from('matches')
      .update({ [column]: newCount })
      .eq('id', matchId);

    if (updateError) throw updateError;

    return { success: true, count: newCount };
  } catch (error) {
    console.error('Cheer failed:', error);
    return { success: false };
  }
}

/**
 * 실시간 채팅 메시지 전송
 */
export async function sendMessage(matchId: number, nickname: string, content: string, team?: 'home' | 'away') {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { match_id: matchId, nickname, content, team_side: team }
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Send message failed:', error);
    return { success: false };
  }
}
