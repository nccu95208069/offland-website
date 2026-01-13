import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import FeaturesCarousel from '@/components/FeaturesCarousel';
import SpaceCarousel from '@/components/SpaceCarousel';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '宜蘭 4–6 人小包棟民宿｜五結晚退房首選｜OFFLAND 遺忘無際',
  description: 'OFFLAND 遺忘無際是一間位於宜蘭五結的 4–6 人小包棟民宿，不用湊人數即可包棟，提供 13:00 晚退房，鄰近冬山河，適合想安靜放鬆的旅人。',
  keywords: ['宜蘭包棟民宿', '宜蘭小包棟', '宜蘭4-6人包棟', '宜蘭晚退房民宿', '五結民宿'],
  openGraph: {
    title: '宜蘭 4–6 人小包棟民宿｜五結晚退房首選｜OFFLAND 遺忘無際',
    description: 'OFFLAND 遺忘無際是一間位於宜蘭五結的 4–6 人小包棟民宿，不用湊人數即可包棟，提供 13:00 晚退房，鄰近冬山河，適合想安靜放鬆的旅人。',
    type: 'website',
  },
};

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <Hero
        title={<>宜蘭 4–6 人小包棟民宿<br />晚退房首選</>}
        subtitle="有些地方，不是讓你「來住一晚」，而是讓你慢慢，把自己找回來。"
        videoSrc="/videos/firevideo.mov"
        imageSrc="/images/outdoor/fire_pits/firepit_6.png"
        imageAlt="OFFLAND 遺忘無際營火區"
        ctaText="查看空房與價格"
        ctaHref="https://www.booking-owlnest.com/offland?lang=zh_TW&adult=1&child=0&infant=0"
        height="full"
      />

      {/* Core Features - Alternating Layout */}
      <section className={`${styles.features} section-lg`}>
        <div className="container">
          <FeaturesCarousel
            features={[
              {
                label: 'STAY',
                title: '4-6人小包棟',
                description: 'OFFLAND 是一間專為 4–6 人設計的宜蘭小包棟民宿。不用湊滿十人，也不需要和陌生人共用空間。獨棟平房，不需爬樓梯，享受完整的私密空間。只留下真正想一起旅行的人——朋友、家人、伴侶，在同一個屋簷下，重新感受「在一起，卻不擁擠」的自在。',
                imageSrc: '/images/living-room/living_room.png',
                imageAlt: '4-6人小包棟空間',
                reverse: false
              },
              {
                label: 'SLEEP',
                title: '睡飽飽專案',
                description: '我們把時間留得很寬。17:00 入住、13:00 退房，不是為了效率，而是為了讓你真的睡飽。在沒有鬧鐘的早晨醒來，慢慢煮一壺咖啡、收行李、再出門。旅行，不該被催促，OFFLAND 讓你充分休息後再出發。',
                imageSrc: '/images/rooms/b1-1.jpg',
                imageAlt: '舒適的睡眠空間',
                reverse: true,
                extraContent: (
                  <div className={styles.checkInOutInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>入住時間</span>
                      <span className={styles.infoTime}>17:00</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>退房時間</span>
                      <span className={styles.infoTime}>13:00</span>
                    </div>
                  </div>
                )
              },
              {
                label: 'VIEW',
                title: '面向無際田野',
                description: 'OFFLAND 靜靜坐落在宜蘭五結的田野邊緣。沒有高樓、沒有喧嘩，只有風掠過稻田的聲音，以及夜晚安靜到，連說話都會不自覺放輕的空氣。獨棟平房、沒有樓梯，一推門，就是一整片無際的田。門口就是河濱步道，適合散步、慢跑與放空。',
                imageSrc: '/images/outdoor/field_1.png',
                imageAlt: '面向無際田野',
                reverse: false
              }
            ]}
          />
        </div>
      </section>

      {/* Space Preview */}
      <section className={`${styles.spacePreview} section-lg`}>
        <SpaceCarousel
          spaces={[
            {
              label: 'LIVE & COOK',
              title: '客廳 / 廚房',
              description: '溫潤木質地板與中島廚房，配備 IH 爐與簡約廚具，適合自己下廚品味慢生活。',
              imageSrc: '/images/living-room/living_room2.png',
              imageAlt: '客廳空間',
              ctaText: 'Check the space',
              ctaHref: '/spaces#living-kitchen',
              scrollTarget: 'living-kitchen'
            },
            {
              label: 'ROOMS',
              title: '睡眠空間',
              description: '雙人房 + 四人房，兩間臥室簡約舒適，剛剛好的距離與陪伴。',
              imageSrc: '/images/rooms/b2-1.png',
              imageAlt: '睡眠空間',
              ctaText: 'See the beds',
              ctaHref: '/spaces#quad-room',
              scrollTarget: 'quad-room'
            },
            {
              label: 'OUTDOOR PLATFORM',
              title: '戶外平台區',
              description: '面對超大片田地，提供質感藤椅沙發與搖椅，附設戶外按摩浴缸（5-9月開放）。',
              imageSrc: '/images/outdoor/bath_tub_platform/platform_1.jpg',
              imageAlt: '戶外平台',
              ctaText: 'Enjoy the Vibe',
              ctaHref: '/spaces#outdoor-platform',
              scrollTarget: 'outdoor-platform'
            },
            {
              label: 'FIRE PITS',
              title: '營火區',
              description: '位在草皮區周圍，可自備柴火來場營火小聚，在星空下享受靜謐時光。',
              imageSrc: '/images/outdoor/fire_pits/firepit_1.png',
              imageAlt: '營火區',
              ctaText: 'Sit with Fire',
              ctaHref: '/spaces#fire-pits',
              scrollTarget: 'fire-pits'
            }
          ]}
        />
      </section>

      {/* Location */}
      <section className={`${styles.location} section`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>河畔旁的靜謐時光</h2>
            <p className="text-secondary">
              OFFLAND 位於河畔旁，門口就是河濱步道，適合散步、慢跑與放空。
            </p>
          </div>

          <div className={styles.locationGrid}>
            <div className={styles.locationInfo}>
              <h3>鄰近景點</h3>
              <ul className={styles.locationList}>
                <li>
                  <strong>宜蘭傳統藝術中心</strong>
                  <span>車程 8 分鐘</span>
                </li>
                <li>
                  <strong>冬山河親水公園</strong>
                  <span>車程 8 分鐘</span>
                </li>
                <li>
                  <strong>五結市區</strong>
                  <span>車程 4 分鐘</span>
                </li>
                <li>
                  <strong>羅東夜市</strong>
                  <span>車程 15 分鐘</span>
                </li>
                <li>
                  <strong>國道五號羅東交流道</strong>
                  <span>車程 6 分鐘</span>
                </li>
              </ul>
            </div>

            <div className={styles.mapWrapper}>
              <iframe
                src="https://maps.google.com/maps?q=OFFLAND%20%E9%81%BA%E5%BF%98%E7%84%A1%E9%9A%9B&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="OFFLAND 地圖位置"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${styles.finalCta} section-lg`}>
        <div className={styles.videoBackground}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className={styles.ctaVideo}
          >
            <source src="/videos/window_view.mov" type="video/quicktime" />
            <source src="/videos/window_view.mov" type="video/mp4" />
          </video>
          <div className={styles.videoOverlay}></div>
        </div>
        <div className="container text-center">
          <p className={styles.ctaSubtitle}>
            在 OFFLAND，你不需要安排太多行程，<br />
            因為真正的目的地，是那個放鬆下來的自己。
          </p>
          <a
            href="https://www.booking-owlnest.com/offland?lang=zh_TW&adult=1&child=0&infant=0"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-lg"
          >
            立即預訂 OFFLAND
          </a>
        </div>
      </section>
    </main>
  );
}
