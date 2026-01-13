'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
    images: {
        src: string;
        alt: string;
    }[];
    columns?: 2 | 3 | 4;
}

export default function ImageGallery({ images, columns = 3 }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    const handlePrevious = () => {
        if (selectedImage !== null && selectedImage > 0) {
            setSelectedImage(selectedImage - 1);
        }
    };

    const handleNext = () => {
        if (selectedImage !== null && selectedImage < images.length - 1) {
            setSelectedImage(selectedImage + 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSelectedImage(null);
        } else if (e.key === 'ArrowLeft') {
            handlePrevious();
        } else if (e.key === 'ArrowRight') {
            handleNext();
        }
    };

    return (
        <>
            <div className={`${styles.gallery} ${styles[`columns${columns}`]}`}>
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={styles.imageWrapper}
                        onClick={() => setSelectedImage(index)}
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className={styles.image}
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage !== null && (
                <div
                    className={styles.lightbox}
                    onClick={() => setSelectedImage(null)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    <button
                        className={styles.closeButton}
                        onClick={() => setSelectedImage(null)}
                        aria-label="關閉"
                    >
                        ✕
                    </button>

                    <button
                        className={`${styles.navButton} ${styles.prevButton}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrevious();
                        }}
                        disabled={selectedImage === 0}
                        aria-label="上一張"
                    >
                        ‹
                    </button>

                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={images[selectedImage].src}
                            alt={images[selectedImage].alt}
                            fill
                            sizes="90vw"
                            className={styles.lightboxImage}
                        />
                    </div>

                    <button
                        className={`${styles.navButton} ${styles.nextButton}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        disabled={selectedImage === images.length - 1}
                        aria-label="下一張"
                    >
                        ›
                    </button>

                    <div className={styles.counter}>
                        {selectedImage + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    );
}
