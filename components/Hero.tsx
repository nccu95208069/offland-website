'use client';

import { useState, useEffect } from 'react';
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
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        // 只在有影片時才載入
        if (!videoSrc) return;

        // 延遲載入影片，讓頁面先渲染
        const timer = setTimeout(() => {
            setShowVideo(true);
        }, 500); // 等待 500ms 讓頁面先渲染

        return () => clearTimeout(timer);
    }, [videoSrc]);

    const handleVideoCanPlay = () => {
        setVideoLoaded(true);
    };

    return (
        <section
            className={`${styles.hero} ${styles[height]}`}
            style={backgroundColor ? { backgroundColor } : undefined}
        >
            <div className={styles.imageWrapper}>
                {/* Poster 圖片 - 立即顯示 */}
                {imageSrc && (
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        priority
                        className={`${styles.image} ${videoLoaded ? styles.fadeOut : ''}`}
                        sizes="100vw"
                        quality={90}
                    />
                )}

                {/* 影片 - 延遲載入並淡入 */}
                {videoSrc && showVideo && (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`${styles.video} ${videoLoaded ? styles.fadeIn : ''}`}
                        onCanPlay={handleVideoCanPlay}
                        poster={imageSrc} // 使用 poster 作為備援
                        preload="metadata" // 只載入 metadata，不載入完整影片
                    >
                        <source src={videoSrc} type="video/mp4" />
                        <source src={videoSrc} type="video/quicktime" />
                    </video>
                )}

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
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const nextSection = document.querySelector('main > section:nth-child(2)');
                        if (nextSection) {
                            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label="向下滾動到下一個區塊"
                style={{ cursor: 'pointer' }}
            >
                <div className={styles.mouse}>
                    <div className={styles.wheel}></div>
                </div>
            </div>
        </section>
    );
}
