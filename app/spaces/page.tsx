import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ImageGallery from '@/components/ImageGallery';
import styles from './page.module.css';
import QuoteCTA from '@/components/QuoteCTA';

export const metadata: Metadata = {
    title: '空間與房型｜宜蘭 4–6 人獨棟小包棟｜OFFLAND',
    description: '適合 4–6 人入住的宜蘭小包棟，獨棟平房不需爬樓梯。包含四人房、雙人房、客廳、中島廚房、戶外平台與營火區。',
    keywords: ['宜蘭4人包棟', '宜蘭6人包棟', '宜蘭小包棟', '宜蘭獨棟平房民宿'],
};

const livingRoomImages = [
    { src: '/images/living-room/living_room.png', alt: '客廳空間' },
    { src: '/images/living-room/living_room2.png', alt: '客廳沙發區' },
    { src: '/images/living-room/living_room3.jpg', alt: '客廳全景' },
    { src: '/images/living-room/dinning_table.png', alt: '餐桌區' },
    { src: '/images/living-room/dinning_table2.jpg', alt: '中島廚房' },
    { src: '/images/living-room/kit2.png', alt: '廚房設備' },
    { src: '/images/living-room/kit3.png', alt: '廚房空間' },
];

const quadRoomImages = [
    { src: '/images/rooms/b1-1.jpg', alt: '四人房' },
    { src: '/images/rooms/b1-2.png', alt: '四人房床鋪' },
    { src: '/images/rooms/b1-3.png', alt: '四人房空間' },
    { src: '/images/rooms/s1-1.png', alt: '四人房衛浴' },
];

const doubleRoomImages = [
    { src: '/images/rooms/b2-1.png', alt: '雙人房' },
    { src: '/images/rooms/b2-2.png', alt: '雙人房床鋪' },
    { src: '/images/rooms/s2-1.jpg', alt: '雙人房衛浴' },
    { src: '/images/rooms/s2-2.jpg', alt: '雙人房洗手台' },
];

const outdoorImages = [
    { src: '/images/outdoor/house_look/h_d1.jpg', alt: '民宿外觀日景' },
    { src: '/images/outdoor/house_look/h_d2.jpg', alt: '民宿外觀' },
    { src: '/images/outdoor/house_look/h_d3.png', alt: '民宿入口' },
    { src: '/images/outdoor/house_look/h_d4.png', alt: '停車區域' },
    { src: '/images/outdoor/house_look/h_n1.png', alt: '民宿夜景' },
];

const platformImages = [
    { src: '/images/outdoor/bath_tub_platform/platform_1.jpg', alt: '戶外平台' },
    { src: '/images/outdoor/bath_tub_platform/platform_2.jpg', alt: '平台休憩區' },
    { src: '/images/outdoor/bath_tub_platform/platform_3.jpg', alt: '按摩浴缸' },
    { src: '/images/outdoor/bath_tub_platform/platform_4.jpg', alt: '平台景觀' },
    { src: '/images/outdoor/bath_tub_platform/platform_5.jpg', alt: '平台全景' },
];

const firePitImages = [
    { src: '/images/outdoor/fire_pits/firepit_1.png', alt: '營火區' },
    { src: '/images/outdoor/fire_pits/firepit_2.png', alt: '營火區座位' },
    { src: '/images/outdoor/fire_pits/firepit_3.png', alt: '營火區環境' },
    { src: '/images/outdoor/fire_pits/firepit_4.png', alt: '營火區夜景' },
    { src: '/images/outdoor/fire_pits/firepit_5.jpg', alt: '營火區草皮' },
    { src: '/images/outdoor/fire_pits/firepit_6.png', alt: '營火區全景' },
];

