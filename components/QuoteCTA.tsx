import Link from 'next/link';
import styles from './QuoteCTA.module.css';

export default function QuoteCTA() {
    return (
        <section className={styles.quoteCta}>
            <div className="container">
                <h2>
                    在 OFFLAND，你不需要安排太多行程，<br />
                    因為真正的目的地，是那個放鬆下來的自己。
                </h2>
                <div className={styles.btnWrapper}>
                    <Link href="/booking" className="btn btn-primary btn-lg">
                        立即預訂 OFFLAND
                    </Link>
                </div>
            </div>
        </section>
    );
}
