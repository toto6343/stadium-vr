'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VIEWPOINTS, hexToRgb, type Viewpoint, type Match } from '@/lib/data'
import { syncMatchFromSofaScore } from '@/app/actions'

export default function MatchPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<Viewpoint>(VIEWPOINTS[0])
  const [ready, setReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'viewpoint' | 'events'>('viewpoint')

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50)
    
    async function loadMatchDetail() {
      if (!id) return
      const result = await syncMatchFromSofaScore(Number(id))
      if (result.success && result.data) {
        setMatch(result.data)
      }
      setLoading(false)
    }

    loadMatchDetail()
    
    // 실시간 업데이트 (1분마다)
    const interval = setInterval(loadMatchDetail, 60000)
    
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [id])

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="live-dot scale-150 mb-4" />
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-4)', letterSpacing: 4, fontSize: 14 }}>
        실시간 경기 정보 분석 중...
      </div>
    </main>
  )

  if (!match) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--text-4)', letterSpacing: 3 }}>
        경기를 찾을 수 없습니다
      </div>
    </main>
  )

  const handleEnter = () => {
    router.push(`/watch/${match.id}?view=${selectedView.id}`)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>

      {/* Ambient BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 320,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,45,45,0.07) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 16px 120px' }}>

        {/* ── Back + Title ── */}
        <div
          className={ready ? 'anim-fade-in' : 'opacity-0'}
          style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 20 }}
        >
          <Link href="/" style={{
            width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', fontSize: 18, color: '#fff',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            transition: 'background 0.2s',
          }}>←</Link>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 4 }}>
              좌석 선택
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
              {match.stadium}
            </div>
          </div>
        </div>

        {/* ── Live Score Card ── */}
        <div className={ready ? 'anim-fade-up' : 'opacity-0'}>
          <LiveScoreCard match={match} />
        </div>

        {/* ── Tab Bar ── */}
        <div
          className={ready ? 'anim-fade-up delay-1' : 'opacity-0'}
          style={{
            display: 'flex', gap: 4, marginTop: 20,
            padding: 4, borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
          }}
        >
          {([
            { key: 'viewpoint', label: '💺  시점 선택' },
            { key: 'events',    label: '📋  경기 이벤트' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '9px 0',
                borderRadius: 12, border: 'none',
                background: activeTab === tab.key ? 'rgba(255,45,45,0.12)' : 'transparent',
                color: activeTab === tab.key ? 'var(--red)' : 'var(--text-3)',
                fontFamily: 'var(--font-display)', fontSize: 12,
                letterSpacing: 1, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                outline: activeTab === tab.key ? '1px solid rgba(255,45,45,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Viewpoint Tab ── */}
        {activeTab === 'viewpoint' && (
          <div className="anim-fade-in">
            {/* Stadium Diagram */}
            <div style={{ marginTop: 16 }}>
              <Label text="경기장 좌석 선택" />
              <StadiumDiagram selected={selectedView} onSelect={setSelectedView} />
            </div>

            {/* Viewpoint Cards */}
            <div style={{ marginTop: 16 }}>
              <Label text="시점 상세" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {VIEWPOINTS.map((vp, i) => (
                  <ViewpointCard
                    key={vp.id}
                    vp={vp}
                    active={selectedView.id === vp.id}
                    onClick={() => setSelectedView(vp)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Events Tab ── */}
        {activeTab === 'events' && (
          <div className="anim-fade-in" style={{ marginTop: 16 }}>
            <Label text="경기 주요 장면" />
            <EventsPanel match={match} />

            {/* Attendance */}
            {match.status !== 'UPCOMING' && match.attendance > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="glass" style={{ borderRadius: 16, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 3, marginBottom: 4 }}>
                        관중
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#fff' }}>
                        {match.attendance.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 3, marginBottom: 4 }}>
                        수용 인원
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--text-3)' }}>
                        {match.capacity.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {/* Attendance bar */}
                  <div style={{
                    marginTop: 12, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min(100, (match.attendance / match.capacity) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--red), #ff8888)',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <div style={{
                    marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)',
                    textAlign: 'right',
                  }}>
                    {Math.round((match.attendance / match.capacity) * 100)}% 점유율
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Fixed Enter Button ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '12px 16px 24px',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      }}>
        <button
          onClick={handleEnter}
          className="hover-lift"
          style={{
            width: '100%', maxWidth: 480, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            margin: '0 auto', padding: '16px 0',
            borderRadius: 18, border: 'none',
            background: 'linear-gradient(135deg, var(--red) 0%, var(--red-dim) 50%, var(--red) 100%)',
            backgroundSize: '200% 200%',
            boxShadow: '0 8px 36px rgba(255,45,45,0.45)',
            color: '#fff', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 22 }}>{selectedView.icon}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>
            {selectedView.label}로 입장
          </span>
          <span style={{ fontSize: 16 }}>▶</span>
        </button>
      </div>
    </main>
  )
}

/* ── Sub-Components ───────────────────────────────────────────────────────── */

function Label({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
      color: 'var(--text-4)', letterSpacing: 4, textTransform: 'uppercase',
      marginBottom: 10, paddingLeft: 2,
    }}>
      {text}
    </div>
  )
}

function LiveScoreCard({ match }: { match: Match }) {
  return (
    <div className="glass-live" style={{ borderRadius: 22, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      {/* Top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, var(--red) 30%, #ff8888 60%, var(--red) 85%, transparent)',
      }} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Home */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: match.home.color }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900,
              color: '#fff', letterSpacing: 2,
            }}>{match.home.short}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)', paddingLeft: 20 }}>
            {match.home.name}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 48,
            letterSpacing: 10, lineHeight: 1, color: '#fff',
          }}>
            {match.home.score}
            <span style={{ color: 'rgba(255,255,255,0.1)', margin: '0 2px' }}>:</span>
            {match.away.score}
          </div>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            {match.status === 'LIVE' ? (
              <span className="glass-live" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999,
              }}>
                <span className="live-dot" />
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 13,
                  color: '#ff9b9b', fontWeight: 700, letterSpacing: 2,
                }}>
                  {match.time}
                </span>
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-4)', letterSpacing: 3 }}>
                FT
              </span>
            )}
          </div>
          {match.status === 'LIVE' && (
            <div style={{
              marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 10,
              color: 'var(--text-4)', letterSpacing: 1,
            }}>
              {match.half === 1 ? '전반전' : '후반전'}
            </div>
          )}
        </div>

        {/* Away */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, justifyContent: 'flex-end' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900,
              color: '#fff', letterSpacing: 2,
            }}>{match.away.short}</span>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: match.away.color }} />
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)', paddingRight: 20 }}>
            {match.away.name}
          </div>
        </div>
      </div>
    </div>
  )
}

