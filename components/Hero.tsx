'use client';

import Image from 'next/image';
import styles from './Hero.module.css';

interface HeroProps {
    title: React.ReactNode;
    subtitle?: string;
    imageSrc?: string;
    videoSrc?: string;
    imageAlt: string;
    ctaText?: string;
    ctaHref?: string;
    onCtaClick?: () => void;
    height?: 'full' | 'large' | 'medium';
    backgroundColor?: string;
}

export default function Hero({
    title,
    subtitle,
    imageSrc,
    videoSrc,
    imageAlt,
    ctaText,
    ctaHref,
    onCtaClick,
    height = 'full',
    backgroundColor
}: HeroProps) {
    return (
        <section
            className={`${styles.hero} ${styles[height]}`}
            style={backgroundColor ? { backgroundColor } : undefined}
        >
            <div className={styles.imageWrapper}>
                {videoSrc ? (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={styles.video}
                    >
                        <source src={videoSrc} type="video/mp4" />
                        <source src={videoSrc} type="video/quicktime" />
                    </video>
                ) : imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        priority
                        className={styles.image}
                        sizes="100vw"
                    />
                ) : null}
                <div className={styles.overlay}></div>
            </div>

            <div className={styles.content}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && (
                    <p className={styles.subtitle}>
                        {subtitle}
                    </p>
                )}
                {ctaText && ctaHref && (
                    <a
                        href={ctaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cta}
                    >
                        {ctaText}
                    </a>
                )}
                {ctaText && onCtaClick && !ctaHref && (
                    <button
                        className={styles.cta}
                        onClick={onCtaClick}
                    >
                        {ctaText}
                    </button>
                )}
            </div>

            <div
                className={styles.scrollIndicator}
                onClick={() => {
                    const nextSection = document.querySelector('main > section:nth-child(2)');
                    if (nextSection) {
                        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }}
                style={{ cursor: 'pointer' }}
            >
                <div className={styles.mouse}>
                    <div className={styles.wheel}></div>
                </div>
            </div>
        </section>
    );
}
