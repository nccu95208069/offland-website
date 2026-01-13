'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './SpaceCarousel.module.css';

interface Space {
    label: string;
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    ctaText: string;
    ctaHref: string;
    scrollTarget: string;
}

interface SpaceCarouselProps {
    spaces: Space[];
}

export default function SpaceCarousel({ spaces }: SpaceCarouselProps) {
    // Start at index 1 because we'll have a cloned last slide at index 0
    const [currentIndex, setCurrentIndex] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // Create extended array: [last, ...original, first]
    // This allows seamless infinite loop
    const extendedSpaces = [spaces[spaces.length - 1], ...spaces, spaces[0]];

    const handlePrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);
    };

    const handleNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);
    };

    const handleDotClick = (index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        // Add 1 because real slides start at index 1 in extendedSpaces
        setCurrentIndex(index + 1);
    };

    // Handle infinite loop reset
    useEffect(() => {
        if (!isTransitioning) return;

        const transitionTimer = setTimeout(() => {
            setIsTransitioning(false);

            // If we're at the cloned last slide (index 0), jump to real last slide
            if (currentIndex === 0) {
                setCurrentIndex(spaces.length);
            }
            // If we're at the cloned first slide (index spaces.length + 1), jump to real first slide
            else if (currentIndex === spaces.length + 1) {
                setCurrentIndex(1);
            }
        }, 800); // Match transition duration

        return () => clearTimeout(transitionTimer);
    }, [currentIndex, isTransitioning, spaces.length]);

    // Get the actual active index for dots (0-based for original array)
    const getActiveIndex = () => {
        if (currentIndex === 0) return spaces.length - 1;
        if (currentIndex === spaces.length + 1) return 0;
        return currentIndex - 1;
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.viewport}>
                <div
                    ref={trackRef}
                    className={styles.track}
                    style={{
                        transform: `translateX(calc(-${currentIndex} * var(--slide-width, 85%)))`,
                        transition: isTransitioning ? 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)' : 'none'
                    }}
                >
                    {extendedSpaces.map((space, slideIndex) => {
                        return (
                            <div key={slideIndex} className={styles.slide}>
                                {/* Main content area - 85% */}
                                <div className={styles.slideMain}>
                                    {/* Image Section - 45% */}
                                    <div className={styles.imageArea}>
                                        <Image
                                            src={space.imageSrc}
                                            alt={space.imageAlt}
                                            fill
                                            sizes="(min-width: 1920px) 1152px, (min-width: 1280px) 768px, 100vw"
                                            style={{ objectFit: 'cover' }}
                                            priority={slideIndex === 1}
                                            quality={90}
                                        />
                                    </div>

                                    {/* Content Section - 40% */}
                                    <div className={styles.contentArea}>
                                        <div className={styles.textContent}>
                                            <p className={styles.label}>{space.label}</p>
                                            <h2 className={styles.title}>{space.title}</h2>
                                            <p className={styles.description}>{space.description}</p>

                                            <Link
                                                href={space.ctaHref}
                                                className={styles.cta}
                                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                                    if (space.scrollTarget) {
                                                        e.preventDefault();
                                                        window.location.href = space.ctaHref;
                                                        setTimeout(() => {
                                                            const element = document.getElementById(space.scrollTarget);
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }
                                                        }, 100);
                                                    }
                                                }}
                                            >
                                                {space.ctaText}
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6 12L10 8L6 4" />
                                                </svg>
                                            </Link>
                                        </div>

                                        {/* Controls */}
                                        <div className={styles.controls}>
                                            <button
                                                className={styles.navBtn}
                                                onClick={handlePrev}
                                                disabled={isTransitioning}
                                                aria-label="Previous"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="15 18 9 12 15 6" />
                                                </svg>
                                            </button>

                                            <div className={styles.dots}>
                                                {spaces.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`${styles.dot} ${idx === getActiveIndex() ? styles.dotActive : ''}`}
                                                        onClick={() => handleDotClick(idx)}
                                                        aria-label={`Go to ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                className={styles.navBtn}
                                                onClick={handleNext}
                                                disabled={isTransitioning}
                                                aria-label="Next"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