function StadiumDiagram({ selected, onSelect }: { selected: Viewpoint; onSelect: (v: Viewpoint) => void }) {
  const W = 440, H = 200

  // Convert percentage to SVG coords
  const toSvg = (pct: number, max: number) => (pct / 100) * max

  return (
    <div className="glass" style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 200 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Pitch fill */}
        <rect x="18" y="14" width={W - 36} height={H - 28} rx="8"
          fill="rgba(0,60,20,0.1)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

        {/* Stripes */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={i}
            x={18 + i * ((W-36)/6)} y="14"
            width={(W-36)/6} height={H-28}
            fill={i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent'}
          />
        ))}

        {/* Center line */}
        <line x1={W/2} y1="14" x2={W/2} y2={H-14}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

        {/* Center circle */}
        <circle cx={W/2} cy={H/2} r="34"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <circle cx={W/2} cy={H/2} r="3"
          fill="rgba(255,255,255,0.18)" />

        {/* Left penalty area */}
        <rect x="18" y={H/2 - 42} width="58" height="84" rx="2"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <rect x="18" y={H/2 - 22} width="22" height="44" rx="2"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <circle cx="70" cy={H/2} r="16"
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          strokeDasharray="4 2" />

        {/* Right penalty area */}
        <rect x={W - 76} y={H/2 - 42} width="58" height="84" rx="2"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <rect x={W - 40} y={H/2 - 22} width="22" height="44" rx="2"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <circle cx={W - 70} cy={H/2} r="16"
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          strokeDasharray="4 2" />

        {/* Corner marks */}
        {[[18,14],[W-18,14],[18,H-14],[W-18,H-14]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4"
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
      </svg>

      {/* Viewpoint markers */}
      {VIEWPOINTS.map(vp => {
        const isActive = selected.id === vp.id
        const x = toSvg(vp.mapX, 100)  // as percent of container
        const y = toSvg(vp.mapY, 100)
        return (
          <button
            key={vp.id}
            onClick={() => onSelect(vp)}
            style={{
              position: 'absolute',
              left: `${vp.mapX}%`,
              top: `${vp.mapY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {/* Ping ring for active */}
            {isActive && (
              <span style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                background: 'var(--red)',
                opacity: 0.15,
                animation: 'markerPing 1.4s ease-out infinite',
              }} />
            )}
            <div style={{
              width: isActive ? 46 : 34,
              height: isActive ? 46 : 34,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isActive ? 20 : 14,
              background: isActive ? 'rgba(255,45,45,0.3)' : 'rgba(255,255,255,0.08)',
              border: `2px solid ${isActive ? 'var(--red)' : 'rgba(255,255,255,0.18)'}`,
              boxShadow: isActive ? '0 0 20px rgba(255,45,45,0.55)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {vp.icon}
            </div>
            {isActive && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                marginTop: 5, whiteSpace: 'nowrap',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 8,
                  color: '#ff8888', letterSpacing: 2,
                  background: 'rgba(0,0,0,0.75)',
                  padding: '2px 7px', borderRadius: 999,
                }}>
                  {vp.labelEn}
                </span>
              </div>
            )}
          </button>
        )
      })}

      {/* Corner hint */}
      <div style={{
        position: 'absolute', bottom: 8, right: 12,
        fontFamily: 'var(--font-display)', fontSize: 8,
        color: 'var(--text-4)', letterSpacing: 2,
      }}>
        마커를 눌러 시점 변경
      </div>
    </div>
  )
}

function ViewpointCard({ vp, active, onClick }: { vp: Viewpoint; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 16,
        background: active ? 'rgba(255,45,45,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(255,45,45,0.4)' : 'var(--border)'}`,
        cursor: 'pointer', transition: 'all 0.2s',
        outline: 'none',
      }}
    >
      {/* Icon box */}
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        background: active ? 'rgba(255,45,45,0.15)' : 'rgba(255,255,255,0.05)',
        transition: 'background 0.2s',
      }}>
        {vp.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
          color: active ? 'var(--red)' : '#ddd', letterSpacing: 1,
          transition: 'color 0.2s',
        }}>
          {vp.label}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)',
          marginTop: 3, lineHeight: 1.4,
        }}>
          {vp.desc}
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {vp.bestFor.map((tag, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-display)', fontSize: 9,
              padding: '2px 7px', borderRadius: 999,
              background: active ? 'rgba(255,45,45,0.12)' : 'rgba(255,255,255,0.05)',
              color: active ? '#ff9b9b' : 'var(--text-4)',
              letterSpacing: 1,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* FOV badge */}
      <div style={{
        flexShrink: 0, padding: '4px 10px', borderRadius: 999,
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
        background: active ? 'rgba(255,45,45,0.2)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? 'rgba(255,45,45,0.35)' : 'rgba(255,255,255,0.07)'}`,
        color: active ? '#ff9b9b' : 'var(--text-4)',
        transition: 'all 0.2s',
      }}>
        {vp.fov}
      </div>
    </button>
  )
}

function EventsPanel({ match }: { match: Match }) {
  if (match.events.length === 0) {
    return (
      <div className="glass" style={{ borderRadius: 16, padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-4)' }}>
          아직 주요 이벤트가 없습니다
        </div>
      </div>
    )
  }
  return (
    <div className="glass" style={{ borderRadius: 16, padding: '6px 0' }}>
      {match.events.map((ev, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 18px',
          borderBottom: i < match.events.length - 1
            ? '1px solid rgba(255,255,255,0.04)'
            : 'none',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11,
            color: 'var(--text-4)', width: 28, flexShrink: 0,
          }}>
            {ev.time}
          </span>
          <span style={{ fontSize: 15 }}>{ev.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ccc' }}>
              {ev.player}
            </div>
            {ev.desc && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>
                {ev.desc}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 1,
              padding: '2px 8px', borderRadius: 999,
              background: ev.team === 'home'
                ? `rgba(${hexToRgb(match.home.color)}, 0.15)`
                : `rgba(${hexToRgb(match.away.color)}, 0.15)`,
              color: ev.team === 'home' ? match.home.color : match.away.color,
            }}>
              {ev.team === 'home' ? match.home.short : match.away.short}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
