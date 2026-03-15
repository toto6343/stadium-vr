# 🏟️ STADIUM VR (MVP Phase 1)

**Stadium VR** is a real-time data-driven VR football viewing platform designed to bring the heat of the stadium to fans everywhere. Experience live matches through immersive 360° views with real-time data synchronization and interactive social features.

---

## 🚀 Key Features (MVP Phase 1)

### 1. Real-time Match Data Integration
- **Live Sync:** Leverages the **SofaScore API** to provide real-time scores, match time, lineups, and live incidents (goals, cards, substitutions).
- **League Filtering:** Browse matches across global leagues including K-League, Premier League, La Liga, and more.
- **Favorite Leagues:** Pin your favorite leagues (★) to keep them at the top of your dashboard for quick access.

### 2. Immersive VR Stadium Experience
- **360° Vision:** Integrated YouTube 360° streaming providing a "front-row seat" experience from anywhere in the world.
- **Dynamic Viewpoints:** Switch between multiple camera angles: Center Stand, Behind the Goal, and Dugout Side.
- **Live Scoreboard Overlay:** Real-time scores and match stats are overlaid directly onto the VR environment for seamless viewing.

### 3. Interactive Social Cheering
- **Real-time Cheering:** Send live cheers to your team with dynamic **Emoji Fireworks** visual effects.
- **Cheer Power Gauge:** A real-time visual gauge comparing the cheering intensity of both fanbases.
- **Live Fan Chat:** Engage with other fans in real-time using **Supabase Realtime**, creating a virtual "fan zone."

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Vanilla CSS (Animations)
- **Database:** Supabase (PostgreSQL)
- **Realtime Infrastructure:** Supabase Realtime (Chat & Cheer)
- **API:** SofaScore API (via RapidAPI)
- **Deployment:** Vercel

---

## ⚙️ Getting Started

### 1. Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
# RapidAPI SofaScore
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_RAPIDAPI_HOST=sofascore.p.rapidapi.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Configuration
Apply the `schema.sql` file in your Supabase SQL Editor. This will set up the necessary tables (`matches`, `teams`, `messages`, etc.) and enable Realtime replication.

### 3. Installation & Local Development
```bash
npm install
npm run dev
```

---

## 📂 Project Structure
- `/app`: Pages and Server Actions
- `/lib`: API clients, DB configurations, and Type definitions
- `/public`: Static assets and icons
- `schema.sql`: Database schema & initial seed data

---

## 📅 Future Roadmap
- [ ] User profiles and customizable team emblems
- [ ] AI-powered highlight replays for key goal scenes
- [ ] In-game live quizzes and fan reward systems
- [ ] WebXR optimization for dedicated VR headsets (Quest, etc.)
