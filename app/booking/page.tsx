import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: '預訂資訊與常見問題｜OFFLAND 宜蘭小包棟民宿',
    description: '查看 OFFLAND 的價格、入住政策、寵物規定與常見問題。立即預訂宜蘭 4-6 人小包棟民宿。',
    keywords: ['宜蘭包棟價格', '宜蘭晚退房民宿', '宜蘭寵物友善包棟', '宜蘭包棟民宿 FAQ'],
};

import QuoteCTA from '@/components/QuoteCTA';

// ... (Metadata stays same)

export default function BookingPage() {
    return (
        <main>
            {/* ... (Hero stays same) ... */}
            <Hero
                title="常見問題"
                subtitle="這裡整理了關於入住的常見疑惑，希望能為你的旅程解答。"
                imageSrc="/images/outdoor/fire_pits/firepit_1.png"
                imageAlt="常見問題"
                height="medium"
            />



            {/* FAQ */}
            <section className={`${styles.faq} section-lg`}>
                <div className="container">
                    <h2 className="text-center mb-lg">常見問題</h2>

                    <div className={styles.faqList}>
                        <div className={styles.faqItem}>
                            <h3>宜蘭有 4–6 人的小包棟民宿嗎？</h3>
                            <p>
                                有的！OFFLAND 遺忘無際就是一間專為 4–6 人設計的宜蘭小包棟民宿。
                                不用湊滿十人，也不需要和陌生人共用空間，只留下真正想一起旅行的人。
                                我們提供一間四人房和一間雙人房，適合家庭、朋友或小團體入住。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>不用湊人數也可以包棟嗎？</h3>
                            <p>
                                當然可以！OFFLAND 主打「小包棟」概念，不分平假日都接待 4-6 人即可入住。
                                您不需要湊滿大團，就能享受完整的獨棟空間，包含室內客廳、廚房、兩間房間，以及戶外平台、營火區等設施。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>OFFLAND 是晚退房民宿嗎？</h3>
                            <p>
                                是的！我們提供「睡飽飽專案」，入住時間為 17:00，退房時間為 13:00。
                                這樣的時間安排是為了讓您真正休息，在沒有鬧鐘的早晨醒來，慢慢煮一壺咖啡、收行李、再出門。
                                旅行，不該被催促。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>可以帶寵物入住嗎？</h3>
                            <p>
                                可以的！OFFLAND 是寵物友善民宿，歡迎您帶毛孩一起來。
                                每隻毛孩需酌收 $500 清潔消毒費。請務必仔細閱讀並遵守我們的
                                <a href="https://drive.google.com/file/d/1nJQaGFRuXRX40TNPugHnmb_lQUUimzSN/view" target="_blank" rel="noopener noreferrer">
                                    寵物入住守則
                                </a>
                                ，讓大家都能有愉快的入住體驗。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>民宿提供哪些設施？</h3>
                            <p>
                                室內提供完整廚房設備（IH 爐、冰箱、微波爐、鍋具餐具）、Netflix、Switch 遊戲機、
                                Dyson 吹風機、茶籽堂洗沐用品等。戶外有平台區（附按摩浴缸，5-9月開放）、營火區、
                                草皮區。園區內可免費停車 3-4 台車。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>可以自己煮飯嗎？</h3>
                            <p>
                                當然可以！我們提供完整的廚房設備，包含 IH 電磁爐、冰箱、微波爐、快煮壺，
                                以及完整的鍋具、碗盤與餐具。您可以到附近市場或超市採買食材，
                                在民宿享受自己下廚的樂趣，品味慢生活。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>OFFLAND 在哪裡？</h3>
                            <p>
                                OFFLAND 位於宜蘭縣五結鄉孝威三路217巷20弄12號。<br />
                                請直接在 Google Map 搜尋「OFFLAND 遺忘無際」即可正確導航。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>開車前往會不會不好找？</h3>
                            <p>
                                入口位於「宜蘭五結天后宮旁」的小路，路寬約 3.5 公尺。<br />
                                駛入約 100 公尺後，右手邊第一棟黑白相間平房即為 OFFLAND。<br />
                                夜間行車請放慢速度並注意安全。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>是否有停車位？</h3>
                            <p>
                                有的，約可停放3-4輛車。請將車輛停放於房屋前方的碎石停車區，請勿停在車道入口外的步道或草皮上。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>OFFLAND 距離景點近嗎？</h3>
                            <p>
                                OFFLAND 距離冬山河親水公園車程約 8 分鐘，宜蘭傳統藝術中心也只要 8 分鐘車程。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>是否為自助入住？</h3>
                            <p>
                                是的，OFFLAND 採無接觸全自助入住。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>抵達後如何取得鑰匙？</h3>
                            <p>
                                訂房後請加入 <a href="https://line.me/R/ti/p/@408tvjpk" target="_blank" rel="noopener noreferrer">OFFLAND LINE 官方帳號</a>，告知預定日期與大名，我們會提供您入住指南。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>是否提供牙刷、牙膏等備品？</h3>
                            <p>
                                為響應環保政策，OFFLAND 不提供一次性備品，請自行準備。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>續住期間會清掃房間嗎？</h3>
                            <p>
                                續住期間不提供清掃、換床單與毛巾服務。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>戶外平台燈如何開啟？</h3>
                            <p>
                                燈的開關位於竹籬左下角，輕輕挪動竹籬即可看到。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>民宿是否可以抽菸或邀請訪客？</h3>
                            <p>
                                OFFLAND 全館（含戶外平台）全面禁菸，其他室外區域則不在此限。<br />
                                違者將收取清潔費 NT$8,000。<br />
                                入住期間謝絕外部訪客，擅自增加人數將收取清潔費 NT$1,500／人。
                            </p>
                        </div>

                        <div className={styles.faqItem}>
                            <h3>若需要協助，如何聯絡？</h3>
                            <p>
                                LINE 官方帳號：@408tvjpk（10:00–21:00）。<br />
                                緊急聯絡電話：0987-611-850。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className={`${styles.finalCta} section`}>
                <div className="container text-center">
                    <h2>還有其他問題嗎？</h2>
                    <p className="text-secondary mb-md">
                        歡迎透過 Email 或 LINE 與我們聯繫
                    </p>
                    <div className={styles.contactButtons}>
                        <a
                            href="mailto:offland.ilan@gmail.com"
                            className="btn btn-secondary btn-lg"
                        >
                            Email 聯絡
                        </a>
                        <a
                            href="https://line.me/R/ti/p/@408tvjpk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-lg"
                        >
                            LINE 聯絡
                        </a>
                    </div>
                </div>
            </section>

        </main>
    );
}
