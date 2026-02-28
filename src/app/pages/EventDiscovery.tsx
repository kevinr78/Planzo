import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import {
    Search, MapPin, SlidersHorizontal, Star, Clock, Ticket, Sparkles,
    ChevronRight, ArrowRight, Users, Calendar, TrendingUp, Music,
    Cpu, UtensilsCrossed, Palette, Heart, Dumbbell, Navigation,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MOCK_EVENTS, Event } from "../mock-data";

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
const defaultIcon = new L.Icon({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
    { name: "All", icon: Sparkles },
    { name: "Music", icon: Music },
    { name: "Tech", icon: Cpu },
    { name: "Food", icon: UtensilsCrossed },
    { name: "Art", icon: Palette },
    { name: "Wellness", icon: Heart },
];

const STATS = [
    { label: "Events Hosted", value: 12400, suffix: "+", icon: Calendar },
    { label: "Cities Covered", value: 8, suffix: "", icon: MapPin },
    { label: "Happy Attendees", value: 50000, suffix: "+", icon: Users },
    { label: "Avg Rating", value: 4.8, suffix: "★", icon: Star },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useSectionReveal() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add("visible");
                    // Stagger children
                    const children = el.querySelectorAll(".stagger-child");
                    children.forEach((child, i) => {
                        setTimeout(() => child.classList.add("visible"), i * 100);
                    });
                    obs.disconnect();
                }
            },
            { threshold: 0.08 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return ref;
}

function useCountUp(target: number, duration = 1800) {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
            { threshold: 0.5 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(interval);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(interval);
    }, [started, target, duration]);

    return { ref, count };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat }: { stat: typeof STATS[0] }) {
    const { ref, count } = useCountUp(stat.value);
    const Icon = stat.icon;
    const display = stat.value === 4.8
        ? (count === stat.value ? "4.8" : (count / 1000).toFixed(1))
        : count.toLocaleString();

    return (
        <div ref={ref} className="stagger-child text-center px-6 py-5">
            <Icon size={20} style={{ color: "#f97316", margin: "0 auto 8px" }} />
            <p className="text-2xl md:text-3xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                {display}{stat.suffix}
            </p>
            <p className="text-xs font-medium mt-1" style={{ color: "#78716c" }}>{stat.label}</p>
        </div>
    );
}

// ─── Featured Hero Card (large) ──────────────────────────────────────────────
function HeroFeaturedCard({ event }: { event: Event }) {
    return (
        <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
            <div className="stagger-child relative rounded-3xl overflow-hidden group cursor-pointer" style={{ height: 460 }}>
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover parallax-img"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
                    <Sparkles size={11} /> Featured
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff" }}>
                            {event.category}
                        </span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                            <Star size={11} className="inline mr-0.5" style={{ color: "#fbbf24" }} /> {event.rating}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black mb-2 leading-tight" style={{ fontFamily: "'Outfit',sans-serif", color: "#fff" }}>
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {event.city}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-black" style={{ color: "#fbbf24" }}>
                            From ${Math.min(...event.tiers.map(t => t.price))}
                        </span>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ color: "#fff" }} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── Featured Side Card (small) ──────────────────────────────────────────────
function SideFeaturedCard({ event }: { event: Event }) {
    return (
        <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
            <div className="stagger-child relative rounded-2xl overflow-hidden group cursor-pointer" style={{ height: 218 }}>
                <img src={event.image} alt={event.title} className="w-full h-full object-cover parallax-img" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 60%)" }} />
                <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-medium mb-1" style={{ color: "#fdba74" }}>{event.date} · {event.city}</p>
                    <h3 className="text-sm font-bold leading-snug" style={{ fontFamily: "'Outfit',sans-serif", color: "#fff" }}>
                        {event.title}
                    </h3>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                        From ${Math.min(...event.tiers.map(t => t.price))}
                        <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1" />
                    </p>
                </div>
            </div>
        </Link>
    );
}

