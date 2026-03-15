# 🏟️ STADIUM VR (MVP 1단계)

**Stadium VR**은 경기장 밖에서도 경기장 안의 열기를 그대로 느낄 수 있도록 설계된 **실시간 데이터 기반 VR 축구 관람 플랫폼**입니다. 전 세계 실시간 경기 데이터를 바탕으로 가상 경기장에 입장하여 360° 시점으로 경기를 즐기고, 다른 팬들과 실시간으로 소통할 수 있습니다.

---

## 🚀 주요 기능 (MVP Phase 1)

### 1. 실시간 경기 데이터 연동 (Real-time Data)
- **SofaScore API**를 활용하여 전 세계 모든 축구 경기의 스코어, 시간, 라인업, 경기 이벤트(골, 카드, 교체)를 실시간으로 가져옵니다.
- **리그 필터링:** K-리그, EPL, 라리가 등 원하는 리그를 선택하여 볼 수 있습니다.
- **관심 리그 고정:** 자주 보는 리그를 즐겨찾기(★)하면 상단에 우선적으로 노출됩니다.

### 2. 가상 경기장 관람 (VR Experience)
- **360° View:** YouTube 360° 영상을 활용하여 실제 경기장에 있는 듯한 몰입감을 제공합니다.
- **다양한 시점 선택:** 중앙 관중석, 골대 뒤, 벤치 근처 등 원하는 위치에서 관람이 가능합니다.
- **실시간 스코어 오버레이:** 영상 위에 현재 스코어와 경기 시간이 실시간으로 표시됩니다.

### 3. 소셜 인터랙션 (Social Features)
- **실시간 응원하기:** 응원 버튼을 누르면 DB에 카운트가 기록되며, 화면에 화려한 **이모지 폭죽** 효과가 나타납니다.
- **응원 게이지:** 양 팀 팬들의 응원 화력을 실시간 게이지로 비교하여 보여줍니다.
- **실시간 응원 톡:** Supabase Realtime을 통해 같은 경기를 보는 사람들과 끊김 없이 대화를 나눌 수 있습니다.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Vanilla CSS (Animations)
- **Database:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime (Chat & Cheer)
- **API:** SofaScore API (via RapidAPI)
- **Deployment:** Vercel

---

## ⚙️ 시작하기 (Setup)

### 1. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 아래 정보를 입력합니다.

```env
# RapidAPI SofaScore
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_RAPIDAPI_HOST=sofascore.p.rapidapi.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 데이터베이스 설정
`schema.sql` 파일을 복사하여 Supabase SQL Editor에서 실행합니다. 이 작업은 필요한 테이블(`matches`, `teams`, `messages` 등)과 실시간 기능을 활성화합니다.

### 3. 설치 및 실행
```bash
npm install
npm run dev
```

---

## 📂 프로젝트 구조
- `/app`: 페이지 및 API 라우트
- `/lib`: API 클라이언트, DB 설정 및 타입 정의
- `/public`: 정적 자산 및 아이콘
- `schema.sql`: 데이터베이스 설계도

---

## 📅 향후 계획 (Roadmap)
- [ ] 사용자 프로필 및 응원 팀 엠블럼 설정
- [ ] 주요 득점 장면 리플레이(하이라이트) 연동
- [ ] 경기 중 돌발 퀴즈 및 보상 시스템
- [ ] VR 기기(Quest 등) 전용 WebXR 최적화
