'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { VIEWPOINTS, hexToRgb, type Viewpoint, type Match } from '@/lib/data'
import { syncMatchFromSofaScore, sendMessage } from '@/app/actions'

type ToastItem = { id: number; msg: string }
type ChatMsg = { id: number; nickname: string; content: string; team_side?: 'home' | 'away' }

export default function WatchPage() {
  const { id }          = useParams()
  const searchParams    = useSearchParams()
  
  const [match, setMatch] = useState<Match | null>(null)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [nickname, setNickname] = useState('')

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const initViewId      = searchParams.get('view') || 'center'
  const [view, setView] = useState<Viewpoint>(
    VIEWPOINTS.find(v => v.id === initViewId) ?? VIEWPOINTS[0]
  )

  /* UI state */
  const [overlayOpen,   setOverlayOpen]   = useState(false)
  const [eventsOpen,    setEventsOpen]    = useState(false)
  const [chatOpen,      setChatOpen]      = useState(true) // 기본으로 채팅은 열림
  const [viewTransit,   setViewTransit]   = useState(false)
  const [goalFlash,     setGoalFlash]     = useState(false)
  const [toasts,        setToasts]        = useState<ToastItem[]>([])
  const [scoreKey,      setScoreKey]      = useState(0)
  const [viewInfoOpen,  setViewInfoOpen]  = useState(false)

  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastId         = useRef(0)

  /* ── Nickname Init ── */
  useEffect(() => {
    let saved = localStorage.getItem('stadium_nick')
    if (!saved) {
      saved = `팬_${Math.floor(Math.random() * 9000) + 1000}`
      localStorage.setItem('stadium_nick', saved)
    }
    setNickname(saved)
  }, [])

  /* ── Realtime Chat Subscription ── */
  useEffect(() => {
    if (!id) return

    // 1. 기존 메시지 불러오기
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', Number(id))
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setChatMsgs(data.reverse())
    }
    fetchMsgs()

    // 2. 새로운 메시지 실시간 리스너
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${id}` 
      }, (payload) => {
        setChatMsgs(prev => [...prev.slice(-19), payload.new as ChatMsg])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMsgs, chatOpen])

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !match) return
    const content = chatInput
    setChatInput('')
    await sendMessage(Number(id), nickname, content)
  }

  /* ── Helpers ── */
  const addToast = useCallback((msg: string) => {
    const id = ++toastId.current
    setToasts(prev => [...prev.slice(-2), { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2600)
  }, [])

  const openOverlay = useCallback(() => {
    setOverlayOpen(true)
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    overlayTimerRef.current = setTimeout(() => setOverlayOpen(false), 4500)
  }, [])

  const switchView = useCallback((vp: Viewpoint) => {
    if (vp.id === view.id) { setOverlayOpen(false); return }
    setViewTransit(true)
    setTimeout(() => {
      setView(vp)
      setViewTransit(false)
      setOverlayOpen(false)
      addToast(`${vp.icon} ${vp.label}`)
    }, 320)
  }, [view.id, addToast])

  const [cheerMenuOpen, setCheerMenuOpen] = useState(false)
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number; tx: string; ty: string; tx2: string; ty2: string; rot: string; rot2: string }[]>([])

  const handleCheer = async (team: 'home' | 'away') => {
    if (!match) return
    setGoalFlash(true)
    setTimeout(() => setGoalFlash(false), 700)
    
    // 폭죽 효과 생성
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: team === 'home' ? '⚽' : '🔥', // 팀에 따라 다른 이모지
      x: Math.random() * 80 + 10, // 10% - 90% 사이 랜덤 시작
      y: 85, // 화면 하단에서 시작
      tx: `${(Math.random() - 0.5) * 200}px`,
      ty: `-${Math.random() * 200 + 100}px`,
      tx2: `${(Math.random() - 0.5) * 400}px`,
      ty2: `-${Math.random() * 500 + 300}px`,
      rot: `${(Math.random() - 0.5) * 90}deg`,
      rot2: `${(Math.random() - 0.5) * 180}deg`
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1300)

    // DB 업데이트
    import('@/app/actions').then(m => m.addCheer(Number(id), team))
    
    addToast(`${team === 'home' ? match.home.short : match.away.short} 응원! 🎉`)
    setCheerMenuOpen(false)
  }

  /* ── Data Fetching ── */
  useEffect(() => {
    async function loadMatchData() {
      if (!id) return
      const result = await syncMatchFromSofaScore(Number(id))
      if (result.success && result.data) {
        // 골이 터졌는지 확인 (이전 스코어와 비교)
        if (match && (result.data.home.score > match.home.score || result.data.away.score > match.away.score)) {
          setGoalFlash(true)
          setTimeout(() => setGoalFlash(false), 1500)
          addToast('⚽ GOALLLLLLL!!!!!')
          setScoreKey(prev => prev + 1)
        }
        setMatch(result.data)
      }
    }

    loadMatchData()
    const iv = setInterval(loadMatchData, 30000) // 30초마다 업데이트
    return () => clearInterval(iv)
  }, [id, match, addToast])

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    }
  }, [])

  if (!match) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div className="live-dot scale-150 mr-4" />
      <span style={{ color: '#ccc', fontFamily: 'var(--font-display)', letterSpacing: 3 }}>VR 스타디움 입장 중...</span>
    </div>
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', userSelect: 'none' }}
      onClick={openOverlay}
    >

      {/* ══ 1. 360° Video ══ */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: viewTransit ? 0 : 1,
        transition: 'opacity 0.32s ease',
      }}>
        <iframe
          key={view.id}   /* Force re-mount on view switch */
          src={`https://www.youtube.com/embed/${view.videoId}?autoplay=1&mute=1&loop=1&playlist=${view.videoId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* View switching overlay text */}
      {viewTransit && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{view.icon}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff',
              letterSpacing: 3, fontWeight: 700,
            }}>
              시점 전환 중...
            </div>
          </div>
        </div>
      )}

      {/* ══ 2. Vignette ══ */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.45) 100%)',
      }} />

      {/* ══ 3. Goal Flash ══ */}
      {goalFlash && (
        <div className="anim-flash" style={{
          position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
          background: 'rgba(255,45,45,0.22)',
        }} />
      )}

      {/* ══ Emoji Fireworks ══ */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="emoji-particle"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`,
            '--tw-tx': p.tx, '--tw-ty': p.ty,
            '--tw-tx2': p.tx2, '--tw-ty2': p.ty2,
            '--tw-rot': p.rot, '--tw-rot2': p.rot2
          } as any}
        >
          {p.emoji}
        </div>
      ))}

      {/* ══ 4. Top Score Bar — always visible ══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '14px 16px 28px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: 480, margin: '0 auto',
        }}>

          {/* Home team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: match.home.color }} />
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900,
              color: '#fff', letterSpacing: 2,
            }}>{match.home.short}</span>
            <span key={`h-${scoreKey}`} style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
              color: '#fff', lineHeight: 1, marginLeft: 4,
            }}>{match.home.score}</span>
          </div>

          {/* Center: time + status */}
          <div style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(255,45,45,0.18)',
              border: '1px solid rgba(255,45,45,0.35)',
            }}>
              <span className="live-dot" />
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 13,
                color: '#ff9b9b', fontWeight: 700, letterSpacing: 2,
              }}>{match.time}</span>
            </div>
            <div style={{
              marginTop: 3, fontFamily: 'var(--font-body)', fontSize: 9,
              color: 'rgba(255,255,255,0.25)', letterSpacing: 1,
            }}>
              {match.half === 1 ? '전반전' : '후반전'}
            </div>
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
            <span key={`a-${scoreKey}`} style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900,
              color: '#fff', lineHeight: 1, marginRight: 4,
            }}>{match.away.score}</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 900,
              color: '#fff', letterSpacing: 2,
            }}>{match.away.short}</span>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: match.away.color }} />
          </div>
        </div>

        {/* ── Cheer Gauge ── */}
        <div style={{ maxWidth: 420, margin: '8px auto 0', padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
             <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: match.home.color, letterSpacing: 1, fontWeight: 700 }}>
               {(match.home_cheers || 0) >= (match.away_cheers || 0) && (match.home_cheers || 0) > 0 && '👑 '}
               {match.home_cheers || 0} CHEERS
             </span>
             <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: match.away.color, letterSpacing: 1, fontWeight: 700 }}>
               {match.away_cheers || 0} CHEERS
               {(match.away_cheers || 0) >= (match.home_cheers || 0) && (match.away_cheers || 0) > 0 && ' 👑'}
             </span>
          </div>
          <div style={{
            height: 3, borderRadius: 999, overflow: 'hidden',
            background: 'rgba(255,255,255,0.1)', display: 'flex',
          }}>
            <div style={{
              height: '100%', background: match.home.color,
              width: `${((match.home_cheers || 1) / ((match.home_cheers || 1) + (match.away_cheers || 1))) * 100}%`,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: `0 0 10px ${match.home.color}88`,
            }} />
            <div style={{
              height: '100%', background: match.away.color,
              flex: 1,
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: `0 0 10px ${match.away.color}88`,
            }} />
          </div>
        </div>
      </div>

      {/* ══ 5. Current Viewpoint Label ══ */}
      <div style={{
        position: 'absolute', top: 72, left: 16, zIndex: 20, pointerEvents: 'none',
      }}>
        <div className="glass-dark" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 999,
        }}>
          <span style={{ fontSize: 14 }}>{view.icon}</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
            color: '#fff', letterSpacing: 2,
          }}>{view.label}</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 9,
            background: 'rgba(255,45,45,0.22)', color: '#ff9b9b',
            padding: '2px 7px', borderRadius: 999, marginLeft: 2,
          }}>{view.fov}</span>
        </div>
      </div>

      {/* ══ 6. View Info Button ══ */}
      <button
        onClick={e => { e.stopPropagation(); setViewInfoOpen(v => !v) }}
        style={{
          position: 'absolute', top: 72, right: 16, zIndex: 20,
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >ℹ</button>

      {viewInfoOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="glass-dark anim-slide-down"
          style={{
            position: 'absolute', top: 114, right: 16, zIndex: 25,
            width: 230, padding: '14px 16px', borderRadius: 16,
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 6 }}>
            {view.icon} {view.label}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 8 }}>
            {view.desc}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,165,0,0.8)' }}>
            💡 {view.tip}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {view.bestFor.map((t, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-display)', fontSize: 9,
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)',
                padding: '2px 8px', borderRadius: 999, letterSpacing: 1,
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* ══ 7. Tap hint ══ */}
      {!overlayOpen && (
        <div style={{
          position: 'absolute', bottom: 100, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            padding: '7px 18px', borderRadius: 999,
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 11,
              color: 'rgba(255,255,255,0.25)', letterSpacing: 1,
            }}>
              화면을 탭하면 메뉴가 열립니다
            </span>
          </div>
        </div>
      )}

      {/* ══ 8. Toast notifications ══ */}
      <div style={{
        position: 'absolute', top: 130, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
      }}>
        {toasts.map(t => (
          <div key={t.id} className="anim-toast glass-dark" style={{
            padding: '7px 18px', borderRadius: 999,
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 13, color: '#fff', letterSpacing: 1,
            }}>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ══ 9. Bottom Overlay Panel ══ */}
      <div
        className="overlay-panel"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
          transform: overlayOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="glass-dark" style={{ borderRadius: '24px 24px 0 0', padding: '0 0 env(safe-area-inset-bottom)' }}>

          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          <div style={{ padding: '8px 16px 28px', maxWidth: 480, margin: '0 auto' }}>

            {/* ── View Switch ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)',
                letterSpacing: 4, marginBottom: 10,
              }}>시점 전환</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {VIEWPOINTS.map(vp => (
                  <button
                    key={vp.id}
                    onClick={() => switchView(vp)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 6,
                      padding: '12px 6px',
                      borderRadius: 16, border: 'none', cursor: 'pointer',
                      background: view.id === vp.id
                        ? 'rgba(255,45,45,0.15)' : 'rgba(255,255,255,0.04)',
                      outline: `1px solid ${view.id === vp.id ? 'rgba(255,45,45,0.45)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{vp.icon}</span>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                      color: view.id === vp.id ? '#ff9b9b' : 'var(--text-3)',
                      letterSpacing: 1,
                    }}>{vp.label}</span>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: 8,
                      color: view.id === vp.id ? 'rgba(255,155,155,0.6)' : 'var(--text-4)',
                    }}>{vp.fov}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Live Events ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 4,
                }}>실시간 응원 톡</div>
                <button
                  onClick={() => setChatOpen(v => !v)}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--red)',
                    background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  {chatOpen ? '접기 ▲' : '열기 ▼'}
                </button>
              </div>

              {chatOpen && (
                <div style={{ position: 'relative' }}>
                  <div 
                    ref={chatScrollRef}
                    className="glass" 
                    style={{
                      borderRadius: 14, padding: '12px',
                      height: 180, overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      marginBottom: 8
                    }}
                  >
                    {chatMsgs.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-4)' }}>
                        첫 응원 메시지를 남겨보세요!
                      </div>
                    ) : chatMsgs.map((msg) => (
                      <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--red)', 
                          fontWeight: 700, whiteSpace: 'nowrap' 
                        }}>
                          {msg.nickname}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#ccc', wordBreak: 'break-all' }}>
                          {msg.content}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 6 }}>
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="메시지 입력..."
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 12, outline: 'none'
                      }}
                    />
                    <button type="submit" style={{
                      background: 'var(--red)', color: '#fff', border: 'none',
                      borderRadius: 10, padding: '0 16px', fontSize: 12, fontWeight: 700,
                      fontFamily: 'var(--font-display)', cursor: 'pointer'
                    }}>전송</button>
                  </form>
                </div>
              )}

              {!chatOpen && chatMsgs.length > 0 && (
                <div className="glass" style={{ padding: '8px 12px', borderRadius: 12, display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>{chatMsgs[chatMsgs.length-1].nickname}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{chatMsgs[chatMsgs.length-1].content}</span>
                </div>
              )}
            </div>

            {/* ── Match Incidents (기존 Live Events 부분을 아래로 이동) ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-4)', letterSpacing: 4,
                }}>주요 장면</div>
                <button
                  onClick={() => setEventsOpen(v => !v)}
                  style={{
                    fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--red)',
                    background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 1,
                  }}
                >
                  {eventsOpen ? '접기 ▲' : '펼치기 ▼'}
                </button>
              </div>

              {!eventsOpen && match.events.length > 0 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
                  {match.events.slice(-5).map((ev, i) => (
                    <div key={i} className="glass" style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 999,
                    }}>
                      <span style={{ fontSize: 12 }}>{ev.icon}</span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 10,
                        color: 'var(--text-3)', letterSpacing: 1,
                      }}>{ev.time} {ev.player}</span>
                    </div>
                  ))}
                </div>
              )}

              {eventsOpen && (
                <div className="glass" style={{
                  borderRadius: 14, padding: '4px 0',
                  maxHeight: 180, overflowY: 'auto',
                }}>
                  {match.events.length === 0 ? (
                    <div style={{
                      padding: '14px', textAlign: 'center',
                      fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-4)',
                    }}>
                      아직 주요 장면이 없습니다
                    </div>
                  ) : match.events.map((ev, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px',
                      borderBottom: i < match.events.length - 1
                        ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 10,
                        color: 'var(--text-4)', width: 26, flexShrink: 0,
                      }}>{ev.time}</span>
                      <span style={{ fontSize: 13 }}>{ev.icon}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#bbb', flex: 1 }}>
                        {ev.player}
                      </span>
                      {ev.desc && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-4)' }}>
                          {ev.desc}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              {cheerMenuOpen ? (
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCheer('home')}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 14,
                      background: match.home.color, color: '#fff', border: 'none',
                      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {match.home.short}
                  </button>
                  <button
                    onClick={() => handleCheer('away')}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 14,
                      background: match.away.color, color: '#fff', border: 'none',
                      fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {match.away.short}
                  </button>
                  <button
                    onClick={() => setCheerMenuOpen(false)}
                    style={{
                      padding: '11px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.05)', color: '#ccc', border: 'none',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCheerMenuOpen(true)}
                  style={{
                    flex: 1, padding: '11px 0',
                    borderRadius: 14, border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.04)',
                    fontFamily: 'var(--font-display)', fontSize: 12,
                    color: '#ccc', cursor: 'pointer', letterSpacing: 1,
                    transition: 'background 0.15s',
                  }}
                >
                  🎉 응원하기
                </button>
              )}
              <Link
                href={`/matches/${match.id}`}
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, padding: '11px 0',
                  borderRadius: 14, border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.04)',
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  color: '#ccc', letterSpacing: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                💺 좌석 변경
              </Link>
              <Link
                href="/"
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, padding: '11px 0',
                  borderRadius: 14,
                  border: '1px solid rgba(255,45,45,0.25)',
                  background: 'rgba(255,45,45,0.08)',
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  color: '#ff9b9b', letterSpacing: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                ✕ 나가기
              </Link>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
