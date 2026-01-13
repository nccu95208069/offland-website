import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import Image from 'next/image';
import styles from './page.module.css';
import QuoteCTA from '@/components/QuoteCTA';

export const metadata: Metadata = {
    title: '入住體驗｜冬山河畔的靜謐包棟時光｜OFFLAND',
    description: 'OFFLAND 位於冬山河支流旁，是少見的河畔包棟民宿。門口就是河濱步道，適合散步、慢跑與放空。這裡不是行程很多的住宿，而是讓時間慢下來的地方。',
    keywords: ['冬山河附近民宿', '宜蘭河畔民宿', '宜蘭慢活住宿', '宜蘭靜謐住宿'],
};

export default function ExperiencePage() {
    return (
        <main>
            <Hero
                title="入住體驗｜冬山河畔的靜謐包棟時光"
                subtitle="這裡不是行程很多的住宿，而是讓時間慢下來的地方"
                imageSrc="/images/living-room/living_room3.jpg"
                imageAlt="河濱步道"
                height="medium"
            />

            {/* Facilities */}
            <section className="section">
                <div className="container">
                    <h2 className="text-center mb-lg">設施與服務</h2>

                    <div className={styles.facilitiesGrid}>
                        <div className={styles.facilityCard}>
                            <div className={styles.facilityImage}>
                                <Image src="/images/others/netflix.png" alt="Netflix" fill className="img-cover" />
                            </div>
                            <h3>娛樂設施</h3>
                            <ul>
                                <li>免費 Netflix 串流影音</li>
                                <li>Nintendo Switch 遊戲機</li>
                                <li>有線電視 / 第四台</li>
                                <li>免費高速網路</li>
                            </ul>
                        </div>

                        <div className={styles.facilityCard}>
                            <div className={styles.facilityImage}>
                                <Image src="/images/others/shampoo.jpg" alt="茶籽堂" fill className="img-cover" />
                            </div>
                            <h3>盥洗用品</h3>
                            <ul>
                                <li>茶籽堂洗沐組（洗髮露、沐浴露、護髮露）</li>
                                <li>Dyson 吹風機</li>
                                <li>毛巾、浴巾</li>
                            </ul>
                        </div>

                        <div className={styles.facilityCard}>
                            <div className={styles.facilityImage}>
                                <Image src="/images/living-room/kit2.png" alt="廚房設備" fill className="img-cover" />
                            </div>
                            <h3>廚房設備</h3>
                            <ul>
                                <li>IH 電磁爐</li>
                                <li>HITACHI 日立 300L 冰箱</li>
                                <li>Philip 快煮壺</li>
                                <li>Panasonic 微波爐</li>
                                <li>完整鍋具、碗盤與餐具</li>
                            </ul>
                        </div>

                        <div className={styles.facilityCard}>
                            <div className={styles.facilityImage}>
                                <Image src="/images/outdoor/bath_tub_platform/platform_3.jpg" alt="戶外浴缸" fill className="img-cover" />
                            </div>
                            <h3>戶外設施</h3>
                            <ul>
                                <li>戶外按摩浴缸（5-9月）</li>
                                <li>營火區（需自備柴火）</li>
                                <li>戶外平台藤椅沙發</li>
                                <li>草皮區約 40 坪</li>
                                <li>免費停車 3-4 台車</li>
                            </ul>
                        </div>

                        <div className={styles.facilityCard}>
                            <div className={styles.facilityImage}>
                                <Image src="/images/others/molly_friendly.jpg" alt="寵物友善" fill className="img-cover" />
                            </div>
                            <h3>寵物友善</h3>
                            <ul>
                                <li>歡迎攜帶毛小孩入住</li>
                                <li>戶外大草皮跑跳空間</li>
                                <li>每隻毛孩酌收 $500 清潔費</li>
                            </ul>
                            <a
                                href="https://drive.google.com/file/d/1nJQaGFRuXRX40TNPugHnmb_lQUUimzSN/view"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    margin: '0 var(--spacing-md) var(--spacing-md)',
                                    color: 'var(--color-primary)',
                                    textDecoration: 'underline',
                                    fontSize: '0.9em'
                                }}
                            >
                                查看完整寵物入住守則 →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nearby Attractions */}
            <section className={`${styles.attractions} section-lg`}>
                <div className="container">
                    <h2 className="text-center mb-lg">周邊景點</h2>

                    <div className="grid grid-2">
                        <div className={styles.attractionCard}>
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconInline}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" /></svg>
                                宜蘭傳統藝術中心
                            </h3>
                            <p className={styles.distance}>車程 8 分鐘</p>
                            <p>體驗台灣傳統工藝與表演藝術，適合全家大小一起參觀。</p>
                        </div>

                        <div className={styles.attractionCard}>
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconInline}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                冬山河親水公園
                            </h3>
                            <p className={styles.distance}>車程 8 分鐘</p>
                            <p>宜蘭著名景點，可划船、騎自行車，享受河畔風光。</p>
                        </div>

                        <div className={styles.attractionCard}>
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconInline}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>
                                羅東夜市
                            </h3>
                            <p className={styles.distance}>車程 15 分鐘</p>
                            <p>宜蘭最熱鬧的夜市，品嚐在地美食與小吃。</p>
                        </div>

                        <div className={styles.attractionCard}>
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.iconInline}><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg>
                                蘭陽溪出海口
                            </h3>
                            <p className={styles.distance}>步行可達</p>
                            <p>沿著門口河濱步道即可抵達，適合散步、慢跑與觀景。</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommended Shops */}
            <section className={`${styles.shops} section`}>
                <div className="container">
                    <h2 className="text-center mb-lg">推薦商家</h2>

                    <div className={styles.shopCategory}>
                        <h3>☕️ 咖啡店</h3>
                        <div className="grid grid-2">
                            <div className={styles.shopCard}>
                                <h4>BLOCK COFFEE</h4>
                                <p className={styles.rating}>⭐️ 4.8 分</p>
                                <p>位於五結鄉的人氣設計感咖啡廳，以工業風結合街頭藝術塗鴉風格著名，寵物友善咖啡廳。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>黑RURU CAFE</h4>
                                <p className={styles.rating}>⭐️ 4.2 分</p>
                                <p>五結極具代表性的景觀咖啡廳，主打「笑笑羊」互動體驗與歐風建築外觀，適合親子客群。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>品品99 咖啡・輕食</h4>
                                <p className={styles.rating}>⭐️ 4.5 分</p>
                                <p>在地人常去的咖啡輕食小店，空間簡單溫馨，適合安靜喝咖啡、吃甜點或簡餐。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>好森大吉</h4>
                                <p className={styles.rating}>⭐️ 4.5 分</p>
                                <p>隱身在五結住宅區內的文青咖啡廳，整體氛圍安靜、舒適，適合慢慢坐下來聊天或獨自放空。</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.shopCategory}>
                        <h3>🍽 餐廳</h3>
                        <div className="grid grid-2">
                            <div className={styles.shopCard}>
                                <h4>Lailai Steakhouse</h4>
                                <p className={styles.rating}>⭐️ 4.6 分 · 19,744 則評價</p>
                                <p>五結在地超人氣牛排館，餐點份量充足、品質穩定，是聚餐與正式用餐的熱門選擇。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>酒飲飯了</h4>
                                <p className={styles.rating}>⭐️ 4.9 分 · 1,302 則評價</p>
                                <p>五結評價極高的餐廳，以現代風格排餐／主餐為主，適合作為晚餐或節慶聚餐。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>百匯窯烤雞餐廳</h4>
                                <p className={styles.rating}>⭐️ 4.4 分 · 4,957 則評價</p>
                                <p>五結在地名店，以口味濃郁的窯烤雞、熱炒與傳統台式料理響亮名聲，適合多人家庭及聚會。</p>
                            </div>

                            <div className={styles.shopCard}>
                                <h4>饗點鍋（五結創始店）</h4>
                                <p className={styles.rating}>⭐️ 4.6 分 · 1,868 則評價</p>
                                <p>五結火鍋吃到飽名店，菜色多樣、湯底豐富，自助吧種類眾多，適合好友／家庭聚餐。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <QuoteCTA />
        </main>
    );
}
