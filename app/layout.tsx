import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StadiumVR — 경기장 밖에서 경기장 안으로',
  description: '집·전시관·VR 공간에서도 실제 경기장에 앉아 있는 느낌의 스포츠 관람 플랫폼 (MVP 1단계)',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080810',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,700&family=Barlow:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
