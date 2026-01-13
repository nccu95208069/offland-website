import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import Image from 'next/image';
import styles from './page.module.css';
import QuoteCTA from '@/components/QuoteCTA';

export const metadata: Metadata = {
    title: '關於 OFFLAND｜為 4–6 人而存在的宜蘭小包棟民宿',
    description: 'OFFLAND 是一間專為 4–6 人設計的宜蘭小包棟民宿。不用湊滿十人，也不需要和陌生人共用空間。我們位於宜蘭五結，卻遠離觀光區的吵雜。',
    keywords: ['宜蘭靜謐民宿', '宜蘭獨棟民宿', '宜蘭小包棟推薦', '宜蘭不用湊人數包棟'],
};

export default function AboutPage() {
    return (
        <main>
            <Hero
                title="關於 OFFLAND｜為 4–6 人而存在的小包棟民宿"
                subtitle="在 OFFLAND，你不只是住宿"
                imageSrc="/images/outdoor/others/drone_view.jpg"
                imageAlt="OFFLAND 夜景"
                height="medium"
            />

            <section className={`${styles.whyChoose} section-lg`}>
                <div className="container">
                    <h2 className="text-center mb-lg">為什麼選擇 OFFLAND</h2>

                    <div className="grid grid-3">
                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h3>4-6人小包棟</h3>
                            <p>
                                OFFLAND 是一間專為 4–6 人設計的宜蘭小包棟民宿。<br />
                                不用湊滿十人，也不需要和陌生人共用空間。
                            </p>
                        </div>

                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <h3>晚退房的價值</h3>
                            <p>
                                17:00 入住，13:00 退房。給你充足的時間真正休息，享受沒有鬧鐘的早晨，慢慢收拾再出發。
                            </p>
                        </div>

                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </div>
                            <h3>獨棟平房</h3>
                            <p>
                                獨棟平房，不需爬樓梯，擁有獨立入口。環境清幽，附近鮮少鄰居，享受世外桃源的感覺。
                            </p>
                        </div>

                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            </div>
                            <h3>侘寂 × 現代設計</h3>
                            <p>
                                屋內以「侘寂 × 現代」風格設計，質感木質地板與中島廚房營造出溫潤又俐落的空間。
                            </p>
                        </div>

                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 21.5c-2.8 0-5-1.8-5-4s2.2-4 5-4 5 1.8 5 4-2.2 4-5 4zm-5.5-5c-1.9 0-3.5-1.3-3.5-3s1.6-3 3.5-3 3.5 1.3 3.5 3-1.6 3-3.5 3zm5-5c-1.9 0-3.5-1.3-3.5-3s1.6-3 3.5-3 3.5 1.3 3.5 3-1.6 3-3.5 3zm5 5c-1.9 0-3.5-1.3-3.5-3s1.6-3 3.5-3 3.5 1.3 3.5 3-1.6 3-3.5 3zm0.5-8c-1.9 0-3.5-1.3-3.5-3s1.6-3 3.5-3 3.5 1.3 3.5 3-1.6 3-3.5 3z" />
                                </svg>
                            </div>
                            <h3>寵物友善</h3>
                            <p>
                                OFFLAND 是寵物友善民宿，歡迎帶著毛小孩一起入住，享受在草皮上奔跑的快樂時光。
                                <br />
                                <a
                                    href="https://drive.google.com/file/d/1nJQaGFRuXRX40TNPugHnmb_lQUUimzSN/view"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '0.5rem',
                                        color: 'var(--color-primary)',
                                        textDecoration: 'underline',
                                        fontSize: '0.9em'
                                    }}
                                >
                                    查看完整寵物入住守則 →
                                </a>
                            </p>
                        </div>

                        <div className={styles.reason}>
                            <div className={styles.iconWrapper}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <h3>完整戶外空間</h3>
                            <p>
                                戶外有前庭、後院、草皮、營火區與平台區，讓你在星空下享受靜謐時光。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video Story Section - Full Width */}
            <section className={styles.videoBackgroundSection}>
                <div className={styles.videoWrapper}>
                    <Image
                        src="/images/rooms/b1-2.png"
                        alt="OFFLAND Story Background"
                        fill
                        className={styles.video}
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                    <div className={styles.videoOverlay}></div>
                </div>

                <div className={styles.storyTextOverlay}>
                    <h2>有些地方，不是讓你「來住一晚」</h2>
                    <h3>而是讓你慢慢，把自己找回來</h3>

                    <div className={styles.storyContentOverlay}>
                        <p>
                            OFFLAND 遺忘無際<br />
                            靜靜坐落在宜蘭五結的田野邊緣。<br />
                            風替稻浪低聲說話，<br />
                            夜晚安靜到，<br />
                            連時間都願意慢下來。
                        </p>

                        <p>
                            一棟只為 4–6 人 而存在的空間。<br />
                            沒有多餘的人，<br />
                            只有被留下來的陪伴。
                        </p>

                        <p>
                            在這裡，<br />
                            睡意不被鬧鐘打斷，<br />
                            咖啡不需要趕時間。<br />
                            門一推開，<br />
                            世界暫時停在身後。
                        </p>

                        <p>
                            OFFLAND 不迎合熱鬧。<br />
                            它靜靜等著你來。<br />
                            等你把聲音放低，<br />
                            把心，交還給自己。
                        </p>
                    </div>
                </div>
            </section>
            <QuoteCTA />
        </main>
    );
}
