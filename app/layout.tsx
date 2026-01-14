import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.offland-yilan.com'),
  title: {
    default: 'OFFLAND 遺忘無際｜宜蘭 4-6 人小包棟民宿',
    template: '%s | OFFLAND 遺忘無際',
  },
  description: 'OFFLAND 遺忘無際是一間位於宜蘭五結的 4–6 人小包棟民宿，不用湊人數即可包棟，提供 13:00 晚退房，鄰近冬山河，適合想安靜放鬆的旅人。',
  keywords: ['宜蘭包棟民宿', '宜蘭小包棟', '五結民宿', '宜蘭晚退房民宿', '宜蘭4-6人包棟', '冬山河民宿'],
  authors: [{ name: 'OFFLAND' }],
  creator: 'OFFLAND',
  publisher: 'OFFLAND',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://www.offland-yilan.com',
    siteName: 'OFFLAND 遺忘無際',
    title: 'OFFLAND 遺忘無際｜宜蘭 4-6 人小包棟民宿',
    description: 'OFFLAND 遺忘無際是一間位於宜蘭五結的 4–6 人小包棟民宿，不用湊人數即可包棟，提供 13:00 晚退房，鄰近冬山河，適合想安靜放鬆的旅人。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OFFLAND 遺忘無際｜宜蘭 4-6 人小包棟民宿',
    description: 'OFFLAND 遺忘無際是一間位於宜蘭五結的 4–6 人小包棟民宿，不用湊人數即可包棟，提供 13:00 晚退房，鄰近冬山河，適合想安靜放鬆的旅人。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Will be updated later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
