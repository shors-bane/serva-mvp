import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CountUp from './CountUp';
import Footer from './Footer';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const heroBgRef = useRef(null);
  const heroContentRef = useRef(null);
  const titleWordsRef = useRef([]);
  const howItWorksContainerRef = useRef(null);
  const cardsRef = useRef([]);
  const featureCardsRef = useRef([]);

  // Redirect Technicians
  useEffect(() => {
    if (user && user.role === 'technician') {
      navigate('/technician-dashboard', { replace: true });
    }
  }, [user, navigate]);

  useGSAP(() => {
    // Media match for reduced motion
    let mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Hero Split Text Entrance
      gsap.set(titleWordsRef.current, { y: 100, opacity: 0 });
      gsap.set('.hero-sub', { opacity: 0, y: 30 });
      gsap.set('.hero-cta', { opacity: 0, scale: 0.9 });

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.to(titleWordsRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.08,
        delay: 0.2
      })
      .to('.hero-sub', { opacity: 1, y: 0, duration: 1 }, "-=0.8")
      .to('.hero-cta', { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, "-=0.6");

      // 2. Mouse Parallax effect on Hero
      const xToBg = gsap.quickTo(heroBgRef.current, "x", {duration: 0.8, ease: "power3"});
      const yToBg = gsap.quickTo(heroBgRef.current, "y", {duration: 0.8, ease: "power3"});
      const xToContent = gsap.quickTo(heroContentRef.current, "x", {duration: 0.8, ease: "power3"});
      const yToContent = gsap.quickTo(heroContentRef.current, "y", {duration: 0.8, ease: "power3"});

      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Depth 0 (Background) moves opposite to mouse
        xToBg((clientX - centerX) * -0.02);
        yToBg((clientY - centerY) * -0.02);
        
        // Depth 4 (Content) moves with mouse
        xToContent((clientX - centerX) * 0.03);
        yToContent((clientY - centerY) * 0.03);
      };

      heroRef.current.addEventListener('mousemove', handleMouseMove);

      // 3. Cascading Card Stack (How it Works)
      gsap.set(cardsRef.current, { y: window.innerHeight }); // Start offscreen

      ScrollTrigger.create({
        trigger: howItWorksContainerRef.current,
        start: "top top",
        end: "+=2000",
        pin: true,
        animation: gsap.timeline()
          .to(cardsRef.current[0], { y: 0, duration: 1 })
          .to(cardsRef.current[1], { y: 20, scale: 0.95, duration: 1 }, "+=0.5")
          .to(cardsRef.current[0], { scale: 0.9, opacity: 0.5, y: -20, duration: 1 }, "<")
          .to(cardsRef.current[2], { y: 40, scale: 0.9, duration: 1 }, "+=0.5")
          .to(cardsRef.current[1], { scale: 0.85, opacity: 0.5, y: 0, duration: 1 }, "<")
          .to(cardsRef.current[0], { scale: 0.8, opacity: 0.2, y: -40, duration: 1 }, "<"),
        scrub: 1,
      });

      // 4. Feature Cards Elastic Reveal
      gsap.set(featureCardsRef.current, { opacity: 0, y: 100, rotateX: 15 });

      ScrollTrigger.batch(featureCardsRef.current, {
        start: "top 80%",
        onEnter: batch => gsap.to(batch, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: "back.out(1.4)"
        })
      });

      return () => {
        heroRef.current?.removeEventListener('mousemove', handleMouseMove);
      };
    });

  }, { scope: heroRef });

  const featureData = [
    {
      title: 'AI-Powered Diagnosis',
      desc: 'Upload a photo of your damaged device. Our AI analyzes the issue, identifies the exact part needed, and calculates a transparent estimate before you commit.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-copper">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          <path d="M12 12 10 10"></path>
          <path d="m14 14-2-2"></path>
          <path d="m16 16-2-2"></path>
          <path d="m18 18-2-2"></path>
        </svg>
      )
    },
    {
      title: 'Doorstep Repair',
      desc: 'A certified technician arrives at your chosen time. Track every stage of your repair in real-time, from pickup through completion.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-copper">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      )
    },
    {
      title: 'Digital Warranty',
      desc: 'Every repair comes with a QR-verifiable digital warranty certificate. Scan to verify authenticity, view repair history, and file claims.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-copper">
          <path d="m12 22-8-4.5v-8L12 2l8 7.5v8z"></path>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
      )
    }
  ];

  return (
    <main className="w-full overflow-hidden bg-[#0E0F11]">
      
      {/* --- SCENE 1: HERO --- */}
      <section ref={heroRef} className="relative h-screen flex flex-col justify-center overflow-hidden">
        
        {/* Depth 0: Cinematic Video Background */}
        <div ref={heroBgRef} className="absolute inset-[-5%] w-[110%] h-[110%] z-0 depth-0">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Depth 1: Atmospheric Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0F11]/60 via-[#1A6B5C]/20 to-[#0E0F11] z-10 depth-1 pointer-events-none"></div>
        <div className="absolute inset-0 bg-black/40 z-10 depth-1 pointer-events-none"></div>

        {/* Depth 4: Content */}
        <div ref={heroContentRef} className="relative z-40 depth-4 flex flex-col items-center justify-center w-full px-4 pt-20">
          
          <div className="flex items-center justify-center mb-8 hero-sub">
            <div className="bg-glass border border-white/10 rounded-full px-5 py-2 flex items-center shadow-[0_0_20px_rgba(26,107,92,0.3)]">
              <span className="w-2 h-2 rounded-full bg-teal-400 mr-3 animate-pulse"></span>
              <span className="label-mono text-[#c4c2c3]">Next-Gen Electronics Repair</span>
            </div>
          </div>

          <h1 className="font-display font-semibold text-white text-[clamp(42px,7vw,84px)] leading-[1.05] tracking-[-0.03em] text-center mb-6 max-w-[900px] flex flex-wrap justify-center gap-x-[16px] gap-y-2">
            {["Expert", "Repairs,", "Delivered", "to", "You."].map((word, i) => (
              <div key={i} className="split-text-line">
                <span ref={el => titleWordsRef.current[i] = el} className="split-text-word">
                  {word}
                </span>
              </div>
            ))}
          </h1>

          <p className="font-sans text-white/75 text-[clamp(16px,1.8vw,20px)] max-w-[560px] mx-auto text-center mb-10 hero-sub">
            India's trusted platform for smartphone and laptop repairs. Certified technicians, transparent pricing, digital warranty on every fix.
          </p>

          <div className="flex justify-center gap-4 hero-cta">
            <Link to="/book" className="btn-copper text-base py-3 px-8">Book a Repair</Link>
            <Link to="/track" className="btn-ghost text-base py-3 px-8">Track Your Repair</Link>
          </div>
        </div>

        {/* Depth 5: Foreground Scrolldown Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 depth-5 flex flex-col items-center hero-cta opacity-60">
          <span className="label-mono text-white/50 mb-2 text-[9px]">Scroll Down</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
        </div>
      </section>

      {/* --- SCENE 2: STATS --- */}
      <section className="bg-[#0E0F11] py-16 px-4 relative z-40 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { val: 50000, suf: "+", text: "Repairs Completed" },
            { val: 45, suf: "+", text: "Cities Served" },
            { val: 24, suf: "hr", text: "Avg. Turnaround" },
            { val: 6, suf: "mo", text: "Warranty Included" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-6 glass-strong rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-copper/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="font-display font-bold text-white text-[clamp(28px,3vw,40px)] tabular-nums mb-1">
                <CountUp target={stat.val} suffix={stat.suf} />
              </div>
              <div className="font-sans text-white/60 text-sm font-medium tracking-wide">{stat.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SCENE 3: HOW IT WORKS (Cascading Stack) --- */}
      <section ref={howItWorksContainerRef} className="h-screen bg-[#F5EDE4] relative z-40 overflow-hidden flex flex-col items-center justify-center pt-20">
        <div className="text-center mb-12 absolute top-24 left-0 right-0 z-50">
          <div className="label-mono text-copper mb-4">HOW IT WORKS</div>
          <h2 className="font-display font-semibold text-[clamp(32px,4vw,52px)] text-ink-dark">Three steps to a fixed device.</h2>
        </div>

        <div className="relative w-full max-w-2xl h-[400px] mt-24">
          {[
            { num: "01", title: "Upload a Photo", desc: "Snap a photo of the issue. Our AI identifies the problem and gives you an instant estimate." },
            { num: "02", title: "Choose Your Slot", desc: "Pick a time that works. A certified technician comes to your doorstep." },
            { num: "03", title: "Repaired with Warranty", desc: "Your device is fixed on-site. You get a digital warranty certificate, verifiable by QR code." }
          ].map((step, i) => (
            <div 
              key={i} 
              ref={el => cardsRef.current[i] = el}
              className="absolute inset-0 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-[#E5DDD4] rounded-3xl p-10 flex flex-col justify-center will-change-transform"
              style={{ transformOrigin: "top center" }}
            >
              <div className="font-display font-bold text-[80px] text-[#F5EDE4] absolute top-4 right-8 leading-none tracking-tighter">
                {step.num}
              </div>
              <h3 className="font-sans font-semibold text-3xl text-ink-dark mb-4 relative z-10">{step.title}</h3>
              <p className="font-sans text-lg text-ink-muted leading-relaxed relative z-10 max-w-[480px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SCENE 4: FEATURES --- */}
      <section className="bg-[#0E0F11] py-32 px-5 md:px-10 relative z-40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display font-semibold text-white text-[clamp(32px,4vw,52px)] leading-tight">Built for the devices you rely on</h2>
            <p className="font-sans text-white/60 text-lg mt-6 max-w-2xl mx-auto text-balance">Enterprise-grade service, now available for your personal devices.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {featureData.map((f, i) => (
              <div
                key={i}
                ref={(el) => (featureCardsRef.current[i] = el)}
                className="glass-strong rounded-3xl p-10 border border-white/10 relative overflow-hidden group hover:bg-white/[0.05] transition-colors duration-500 will-change-transform"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-copper/20 blur-[60px] rounded-full group-hover:bg-copper/30 transition-colors duration-500"></div>
                <div className="w-12 h-12 mb-8 bg-[#161719] border border-white/10 rounded-xl flex items-center justify-center relative z-10">
                  {f.icon}
                </div>
                <h3 className="font-sans font-semibold text-white text-2xl mt-4 relative z-10">{f.title}</h3>
                <p className="font-sans text-white/65 text-base leading-relaxed mt-4 relative z-10">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default HomePage;
