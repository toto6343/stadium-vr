-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM 타입 정의 (상태 및 이벤트 종류)
-- ─────────────────────────────────────────────────────────────────────────────
-- 이미 존재하는 경우를 대비해 처리 (Supabase 등에서는 관리 콘솔에서 직접 생성하기도 함)
-- DO $$ BEGIN
--     CREATE TYPE match_status AS ENUM ('LIVE', 'END', 'UPCOMING');
--     CREATE TYPE event_type AS ENUM ('goal', 'yellow', 'red', 'sub', 'var');
--     CREATE TYPE team_side AS ENUM ('home', 'away');
-- EXCEPTION
--     WHEN duplicate_object THEN null;
-- END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 테이블 생성
-- ─────────────────────────────────────────────────────────────────────────────

-- 팀 정보 테이블
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    short_name VARCHAR(10) NOT NULL,
    color VARCHAR(10) NOT NULL, -- Hex code
    logo VARCHAR(255),          -- 로고 이미지 URL 또는 이모지
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경기 정보 테이블
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_formation VARCHAR(20),
    away_formation VARCHAR(20),
    league_name VARCHAR(50) NOT NULL,
    stadium_name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    attendance INTEGER DEFAULT 0,
    match_time VARCHAR(20),     -- '73:24' 등의 형식
    half INTEGER DEFAULT 0,      -- 0: 시작전, 1: 전반, 2: 후반
    status VARCHAR(20) DEFAULT 'UPCOMING', -- ENUM 대신 호환성을 위해 VARCHAR 사용 가능
    home_cheers INTEGER DEFAULT 0,
    away_cheers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 경기 이벤트 테이블 (골, 카드 등)
CREATE TABLE IF NOT EXISTS match_events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    event_time VARCHAR(10),
    type VARCHAR(20) NOT NULL,
    team_side VARCHAR(10) NOT NULL,
    player_name VARCHAR(50),
    icon VARCHAR(10),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VR 시점 정보 테이블
CREATE TABLE IF NOT EXISTS viewpoints (
    id VARCHAR(50) PRIMARY KEY, -- 'center', 'goal', 'bench' 등
    label VARCHAR(50) NOT NULL,
    label_en VARCHAR(50),
    icon VARCHAR(10),
    description TEXT,
    fov VARCHAR(20),
    tip TEXT,
    video_id VARCHAR(50),
    map_x INTEGER, -- 0-100
    map_y INTEGER,
    best_for TEXT[] -- 태그 배열 (Postgres 전용)
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    team_side VARCHAR(10), -- 'home' or 'away' (어느 팀 팬인지 표시용)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 초기 데이터 삽입 (Mock Data 기반)
-- ─────────────────────────────────────────────────────────────────────────────

-- 팀 데이터
INSERT INTO teams (name, short_name, color, logo) VALUES
('서울 FC', 'SEO', '#E63946', '🔴'),
('부산 유나이티드', 'BSN', '#457B9D', '🔵'),
('전북 현대', 'JBK', '#F4A261', '🟡'),
('울산 HD', 'USN', '#2A9D8F', '🟢'),
('수원 삼성', 'SWN', '#1565C0', '🔷'),
('인천 유나이티드', 'ICN', '#E9C46A', '🟩'),
('대구 FC', 'DGU', '#7B2FBE', '🟣'),
('강원 FC', 'GWN', '#00BBF9', '🩵')
ON CONFLICT DO NOTHING;

-- 경기 데이터 (서울 vs 부산)
INSERT INTO matches (home_team_id, away_team_id, home_score, away_score, home_formation, away_formation, league_name, stadium_name, capacity, attendance, match_time, half, status)
VALUES (1, 2, 2, 1, '4-3-3', '4-2-3-1', 'K리그 1', '서울 월드컵 경기장', 66704, 52000, '73:24', 2, 'LIVE')
ON CONFLICT DO NOTHING;

-- 이벤트 데이터 (ID 1번 경기에 대해)
INSERT INTO match_events (match_id, event_time, type, team_side, player_name, icon, description) VALUES
(1, '08''', 'goal', 'home', '김민준', '⚽', '헤더골'),
(1, '31''', 'yellow', 'away', '박도현', '🟨', '반칙'),
(1, '55''', 'goal', 'home', '이강인', '⚽', '프리킥')
ON CONFLICT DO NOTHING;

-- 시점 데이터
INSERT INTO viewpoints (id, label, label_en, icon, description, fov, tip, video_id, map_x, map_y, best_for) VALUES
('center', '중앙 관중석', 'CENTER STAND', '🏟️', '전체 경기 흐름을 한눈에 파악할 수 있는 최적의 시점입니다.', '180°', '전술·패턴 분석에 최고', 'LXb3EKWsInQ', 50, 15, ARRAY['전술 분석', '패스 흐름', '포메이션']),
('goal', '골대 뒤', 'BEHIND THE GOAL', '🥅', '슛과 골 장면을 가장 생생하게 체험할 수 있는 시점입니다.', '360°', '득점 순간 최고의 몰입감', 'LXb3EKWsInQ', 5, 50, ARRAY['슛 장면', '코너킥', '골 세리머니']),
('bench', '벤치 근처', 'DUGOUT SIDE', '🪑', '선수·감독의 표정과 전술 지시까지 생생하게 볼 수 있습니다.', '120°', '감독 전술 지시 관찰 가능', 'LXb3EKWsInQ', 50, 88, ARRAY['교체 장면', '감독 리액션', '선수 대화'])
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    label_en = EXCLUDED.label_en,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    fov = EXCLUDED.fov,
    tip = EXCLUDED.tip,
    video_id = EXCLUDED.video_id,
    map_x = EXCLUDED.map_x,
    map_y = EXCLUDED.map_y,
    best_for = EXCLUDED.best_for;
