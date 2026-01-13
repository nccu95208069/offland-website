'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './FeaturesCarousel.module.css';

interface Feature {
    label: string;
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    reverse?: boolean;
    extraContent?: React.ReactNode;
}

interface FeaturesCarouselProps {
    features: Feature[];
}

export default function FeaturesCarousel({ features }: FeaturesCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const scrollToIndex = (index: number) => {
        if (scrollRef.current) {
            const scrollWidth = scrollRef.current.scrollWidth;
            const itemWidth = scrollWidth / features.length;
            scrollRef.current.scrollTo({
                left: itemWidth * index,
                behavior: 'smooth'
            });
        }
    };

    const handlePrev = () => {
        const newIndex = activeIndex > 0 ? activeIndex - 1 : features.length - 1;
        setActiveIndex(newIndex);
        scrollToIndex(newIndex);
    };

    const handleNext = () => {
        const newIndex = activeIndex < features.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(newIndex);
        scrollToIndex(newIndex);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const itemWidth = scrollRef.current.scrollWidth / features.length;
                const index = Math.round(scrollLeft / itemWidth);
                setActiveIndex(index);
            }
        };

        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', handleScroll);
            return () => scrollElement.removeEventListener('scroll', handleScroll);
        }
    }, [features.length]);

    return (
        <>
            <div className={styles.featuresWrapper} ref={scrollRef}>
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`${styles.featureRow} ${feature.reverse ? styles.featureRowReverse : ''}`}
                    >
                        <div className={styles.featureImage}>
                            <Image
                                src={feature.imageSrc}
                                alt={feature.imageAlt}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="img-cover"
                            />
                        </div>
                        <div className={styles.featureText} data-label={feature.label}>
                            <h2>{feature.title}</h2>
                            <p>{feature.description}</p>
                            {feature.extraContent}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Controls */}
            <div className={styles.mobileControls}>
                <button
                    className={styles.navButton}
                    onClick={handlePrev}
                    aria-label="Previous feature"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <div className={styles.carouselIndicators}>
                    {features.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.carouselDot} ${index === activeIndex ? styles.active : ''}`}
                            onClick={() => {
                                setActiveIndex(index);
                                scrollToIndex(index);
                            }}
                        ></div>
                    ))}
                </div>

                <button
                    className={styles.navButton}
                    onClick={handleNext}
                    aria-label="Next feature"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </>
    );
}