// ─── Event Grid Card ─────────────────────────────────────────────────────────
function EventCard({ event, index }: { event: Event; index: number }) {
    return (
        <div
            className="stagger-child"
            style={{ transitionDelay: `${Math.min(index % 4, 3) * 80}ms` }}
        >
            <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
                <div
                    className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5"
                    style={{
                        background: "#ffffff",
                        border: "1px solid rgba(249,115,22,0.08)",
                        boxShadow: "0 2px 16px rgba(249,115,22,0.05)",
                        cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(249,115,22,0.14)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.2)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(249,115,22,0.05)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.08)";
                    }}
                >
                    <div className="relative overflow-hidden" style={{ height: 190 }}>
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
                        {event.featured && (
                            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
                                <Sparkles size={10} /> Featured
                            </div>
                        )}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
                            {event.category}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                            <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                                <MapPin size={10} /> {event.city}
                                {event.distance && <> · {event.distance.toFixed(1)} km</>}
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                            {event.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "#78716c" }}>
                            <span className="flex items-center gap-1"><Clock size={10} /> {event.date}</span>
                            <span className="flex items-center gap-1"><Star size={10} style={{ color: "#f97316" }} /> {event.rating}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {event.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-md text-xs"
                                    style={{ background: "rgba(249,115,22,0.06)", color: "#ea580c", border: "1px solid rgba(249,115,22,0.12)" }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(249,115,22,0.06)" }}>
                            <div>
                                <span className="text-xs" style={{ color: "#78716c" }}>From </span>
                                <span className="text-base font-bold" style={{ color: "#f97316" }}>
                                    ${Math.min(...event.tiers.map(t => t.price))}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#f97316" }}>
                                <Ticket size={11} /> {event.tiers.reduce((s, t) => s + t.remaining, 0)} left
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// ─── Map Popup Card ──────────────────────────────────────────────────────────
function MapPopupContent({ event }: { event: Event }) {
    return (
        <div style={{ width: 200, fontFamily: "'Outfit',sans-serif" }}>
            <img src={event.image} alt={event.title} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: "8px 8px 0 0", marginBottom: 8 }} />
            <p style={{ fontWeight: 700, fontSize: 13, color: "#1a0a00", marginBottom: 2 }}>{event.title}</p>
            <p style={{ fontSize: 11, color: "#78716c", marginBottom: 4 }}>{event.date} · {event.venue}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#f97316" }}>
                    ${Math.min(...event.tiers.map(t => t.price))}
                </span>
                <Link to={`/events/${event.id}`} style={{ fontSize: 11, fontWeight: 600, color: "#f97316", textDecoration: "none" }}>
                    View →
                </Link>
            </div>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── Main Page ────────────────────────────────────────────────────────────────
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function EventDiscovery() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sortBy, setSortBy] = useState("featured");

    const filtered = useMemo(() => {
        let events = [...MOCK_EVENTS];
        if (search) events = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase()));
        if (category !== "All") events = events.filter(e => e.category === category);
        if (sortBy === "price-asc") events.sort((a, b) => Math.min(...a.tiers.map(t => t.price)) - Math.min(...b.tiers.map(t => t.price)));
        if (sortBy === "rating") events.sort((a, b) => b.rating - a.rating);
        if (sortBy === "featured") events.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        return events;
    }, [search, category, sortBy]);

    const featured = MOCK_EVENTS.filter(e => e.featured).slice(0, 3);

    // Map center calculation
    const mapCenter = useMemo<[number, number]>(() => {
        if (MOCK_EVENTS.length === 0) return [37.7749, -122.4194];
        const avgLat = MOCK_EVENTS.reduce((s, e) => s + e.lat, 0) / MOCK_EVENTS.length;
        const avgLng = MOCK_EVENTS.reduce((s, e) => s + e.lng, 0) / MOCK_EVENTS.length;
        return [avgLat, avgLng];
    }, []);

    // Section refs
    const statsRef = useSectionReveal();
    const featuredRef = useSectionReveal();
    const mapRef = useSectionReveal();
    const categoriesRef = useSectionReveal();
    const gridRef = useSectionReveal();
    const ctaRef = useSectionReveal();

    // Parallax hero effect
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const handler = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <div style={{ paddingTop: 68 }}>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: Cinematic Hero                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden" style={{ minHeight: 540, background: "linear-gradient(165deg, #1a0a00 0%, #2d1400 40%, #451a04 100%)" }}>
                {/* Decorative blurred orbs */}
                <div className="absolute rounded-full blur-3xl pointer-events-none" style={{ width: 500, height: 500, top: -200, right: -100, background: "rgba(249,115,22,0.15)", transform: `translateY(${scrollY * 0.1}px)` }} />
                <div className="absolute rounded-full blur-3xl pointer-events-none" style={{ width: 350, height: 350, bottom: -100, left: -80, background: "rgba(239,68,68,0.1)", transform: `translateY(${scrollY * -0.05}px)` }} />
                <div className="absolute rounded-full blur-2xl pointer-events-none" style={{ width: 180, height: 180, top: 100, left: "40%", background: "rgba(251,191,36,0.08)", transform: `translateY(${scrollY * 0.08}px)` }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: "radial-gradient(rgba(249,115,22,0.08) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                    opacity: 0.6,
                }} />

                <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-20 md:py-28">
                    {/* Badge */}
                    <div className="anim-fade-up delay-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#fdba74", border: "1px solid rgba(249,115,22,0.25)", backdropFilter: "blur(8px)" }}>
                        <Navigation size={12} className="anim-float" style={{ animationDuration: "2.5s" }} />
                        Discover what's happening around you
                    </div>

                    {/* Headline */}
                    <h1 className="anim-fade-up delay-1 text-4xl md:text-6xl lg:text-7xl font-black mb-5 max-w-3xl" style={{ fontFamily: "'Outfit',sans-serif", color: "#ffffff", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
                        Find Events That
                        <br />
                        <span className="shimmer-text" style={{ WebkitBackgroundClip: "text" }}>are for you</span>
                    </h1>

                    <p className="anim-fade-up delay-2 text-base md:text-lg mb-10 max-w-lg" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                        Concerts, workshops, food festivals, and hidden gems — curated for your city, your interests, your weekend.
                    </p>

                    {/* Search bar */}
                    <div className="anim-fade-up delay-3 flex flex-col sm:flex-row gap-3 max-w-2xl">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#f97316" }} />
                            <input
                                type="text"
                                placeholder="Search events, cities, venues..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm outline-none transition-all duration-300"
                                style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1.5px solid rgba(255,255,255,0.12)",
                                    color: "#ffffff",
                                    backdropFilter: "blur(12px)",
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
                            style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(249,115,22,0.4)" }}>
                            <MapPin size={15} /> Use My Location
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="anim-fade-up delay-5 flex flex-wrap gap-6 mt-10">
                        {[
                            { icon: TrendingUp, text: "12K+ events" },
                            { icon: MapPin, text: "8 cities" },
                            { icon: Users, text: "50K+ attendees" },
                        ].map(({ icon: I, text }) => (
                            <span key={text} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                                <I size={12} /> {text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top, var(--color-bg-base), transparent)" }} />
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2: Stats Bar                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div ref={statsRef} className="section-reveal max-w-[1100px] mx-auto px-6 -mt-8 relative z-10">
                <div className="glass-card rounded-3xl grid grid-cols-2 md:grid-cols-4 divide-x divide-orange-100">
                    {STATS.map(stat => (
                        <StatCard key={stat.label} stat={stat} />
                    ))}
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-[1400px] mx-auto">

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SECTION 3: Featured Events (Asymmetric)                   */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div ref={featuredRef} className="section-reveal py-16">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#f97316" }}>
                                Hand-Picked
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                Featured Events
                            </h2>
                        </div>
                        <Link to="/" className="hidden md:flex items-center gap-1 text-sm font-semibold transition-all hover:gap-2" style={{ color: "#f97316", textDecoration: "none" }}>
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {featured[0] && <HeroFeaturedCard event={featured[0]} />}
                        <div className="flex flex-col gap-5">
                            {featured[1] && <SideFeaturedCard event={featured[1]} />}
                            {featured[2] && <SideFeaturedCard event={featured[2]} />}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SECTION 4: Interactive Map                                */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div ref={mapRef} className="section-reveal py-12">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#f97316" }}>
                                Explore Nearby
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                Events on the Map
                            </h2>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#78716c" }}>
                            <MapPin size={12} style={{ color: "#f97316" }} /> {MOCK_EVENTS.length} events shown
                        </div>
                    </div>
                    <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(249,115,22,0.15)", boxShadow: "0 4px 32px rgba(249,115,22,0.08)" }}>
                        <div style={{ height: 420 }}>
                            <MapContainer center={mapCenter} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {MOCK_EVENTS.map(event => (
                                    <Marker key={event.id} position={[event.lat, event.lng]} icon={defaultIcon}>
                                        <Popup>
                                            <MapPopupContent event={event} />
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SECTION 5: Categories + Filters                          */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div ref={categoriesRef} className="section-reveal py-10">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#f97316" }}>
                                Browse
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                                All Events
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={14} style={{ color: "#78716c" }} />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="py-2 px-3 rounded-xl text-sm outline-none"
                                style={{ background: "#fff", color: "#92400e", border: "1px solid rgba(249,115,22,0.2)" }}>
                                <option value="featured">Featured First</option>
                                <option value="rating">Top Rated</option>
                                <option value="price-asc">Price: Low → High</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-8">
                        {CATEGORIES.map(({ name, icon: CatIcon }, i) => (
                            <button
                                key={name}
                                onClick={() => setCategory(name)}
                                className="stagger-child flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                                style={{
                                    transitionDelay: `${i * 50}ms`,
                                    background: category === name ? "linear-gradient(135deg,#f97316,#ef4444)" : "#ffffff",
                                    color: category === name ? "#fff" : "#92400e",
                                    border: `1.5px solid ${category === name ? "transparent" : "rgba(249,115,22,0.18)"}`,
                                    boxShadow: category === name ? "0 4px 16px rgba(249,115,22,0.3)" : "0 1px 4px rgba(0,0,0,0.04)",
                                }}
                            >
                                <CatIcon size={14} /> {name}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-sm font-medium" style={{ color: "#78716c" }}>
                            <span style={{ color: "#f97316", fontWeight: 700 }}>{filtered.length}</span> events found
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SECTION 6: Events Grid                                   */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div ref={gridRef} className="section-reveal pb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((event, i) => (
                            <EventCard key={event.id} event={event} index={i} />
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SECTION 7: CTA Banner                                    */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div ref={ctaRef} className="section-reveal pb-20">
                    <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
                        style={{ background: "linear-gradient(135deg, #1a0a00 0%, #451a04 50%, #7c2d12 100%)" }}>
                        {/* Orbs */}
                        <div className="absolute rounded-full blur-3xl pointer-events-none" style={{ width: 300, height: 300, top: -100, right: -50, background: "rgba(249,115,22,0.2)" }} />
                        <div className="absolute rounded-full blur-2xl pointer-events-none" style={{ width: 200, height: 200, bottom: -60, left: -40, background: "rgba(239,68,68,0.15)" }} />

                        <div className="relative z-10">
                            <h2 className="stagger-child text-3xl md:text-4xl font-black mb-4" style={{ fontFamily: "'Outfit',sans-serif", color: "#fff" }}>
                                Ready to Discover Something New?
                            </h2>
                            <p className="stagger-child text-sm md:text-base mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
                                Join thousands of people finding their next favorite experience on Planzo.
                            </p>
                            <div className="stagger-child flex flex-col sm:flex-row gap-3 justify-center">
                                <Link to="/register">
                                    <button className="px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
                                        style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", boxShadow: "0 4px 24px rgba(249,115,22,0.4)" }}>
                                        Get Started Free
                                    </button>
                                </Link>
                                <button className="px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
                                    style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                    Explore Events
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
