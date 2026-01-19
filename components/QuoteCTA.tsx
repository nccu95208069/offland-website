'use client';

import styles from './QuoteCTA.module.css';

export default function QuoteCTA() {
    const handleBookingClick = () => {
        // GA4 事件追蹤
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'booking_click', {
                event_category: 'engagement',
                event_label: 'Quote CTA',
                value: 1,
            });
        }
    };

    return (
        <section className={styles.quoteCta}>
            <div className="container">
                <h2>
                    在 OFFLAND，你不需要安排太多行程，<br />
                    因為真正的目的地，是那個放鬆下來的自己。
                </h2>
                <div className={styles.btnWrapper}>
                    <a
                        href="https://www.booking-owlnest.com/offland?lang=zh_TW&adult=1&child=0&infant=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg"
                        onClick={handleBookingClick}
                    >
                        立即預訂 OFFLAND
                    </a>
                </div>
            </div>
        </section>
    );
}
