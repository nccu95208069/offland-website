'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingClick = () => {
    // GA4 事件追蹤
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'booking_click', {
        event_category: 'engagement',
        event_label: 'Navigation CTA',
        value: 1,
      });
    }
    window.open('https://www.booking-owlnest.com/offland?lang=zh_TW&adult=1&child=0&infant=0', '_blank');
  };

  const navLinks = [
    { href: '/about', label: '關於 OFFLAND' },
    { href: '/spaces', label: '空間與房型' },
    { href: '/experience', label: '入住體驗' },
    { href: '/faq', label: '常見問題' },
  ];

  return (
    <><nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src={isScrolled ? "/images/logo/offland_logo_crop_brown.png" : "/images/logo/offland_logo_crop.png"}
            alt="OFFLAND 遺忘無際"
            width={120}
            height={40}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <ul className={styles.navLinks}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <button
          className={styles.ctaButton}
          onClick={handleBookingClick}
        >
          立刻預定
        </button>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? '關閉選單' : '開啟選單'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className={isMobileMenuOpen ? styles.open : ''}></span>
          <span className={isMobileMenuOpen ? styles.open : ''}></span>
          <span className={isMobileMenuOpen ? styles.open : ''}></span>
        </button>
      </div>
    </nav>
      {/* Mobile Menu moved outside to avoid clipping by nav's backdrop-filter */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              className={styles.mobileCtaButton}
              onClick={() => {
                handleBookingClick();
                setIsMobileMenuOpen(false);
              }}
            >
              立刻預定
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
