import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FeatureCard = ({ icon, title, description, index }) => (
  <div className="lp-feature-card reveal" style={{ transitionDelay: `${index * 100}ms` }}>
    <div className="lp-feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const StatItem = ({ number, label }) => (
  <div className="lp-stat">
    <span className="lp-stat-num">{number}</span>
    <span className="lp-stat-label">{label}</span>
  </div>
);

const LandingPage = () => {
  const heroRef = useRef(null);
  const mockupRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // ── Handle Nav Scroll ──
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    // ── Intersection Observer for Reveal ──
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // ── Mouse Tracking for Mockup Card (Magnetic Effect) ──
    const handleMouseMove = (e) => {
      if (!mockupRef.current) return;
      const card = mockupRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      if (!mockupRef.current) return;
      mockupRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    const mockupContainer = document.querySelector('.lp-hero-mockup');
    if (mockupContainer) {
      mockupContainer.addEventListener('mousemove', handleMouseMove);
      mockupContainer.addEventListener('mouseleave', handleMouseLeave);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mockupContainer) {
        mockupContainer.removeEventListener('mousemove', handleMouseMove);
        mockupContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className="lp-root">
      {/* ── NAV ── */}
      <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <span className="lp-logo" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <path d="M7 14L14 8L21 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 18L14 12L21 18" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SmartShip
        </span>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">Process</a>
          <Link to="/login" className="lp-btn-ghost">Log in</Link>
          <Link to="/register" className="lp-btn-primary">Get Started</Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-badge">
            <span className="pulse-dot"></span>
            🚀 Shipping made effortless
          </div>
          <h1 className="lp-headline">
            Ship smarter,<br />
            <span className="lp-headline-accent">track everything.</span>
          </h1>
          <p className="lp-subheadline">
            The next generation of logistics. Experience real-time visibility, 
            distance-based pricing, and a seamless workflow — all in one powerful platform.
          </p>
          <div className="lp-hero-cta">
            <Link to="/register" className="lp-btn-hero-primary">
              Start Shipping Now
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/login" className="lp-btn-hero-ghost">
              Explore Demo
            </Link>
          </div>
          <div className="lp-hero-trust">
            <div className="lp-avatars">
              {['✨','🛡️','⚡','💎','🚀'].map((e, i) => (
                <span key={i} className="lp-avatar" style={{ zIndex: 5 - i }}>{e}</span>
              ))}
            </div>
            <span className="lp-trust-text">Join <strong>thousands</strong> of smart shippers worldwide</span>
          </div>
        </div>

        <div className="lp-hero-mockup">
          <div className="lp-mockup-card" ref={mockupRef}>
            <div className="lp-mockup-topbar">
              <div className="lp-mockup-dot" style={{background:'#ff5f57'}}/>
              <div className="lp-mockup-dot" style={{background:'#febc2e'}}/>
              <div className="lp-mockup-dot" style={{background:'#28c840'}}/>
            </div>
            <div className="lp-mockup-shipment">
              <div className="lp-mockup-label">
                <span>📦</span> Shipment #SS-Vibrant
              </div>
              <div className="lp-mockup-track-line">
                <div className="lp-track-dot active" />
                <div className="lp-track-seg done" />
                <div className="lp-track-dot active" />
                <div className="lp-track-seg done" />
                <div className="lp-track-dot active" />
                <div className="lp-track-seg" />
                <div className="lp-track-dot" />
              </div>
              <div className="lp-mockup-steps">
                <span>Created</span><span>Transit</span><span>Hub</span><span>Arriving</span>
              </div>
              <div className="lp-mockup-eta">
                <span>⚡</span> Arriving Today, 4:00 PM
              </div>
            </div>
            <div className="lp-mockup-stats">
              <div className="lp-ms-item"><span className="lp-ms-num">99.9%</span><span>Uptime</span></div>
              <div className="lp-ms-item"><span className="lp-ms-num">&lt; 1s</span><span>Latency</span></div>
              <div className="lp-ms-item"><span className="lp-ms-num">∞</span><span>Scale</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS PILL ── */}
      <section className="lp-stats-band reveal">
        <div className="lp-stats-container">
          <StatItem number="100%" label="Secure Bookings" />
          <StatItem number="Live" label="OSRM Routing" />
          <StatItem number="Real" label="Time Tracking" />
          <StatItem number="24/7" label="Admin Oversight" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-header reveal">
          <p className="lp-section-tag">Core Features</p>
          <h2>Powering the future of logistics</h2>
          <p className="lp-section-sub">
            Designed for performance, built for scale. SmartShip gives you the tools to manage your entire supply chain.
          </p>
        </div>
        <div className="lp-features-grid">
          <FeatureCard index={0} icon="📍" title="Interactive Tracking" description="A detailed timeline for every shipment. Know exactly where your package is at every step." />
          <FeatureCard index={1} icon="💰" title="Instant Quotes" description="Automatic cost calculation based on weight and distance using OSRM routing. No hidden fees." />
          <FeatureCard index={2} icon="✨" title="Shipment Wizard" description="An intuitive, multi-step process to book shipments quickly. Enter details and you're set." />
          <FeatureCard index={3} icon="💳" title="Integrated Payments" description="Securely pay for your bookings directly within the platform using our integrated payment flow." />
          <FeatureCard index={4} icon="🏠" title="User Dashboard" description="Centralized management for all your logistics. View history and status updates in one place." />
          <FeatureCard index={5} icon="🛠️" title="Admin Portal" description="Powerful oversight tools for managing users, monitoring revenue, and updating statuses." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how">
        <div className="lp-section-header reveal">
          <p className="lp-section-tag">The Process</p>
          <h2>Your package's journey</h2>
        </div>
        <div className="lp-steps">
          {[
            { n:'01', title:'Instant Access', desc:'Sign up in seconds to access your personal shipping dashboard.' },
            { n:'02', title:'Smart Wizard', desc:'Use our intuitive wizard to provide sender, receiver, and package information.' },
            { n:'03', title:'Live Quotes', desc:'Review the calculated distance and cost for your specific shipment instantly.' },
            { n:'04', title:'Book & Track', desc:'Complete payment to book your shipment and start tracking it immediately.' },
          ].map((step, i) => (
            <div key={step.n} className="lp-step-item reveal" style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="lp-step-num">{step.n}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner reveal">
        <div className="lp-cta-orb lp-cta-orb-1" />
        <div className="lp-cta-orb lp-cta-orb-2" />
        <h2>Ready to ship smarter?</h2>
        <p>Join thousands of businesses already scaling their logistics with SmartShip.</p>
        <div className="lp-cta-actions">
          <Link to="/register" className="lp-btn-hero-primary">Create Your Account</Link>
          <Link to="/login" className="lp-btn-cta-ghost">Sign In Instead</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#footer-grad)" />
            <defs>
              <linearGradient id="footer-grad" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
            <path d="M7 14L14 8L21 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SmartShip
        </span>
        <p className="lp-footer-copy">© {new Date().getFullYear()} SmartShip. Built for the future.</p>
        <div className="lp-footer-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
