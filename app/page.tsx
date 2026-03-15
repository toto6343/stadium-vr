'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { hexToRgb, type Match } from '@/lib/data'
import { getTodayMatches } from '@/app/actions'

export default function HomePage() {
  const [ready, setReady] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL')
  const [pinnedLeagues, setPinnedLeagues] = useState<string[]>([])

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50)
    
    // 로컬 스토리지에서 고정된 리그 불러오기
    const saved = localStorage.getItem('pinnedLeagues')
    if (saved) setPinnedLeagues(JSON.parse(saved))

    async function loadMatches() {
      const result = await getTodayMatches();
      if (result.success && result.data) {
        setMatches(result.data);
      }
      setLoading(false);
    }

    loadMatches();
    return () => clearTimeout(t)
  }, [])

  const togglePin = (e: React.MouseEvent, league: string) => {
    e.stopPropagation()
    const next = pinnedLeagues.includes(league)
      ? pinnedLeagues.filter(l => l !== league)
      : [...pinnedLeagues, league]
    setPinnedLeagues(next)
    localStorage.setItem('pinnedLeagues', JSON.stringify(next))
  }

  // 존재하는 리그 목록 추출 및 정렬 (고정된 리그 우선)
  const leagues = useMemo(() => {
    const list = Array.from(new Set(matches.map(m => m.league)))
    const sorted = list.sort((a, b) => {
      const aPinned = pinnedLeagues.includes(a) ? 1 : 0
      const bPinned = pinnedLeagues.includes(b) ? 1 : 0
      return bPinned - aPinned
    })
    return ['ALL', ...sorted].slice(0, 25)
  }, [matches, pinnedLeagues])

  // 가장 응원이 많은 경기 (HOT 경기)
  const hotMatchId = useMemo(() => {
    if (matches.length === 0) return null
    const sorted = [...matches].sort((a, b) => 
      ((b.home_cheers || 0) + (b.away_cheers || 0)) - ((a.home_cheers || 0) + (a.away_cheers || 0))
    )
    return sorted[0].id
  }, [matches])

  // 필터링된 경기 목록
  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'ALL') return matches
    return matches.filter(m => m.league === selectedLeague)
  }, [matches, selectedLeague])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#080810]">
        <div className="flex flex-col items-center gap-4">
          <div className="live-dot scale-150" />
          <div className="text-white font-display text-xl tracking-widest animate-pulse mt-2">
            실시간 경기 데이터 불러오는 중...
          </div>
        </div>
      </main>
    )
  }

  const live     = filteredMatches.filter(m => m.status === 'LIVE')
  const upcoming = filteredMatches.filter(m => m.status === 'UPCOMING')
  const ended    = filteredMatches.filter(m => m.status === 'END')

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 500,
          background: 'radial-gradient(ellipse at center, rgba(255,45,45,0.07) 0%, transparent 68%)',
        }} />
        <div className="absolute inset-0 pitch-bg opacity-40" />
      </div>

      <div className="relative max-w-[480px] mx-auto px-4 pb-20" style={{ zIndex: 1 }}>

        {/* ── Header ── */}
        <header
          className={ready ? 'anim-fade-up' : 'opacity-0'}
          style={{ paddingTop: 48, paddingBottom: 20, textAlign: 'center' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1 }}>
            <span style={{ fontSize: 58, letterSpacing: 6, color: '#fff' }}>STADIUM</span>
            <span style={{ fontSize: 58, letterSpacing: 6, color: 'var(--red)' }}>VR</span>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-3)', letterSpacing: 3, marginTop: 10,
          }}>
            실시간 데이터를 기반으로 한 VR 경기장
          </p>
        </header>

        {/* ── League Filter ── */}
        <div 
          className={ready ? 'anim-fade-up delay-1' : 'opacity-0'}
          style={{ 
            marginBottom: 24, overflowX: 'auto', display: 'flex', gap: 8, 
            paddingBottom: 8, scrollbarWidth: 'none'
          }}
        >
          {leagues.map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 12,
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                background: selectedLeague === league ? 'var(--red)' : 'rgba(255,255,255,0.04)',
                color: selectedLeague === league ? '#fff' : 'var(--text-3)',
                border: `1px solid ${selectedLeague === league ? 'var(--red)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              {league !== 'ALL' && (
                <span 
                  onClick={(e) => togglePin(e, league)}
                  style={{ 
                    color: pinnedLeagues.includes(league) ? '#FFD700' : 'rgba(255,255,255,0.15)', 
                    fontSize: 14, transition: 'color 0.2s' 
                  }}
                >
                  {pinnedLeagues.includes(league) ? '★' : '☆'}
                </span>
              )}
              {league === 'ALL' ? '전체 경기' : league}
            </button>
          ))}
        </div>

        {/* ── Results Summary ── */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-4)', letterSpacing: 2 }}>
            {selectedLeague === 'ALL' ? '오늘의 전 세계 경기' : `${selectedLeague} 경기`}
            <span style={{ color: 'var(--red)', marginLeft: 6 }}>{filteredMatches.length}</span>
          </span>
        </div>

        {/* ── LIVE 경기 ── */}
        {live.length > 0 && (
          <section className={ready ? 'anim-fade-up delay-1' : 'opacity-0'} style={{ marginBottom: 32 }}>
            <SectionHeader icon="🔴" label="LIVE 경기" count={live.length} />
            {live.map((m, i) => (
              <Link key={m.id} href={`/matches/${m.id}`} style={{ textDecoration: 'none' }}>
                <MatchCard match={m} delay={i * 50} isHot={m.id === hotMatchId} />
              </Link>
            ))}
          </section>
        )}

        {/* ── 예정 경기 ── */}
        {upcoming.length > 0 && (
          <section className={ready ? 'anim-fade-up delay-2' : 'opacity-0'} style={{ marginBottom: 32 }}>
            <SectionHeader icon="⏰" label="오늘 예정" count={upcoming.length} />
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} dimmed />
            ))}
          </section>
        )}

        {/* ── 종료 ── */}
        {ended.length > 0 && (
          <section className={ready ? 'anim-fade-up delay-3' : 'opacity-0'} style={{ marginBottom: 32 }}>
            <SectionHeader icon="✓" label="종료된 경기" count={ended.length} />
            {ended.map((m) => (
              <MatchCard key={m.id} match={m} dimmed />
            ))}
          </section>
        )}

        {/* ── MVP Tag ── */}
        <div
          className={ready ? 'anim-fade-up delay-4' : 'opacity-0'}
          style={{ textAlign: 'center', marginTop: 16 }}
        >
          <div className="glass" style={{
            display: 'inline-block', padding: '14px 28px', borderRadius: 16,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 3, marginBottom: 4 }}>
              CURRENT BUILD
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--red)', letterSpacing: 3 }}>
              MVP 1단계
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-3)', marginTop: 4, letterSpacing: 1 }}>
              360° 영상 · 3시점 선택 · 실시간 스코어
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

/* ── Sub-Components ───────────────────────────────────────────────────────── */

function SectionHeader({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2,
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
        color: 'var(--text-3)', letterSpacing: 4, textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 10,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        color: 'var(--text-3)', padding: '1px 7px', borderRadius: 999,
      }}>{count}</span>
    </div>
  )
}

function MatchCard({ match, dimmed = false, delay = 0, isHot = false }: { match: Match; dimmed?: boolean; delay?: number; isHot?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const isLive     = match.status === 'LIVE'
  const isUpcoming = match.status === 'UPCOMING'

  const homeGoals = match.events.filter(e => e.type === 'goal' && e.team === 'home')
  const awayGoals = match.events.filter(e => e.type === 'goal' && e.team === 'away')

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, marginBottom: 10,
        padding: '18px 20px',
        background: isLive && hovered
          ? 'rgba(255,45,45,0.07)'
          : isLive ? 'rgba(255,45,45,0.04)' : 'rgba(255,255,255,0.02)',
        border: isLive
          ? `1px solid ${hovered ? 'rgba(255,45,45,0.5)' : 'rgba(255,45,45,0.22)'}`
          : '1px solid var(--border)',
        opacity: dimmed ? 0.42 : 1,
        cursor: isLive ? 'pointer' : 'default',
        transition: 'background 0.2s, border-color 0.2s',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Live top stripe */}
      {isLive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, var(--red) 30%, #ff8888 60%, var(--red) 85%, transparent 100%)',
        }} />
      )}

      {/* HOT Badge */}
      {isHot && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--red)', color: '#fff', padding: '2px 10px', borderRadius: 999,
          fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 900,
          letterSpacing: 2, boxShadow: '0 0 15px rgba(255,45,45,0.4)', zIndex: 10
        }}>
          🔥 HOT MATCH
        </div>
      )}

      {/* League + Stadium */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-4)', letterSpacing: 3 }}>
          {match.league}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)' }}>
          {match.stadium}
        </span>
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Home */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isLive ? match.home.color : 'var(--text-4)',
            }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: isLive ? '#fff' : 'var(--text-3)', letterSpacing: 2,
            }}>
              {match.home.short}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)', paddingLeft: 17 }}>
            {match.home.name}
          </div>
          {isLive && match.home.formation && (
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)',
              letterSpacing: 1, paddingLeft: 17, marginTop: 2,
            }}>
              {match.home.formation}
            </div>
          )}
        </div>

        {/* Score center */}
        <div style={{ textAlign: 'center', padding: '0 16px', minWidth: 100 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, lineHeight: 1,
            fontSize: isLive ? 40 : 30,
            color: isLive ? '#fff' : 'var(--text-3)',
            letterSpacing: 8,
          }}>
            <span>{match.home.score}</span>
            <span style={{ color: 'rgba(255,255,255,0.12)', margin: '0 2px' }}>:</span>
            <span>{match.away.score}</span>
          </div>

          {/* Time / Status pill */}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            {isLive ? (
              <span className="glass-live" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 999,
              }}>
                <span className="live-dot" />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 11,
                  color: '#ff9b9b', fontWeight: 700, letterSpacing: 1,
                }}>
                  {match.time}
                </span>
              </span>
            ) : isUpcoming ? (
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 12,
                color: 'var(--text-3)', letterSpacing: 2,
              }}>
                {match.time}
              </span>
            ) : (
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 11,
                color: 'var(--text-4)', letterSpacing: 2,
              }}>FT</span>
            )}
          </div>

          {/* Half indicator */}
          {isLive && (
            <div style={{ marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-4)' }}>
              {match.half === 1 ? '전반전' : match.half === 2 ? '후반전' : ''}
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, justifyContent: 'flex-end',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: isLive ? '#fff' : 'var(--text-3)', letterSpacing: 2,
            }}>
              {match.away.short}
            </span>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isLive ? match.away.color : 'var(--text-4)',
            }} />
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)', paddingRight: 17 }}>
            {match.away.name}
          </div>
          {isLive && match.away.formation && (
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)',
              letterSpacing: 1, paddingRight: 17, marginTop: 2,
            }}>
              {match.away.formation}
            </div>
          )}
        </div>
      </div>

      {/* Scorer pills */}
      {isLive && (homeGoals.length > 0 || awayGoals.length > 0) && (
        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, fontFamily: 'var(--font-body)', color: 'var(--text-3)',
        }}>
          <div style={{ flex: 1 }}>
            {homeGoals.map((g, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: 6 }}>
                ⚽ {g.player} <span style={{ color: 'var(--text-4)' }}>{g.time}</span>
              </span>
            ))}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {awayGoals.map((g, i) => (
              <span key={i} style={{ display: 'inline-block', marginLeft: 6 }}>
                <span style={{ color: 'var(--text-4)' }}>{g.time}</span> {g.player} ⚽
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent events mini bar */}
      {isLive && match.events.length > 0 && (
        <div style={{
          marginTop: 10, display: 'flex', gap: 5, overflowX: 'auto',
          paddingBottom: 2,
        }}>
          {match.events.slice(-5).map((ev, i) => (
            <div key={i} className="glass" style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 999,
            }}>
              <span style={{ fontSize: 10 }}>{ev.icon}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-3)' }}>
                {ev.time}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Enter CTA */}
      {isLive && (
        <div style={{
          marginTop: 12, textAlign: 'center',
          fontFamily: 'var(--font-display)', fontSize: 10,
          color: hovered ? 'var(--red)' : 'rgba(255,45,45,0.5)',
          letterSpacing: 3, transition: 'color 0.2s',
        }}>
          탭하여 VR 입장  →
        </div>
      )}
    </div>
  )
}
