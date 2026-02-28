import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { supabase, signOut, getMyRegistration } from './services/supabaseClient';
// Removed explicit User import to avoid version conflicts
// import { User } from '@supabase/supabase-js';

import PowerCore from './components/3d/PowerCore';
import MagneticButton from './components/MagneticButton';
import TextReveal from './components/TextReveal';
import RegistrationForm from './components/RegistrationForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';

import { BENTO_ITEMS, TIMELINE_EVENTS } from './constants';
import { ChevronDown, MapPin, Users, Trophy, Cpu, Terminal, ShieldAlert, LogIn, AlertOctagon, LogOut } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    // Auth & Form State
    // Use any for user to support different supabase-js versions
    const [user, setUser] = useState<any | null>(null);
    const [userRegistration, setUserRegistration] = useState<any>(null);

    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    const heroRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const timelineLineRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Auth State Listener
    useEffect(() => {
        // Cast auth to any to bypass type checking for different library versions
        const auth = supabase.auth as any;

        if (auth.getSession) {
            auth.getSession().then(({ data: { session } }: any) => {
                handleAuthSession(session?.user ?? null);
            });
        } else if (auth.session) {
            // Fallback for v1
            const session = auth.session();
            handleAuthSession(session?.user ?? null);
        }

        const { data } = auth.onAuthStateChange((_event: any, session: any) => {
            handleAuthSession(session?.user ?? null);
        });

        return () => {
            if (data && data.subscription) {
                data.subscription.unsubscribe();
            } else if (data && typeof data.unsubscribe === 'function') {
                data.unsubscribe();
            }
        };
    }, []);

    const checkSessionExpiry = () => {
        const loginTime = localStorage.getItem('aerochain_login_time');
        if (loginTime) {
            const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
            if (Date.now() - parseInt(loginTime, 10) > twoDaysInMs) {
                return true; // Expired
            }
        }
        return false;
    };

    const handleAuthSession = async (currentUser: any | null) => {
        if (currentUser) {
            if (checkSessionExpiry()) {
                await handleLogout();
                return;
            }
            setUser(currentUser);
            // Check for existing registration immediately
            const existingData = await getMyRegistration(currentUser.id, currentUser.email);
            setUserRegistration(existingData);
        } else {
            setUser(null);
            setUserRegistration(null);
        }
    };

    const handleLoginSuccess = async (loggedInUser: any) => {
        // Stamp login time
        localStorage.setItem('aerochain_login_time', Date.now().toString());

        setUser(loggedInUser);
        setIsLoginOpen(false);

        // Fetch latest data
        const existingData = await getMyRegistration(loggedInUser.id, loggedInUser.email);
        setUserRegistration(existingData);

        // Open form automatically after login
        setIsRegOpen(true);
    };

    const handleLogout = async () => {
        await signOut();
        localStorage.removeItem('aerochain_login_time');
        setUser(null);
        setUserRegistration(null);
        setIsRegOpen(false);
    };

    // Preloader Logic
    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setLoading(false), 1200);
                    return 100;
                }
                const increment = Math.random() * (prev > 90 ? 2 : prev > 60 ? 5 : 8);
                return Math.min(prev + increment, 100);
            });
        }, 50);
        return () => clearInterval(timer);
    }, []);

    // Smooth Scroll & Animations
    useEffect(() => {
        if (loading || isAdminMode) return;

        // --- CRITICAL FIX: SYNC LENIS WITH GSAP SCROLLTRIGGER ---
        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 2,
        });

        // Tell ScrollTrigger to update whenever Lenis scrolls
        lenis.on('scroll', ScrollTrigger.update);

        // Sync GSAP's ticker with Lenis's RAF to ensure smooth animation
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        // Turn off GSAP lag smoothing to prevent stutter during heavy calculation
        gsap.ticker.lagSmoothing(0);
        // --------------------------------------------------------

        // Reveal Main Content
        if (mainContentRef.current) {
            gsap.fromTo(mainContentRef.current,
                { opacity: 0, scale: 1.05 },
                { opacity: 1, scale: 1, duration: 1.5, ease: "power4.out", delay: 0.2 }
            );
        }

        // Hero Text Glitch Intro
        gsap.from(".hero-glitch", {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out",
            delay: 0.5
        });

        // Timeline Line Drawing
        if (timelineRef.current && timelineLineRef.current) {
            gsap.fromTo(timelineLineRef.current,
                { height: '0%' },
                {
                    height: '100%',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: timelineRef.current,
                        start: 'top 60%',
                        end: 'bottom 80%',
                        scrub: true,
                    }
                }
            );
        }

        // Timeline Items Animation
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, i) => {
            const card = item.querySelector('.timeline-card');
            const dot = item.querySelector('.timeline-dot');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });

            tl.fromTo(dot,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
            )
                .fromTo(card,
                    { y: 50, opacity: 0, scale: 0.9, rotationX: 10 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        rotationX: 0,
                        duration: 0.6,
                        ease: "back.out(1.5)"
                    },
                    "-=0.2"
                );
        });

        // Bento Grid Animation
        gsap.fromTo(".bento-card",
            { y: 100, opacity: 0, scale: 0.9 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: "#bento-grid",
                    start: "top 80%",
                }
            }
        );

        // Floating UI Elements
        gsap.to(".floating-ui", {
            y: -15,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Refresh ScrollTrigger after a slight delay to ensure DOM is ready
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 1000);

        return () => {
            // Clean up
            gsap.ticker.remove(lenis.raf);
            lenis.destroy();
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [loading, isAdminMode]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050505] z-50 flex items-center justify-center flex-col">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="text-6xl font-black mb-8 relative">
                    <span className="text-white opacity-20 blur-sm absolute top-0 left-0 animate-pulse">AEROCHAIN</span>
                    <span className="text-[#00F0FF] relative z-10">AEROCHAIN</span>
                </div>
                <div className="w-80 h-1 bg-[#1A1A1A] overflow-hidden mb-4 relative rounded-full">
                    <div className="h-full bg-[#00F0FF] shadow-[0_0_20px_#00F0FF]" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                </div>
                <div className="font-mono text-[#00F0FF] text-xs tracking-widest flex items-center gap-2 uppercase">
                    {progress < 100 ? (
                        <>Loading Assets <span className="animate-spin">/</span> Core {Math.floor(progress)}%</>
                    ) : (
                        <span className="animate-pulse">SYSTEM READY_</span>
                    )}
                </div>
            </div>
        );
    }

    if (isAdminMode) {
        return (
            <AdminDashboard onLogout={() => setIsAdminMode(false)} />
        )
    }

    const getIcon = (id: string) => {
        switch (id) {
            case '1': return <Trophy className="w-6 h-6 text-[#00F0FF]" />;
            case '2': return <MapPin className="w-6 h-6 text-[#00F0FF]" />;
            case '3': return <Users className="w-6 h-6 text-[#00F0FF]" />;
            case '4': return <Cpu className="w-6 h-6 text-[#00F0FF]" />;
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00F0FF] selection:text-black overflow-x-hidden">

            {/* 3D Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
                <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
                    <Environment preset="city" />
                    <Float speed={3} rotationIntensity={0.8} floatIntensity={0.8}>
                        <PowerCore />
                    </Float>
                </Canvas>
            </div>

            <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Main Content */}
            <div ref={mainContentRef} className="relative z-10">

                {/* Navigation */}
                <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
                    <div className="font-bold text-2xl tracking-tighter flex items-center gap-2 group cursor-pointer">
                        <span className="w-3 h-3 bg-[#00F0FF] rounded-none group-hover:rotate-45 transition-transform duration-300 shadow-[0_0_10px_#00F0FF]"></span>
                        <span className="font-mono">AEROCHAIN_26</span>
                    </div>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <div className="text-[10px] text-gray-400 font-mono">OPERATIVE</div>
                                <div className="text-xs font-bold text-[#00F0FF]">{user.email?.split('@')[0]}</div>
                            </div>
                            <MagneticButton className="!px-6 !py-2 !text-xs" onClick={() => setIsRegOpen(true)}>
                                {userRegistration ? 'EDIT PROTOCOL' : 'INITIALIZE'}
                            </MagneticButton>
                            <button onClick={handleLogout} className="text-red-500 hover:text-white transition-colors">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <MagneticButton className="!px-6 !py-2 !text-xs" onClick={() => setIsLoginOpen(true)}>
                            LOGIN_NODE
                        </MagneticButton>
                    )}
                </nav>

                {/* Hero Section */}
                <section className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden">
                    <div ref={heroRef} className="space-y-4 relative z-10">
                        <div className="hero-glitch inline-flex items-center gap-2 border border-[#00F0FF]/30 bg-[#00F0FF]/5 backdrop-blur-md px-6 py-2 rounded-none text-[#00F0FF] font-mono text-xs mb-8 tracking-widest uppercase">
                            <span className="w-2 h-2 bg-[#00F0FF] animate-pulse"></span>
                            Network Status: Synchronizing
                        </div>

                        <h1 className="hero-glitch text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] relative">
                            <div className="glitch-wrapper">
                                <span className="block text-transparent stroke-white" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>AERO</span>
                                <span className="glitch-text block text-[#00F0FF] filter drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]" data-text="CHAIN">CHAIN</span>
                            </div>
                        </h1>

                        <p className="hero-glitch max-w-xl mx-auto text-gray-400 font-mono text-sm md:text-base pt-6 leading-relaxed">
                            <span className="text-[#00F0FF]">{'>'}</span> Immutable ledger for aviation.<br />
                            <span className="text-[#00F0FF]">{'>'}</span> 24 Hours to decentralized traceability.
                        </p>

                        <div className="hero-glitch pt-8">
                            <MagneticButton onClick={() => user ? setIsRegOpen(true) : setIsLoginOpen(true)}>
                                <span className="flex items-center gap-2">
                                    {user ? (
                                        userRegistration ? 'MODIFY DATA' : 'CONNECT NODE'
                                    ) : (
                                        <> <LogIn className="w-4 h-4" /> AUTHENTICATE </>
                                    )}
                                </span>
                            </MagneticButton>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 floating-ui">
                        <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-[#00F0FF] to-transparent"></div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#00F0FF]">Scroll to Decrypt</span>
                    </div>
                </section>

                {/* Narrative Section */}
                <section className="min-h-[60vh] flex items-center justify-center px-6 md:px-20 py-20 relative bg-gradient-to-b from-transparent to-black/80">
                    <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-[#00F0FF]/20 to-transparent"></div>
                    <div className="max-w-5xl text-center space-y-6">
                        <div className="inline-block p-3 border border-red-500/30 rounded bg-red-500/5 text-red-500 font-mono text-xs tracking-widest mb-4">
                            <ShieldAlert className="inline w-4 h-4 mr-2" />
                            ERROR: TRACEABILITY GAP DETECTED
                        </div>
                        <h2 className="text-3xl md:text-6xl font-bold leading-tight text-white">
                            <TextReveal className="opacity-60">The supply chain is fragmented.</TextReveal>
                            <span className="block h-2"></span>
                            <TextReveal className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">On March 1st, we deploy the immutable ledger.</TextReveal>
                        </h2>
                        <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto leading-loose">
                            This isn't just a hackathon. It's a fundamental shift in aerospace maintenance. We are gathering blockchain developers, aviation experts, and visionaries to secure the future of flight.
                        </p>
                    </div>
                </section>

                {/* Bento Grid */}
                <section id="bento-grid" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-4">
                        <h2 className="text-4xl font-bold flex items-center gap-3">
                            <span className="text-[#00F0FF]">/</span>
                            <TextReveal>FLIGHT_MANIFEST</TextReveal>
                        </h2>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 bg-[#00F0FF] animate-ping"></span>
                            <span className="font-mono text-[#00F0FF] text-xs">LIVE_DATA_FEED</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[240px]">
                        {BENTO_ITEMS.map((item) => (
                            <div
                                key={item.id}
                                className={`bento-card glass-panel-strong p-8 rounded-none border-l-2 border-l-[#00F0FF]/0 hover:border-l-[#00F0FF] flex flex-col justify-between group bg-gradient-to-br from-white/5 to-transparent hover:from-[#00F0FF]/10 transition-all duration-500 relative overflow-hidden`}
                                style={{ gridColumn: `span ${item.colSpan}`, gridRow: `span ${item.rowSpan}` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-[#00F0FF] group-hover:scale-110 group-hover:bg-[#00F0FF] group-hover:text-black transition-all duration-300">
                                    {getIcon(item.id)}
                                </div>

                                <div className="relative z-10">
                                    <div className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-widest mb-1 flex items-center gap-2">
                                        0{item.id} // {item.title}
                                    </div>
                                    <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:translate-x-2 transition-transform duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#00F0FF]">{item.value}</div>
                                </div>

                                <div className="relative z-10 border-t border-white/10 pt-4 mt-auto">
                                    <div className="text-sm text-gray-400 font-mono">{item.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Timeline */}
                <section ref={timelineRef} className="py-32 px-6 md:px-12 relative max-w-5xl mx-auto overflow-hidden min-h-screen flex flex-col justify-center">
                    <div className="text-center mb-24">
                        <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full border border-[#00F0FF]/30">
                            <Terminal className="w-4 h-4 text-[#00F0FF]" />
                        </div>
                        <h2 className="text-4xl font-bold"><TextReveal>LEDGER_LOG</TextReveal></h2>
                    </div>

                    <div className="absolute left-6 md:left-1/2 top-48 bottom-0 w-[1px] bg-white/5 -translate-x-1/2">
                        <div ref={timelineLineRef} className="w-full bg-[#00F0FF] shadow-[0_0_20px_#00F0FF] relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-gradient-to-t from-[#00F0FF] to-transparent"></div>
                        </div>
                    </div>

                    <div className="space-y-16">
                        {TIMELINE_EVENTS.map((event, index) => (
                            <div key={index} className={`timeline-item flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-0 relative ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="timeline-card w-full md:w-1/2 p-1">
                                    <div className={`p-6 glass-panel border border-[#00F0FF]/20 bg-black/50 hover:bg-[#00F0FF]/5 transition-colors relative group ${index % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}`}>
                                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00F0FF]"></div>
                                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00F0FF]"></div>

                                        <div className="font-mono text-[#00F0FF] text-xl mb-1 flex items-center justify-between">
                                            <span>{event.time}</span>
                                            <span className="text-xs opacity-50">PACKET_{index + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-[#00F0FF] transition-colors">{event.title}</h3>
                                        <p className="text-gray-400 text-sm font-mono">{event.description}</p>
                                    </div>
                                </div>

                                <div className="timeline-dot absolute left-0 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 w-3 h-3 bg-[#050505] border border-[#00F0FF] rotate-45 z-10 shadow-[0_0_10px_#00F0FF]">
                                    <div className="absolute inset-0 bg-[#00F0FF] opacity-50 animate-ping"></div>
                                </div>

                                <div className="w-full md:w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="h-[70vh] flex flex-col justify-center items-center text-center px-4 relative z-20">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>

                    <div className="max-w-4xl mx-auto space-y-12 z-10">
                        <h2 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none">
                            <span className="block text-white mix-blend-overlay opacity-50">TRACE</span>
                            <span className="block text-[#00F0FF] glitch-text" data-text="PARTS">PARTS</span>
                        </h2>

                        <div className="flex flex-col md:flex-row gap-6 justify-center items-center pt-8">
                            <MagneticButton onClick={() => user ? setIsRegOpen(true) : setIsLoginOpen(true)} className="min-w-[200px]">
                                {user ? (userRegistration ? 'UPDATE DATA' : 'START SEQUENCE') : 'LOGIN TO ACCESS'}
                            </MagneticButton>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-6 border-t border-white/5 bg-black z-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-pulse"></div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>System Status: Optimal</span>
                        </div>
                        <div>© 2026 AEROCHAIN PROTOCOL // ALL RIGHTS RESERVED</div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-[#00F0FF] transition-colors">[ DOCS ]</a>
                            <a href="#" className="hover:text-[#00F0FF] transition-colors">[ TERMINAL ]</a>
                        </div>
                    </div>
                </footer>

            </div>

            {/* Overlays */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
                onAdminRequest={() => setIsAdminLoginOpen(true)}
            />

            {user && (
                <RegistrationForm
                    isOpen={isRegOpen}
                    onClose={() => setIsRegOpen(false)}
                    onAdminRequest={() => setIsAdminLoginOpen(true)}
                    user={user}
                    initialData={userRegistration}
                />
            )}

            <AdminLogin
                isOpen={isAdminLoginOpen}
                onClose={() => setIsAdminLoginOpen(false)}
                onLoginSuccess={() => setIsAdminMode(true)}
            />



        </div>
    );
};

export default App;