export default function SpacesPage() {
    return (
        <main>
            <Hero
                title="空間與房型｜宜蘭 4–6 人獨棟小包棟"
                subtitle="適合 4–6 人入住的宜蘭小包棟，獨棟平房不需爬樓梯"
                imageSrc="/images/outdoor/house_look/h_n1.png"
                imageAlt="OFFLAND 空拍圖"
                height="medium"
            />

            {/* Overview */}
            <section className="section">
                <div className="container">
                    <div className={styles.overview}>
                        <h2>4-6人包棟說明</h2>
                        <p>
                            OFFLAND 園區佔地超過 200 坪，是獨棟平房，不用爬樓梯、入口獨立，周邊鄰居少，視野直接面向一整片田地。
                            室內約 20 坪小巧溫馨，有獨立客廳與中島廚房，一間四人房＋一間雙人房、兩間衛浴；園內可停 3–4 台車。
                        </p>
                        <p>
                            屋內走「侘寂 × 現代」風格，配 IH 電磁爐與完整廚具餐具，想自己煮一餐很方便；洗沐用品選用台灣品牌茶籽堂。
                            戶外有前庭、後院、草皮、營火區與平台區；平台備藤椅沙發與搖椅，並有大型按摩浴缸（5–9 月開放）。
                        </p>
                    </div>
                </div>
            </section>

            {/* Living Room / Kitchen */}
            <section id="living-kitchen" className={`${styles.spaceSection} section-lg`}>
                <div className="container">
                    <h2>客廳 / 廚房</h2>
                    <p className="text-secondary mb-md">
                        溫潤木質地板與中島廚房營造出溫潤又俐落的空間。配備 IH 爐、HITACHI 日立冰箱、Philip 快煮壺、Panasonic 微波爐、完整鍋具碗盤與餐具。
                        提供高級質感長毛絨地毯、三人座沙發、Dyson 吹風機、中央式空調等高級傢俱家電。娛樂設施包含有線電視、免費網路、Netflix、Switch 機。
                    </p>
                    <ImageGallery images={livingRoomImages} columns={3} />
                </div>
            </section>

            {/* Quad Room */}
            <section id="quad-room" className={`${styles.spaceSection} section`}>
                <div className="container">
                    <h2>房間 1 - 四人房</h2>
                    <p className="text-secondary mb-md">
                        四人房配備標準雙人床，簡約舒適的設計，適合家庭或朋友入住。房間內有獨立衛浴，提供茶籽堂洗髮、沐浴、護髮露。
                    </p>
                    <ImageGallery images={quadRoomImages} columns={4} />
                </div>
            </section>

            {/* Double Room */}
            <section id="double-room" className={`${styles.spaceSection} section`}>
                <div className="container">
                    <h2>房間 2 - 雙人房</h2>
                    <p className="text-secondary mb-md">
                        雙人房配備標準雙人床，溫馨舒適的空間，適合情侶或夫妻入住。房間內有獨立衛浴，提供完整的盥洗用品。
                    </p>
                    <ImageGallery images={doubleRoomImages} columns={4} />
                </div>
            </section>

            {/* Outdoor / Parking */}
            <section id="exterior" className={`${styles.spaceSection} section-lg`}>
                <div className="container">
                    <h2>外觀 / 停車</h2>
                    <p className="text-secondary mb-md">
                        獨棟平房，不需爬樓梯，擁有獨立入口。環境清幽，附近鮮少鄰居，享受世外桃源的感覺，面對一望無際的田地。
                        園區內可停 3-4 輛小客車，免費停車。
                    </p>
                    <ImageGallery images={outdoorImages} columns={3} />
                </div>
            </section>

            {/* Platform */}
            <section id="outdoor-platform" className={`${styles.spaceSection} section`}>
                <div className="container">
                    <h2>戶外平台區</h2>
                    <p className="text-secondary mb-md">
                        面對超大片田地，平台約 8 坪有屋簷，提供質感藤椅沙發與搖椅，附設 4 人超大戶外按摩浴缸（開放季節為 5-9 月）。
                    </p>
                    <ImageGallery images={platformImages} columns={3} />
                </div>
            </section>

            {/* Fire Pit */}
            <section id="fire-pits" className={`${styles.spaceSection} section`}>
                <div className="container">
                    <h2>火堆區</h2>
                    <p className="text-secondary mb-md">
                        位在草皮區周圍，緊鄰相思樹，客人可自備柴火來場營火小聚（請注意睡前或離開前請將火源撲滅以策安全）。
                        草皮區緊鄰營火區與戶外平台區，面積約 40 坪。
                    </p>
                    <ImageGallery images={firePitImages} columns={3} />
                </div>
            </section>
            <QuoteCTA />
        </main>
    );
}
