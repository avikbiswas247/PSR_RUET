"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandSymbol } from "@/components/layout/brand-logo";
import { CameraIllustration } from "@/components/camera/camera-illustration";
import { useAuth } from "@/components/providers/auth-provider";
import {
  DEFAULT_HOMEPAGE_FEATURED_PHOTOS,
  parseHomepageFeaturedPhotos,
} from "@/lib/homepage-featured-photos";

type Notice = { id: string; title?: string; message?: string; created_at?: string; is_read?: boolean };
const features = [
  { n: "01", title: "A place to belong", text: "Meet visual storytellers, exchange ideas and grow alongside a community that sees the world differently.", icon: "◉" },
  { n: "02", title: "Make your work seen", text: "Build a considered portfolio, share your perspective and let your photographs find their audience.", icon: "▧" },
  { n: "03", title: "Create together", text: "Find collaborators, join photo walks and take part in exhibitions, workshops and community projects.", icon: "✳" },
];
const shotClasses = ["shot-tall", "", "", "shot-wide"];

export default function Home() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [shots, setShots] = useState(DEFAULT_HOMEPAGE_FEATURED_PHOTOS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/homepage/featured-photos", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return parseHomepageFeaturedPhotos(payload.data);
      })
      .then((photos) => {
        if (!cancelled && photos) setShots(photos);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) fetch("/api/notifications").then(async r => { if (r.ok) { const j = await r.json(); setNotices(Array.isArray(j.data) ? j.data : j.data?.items || []); } }).catch(() => {});
  }, [user]);

  const scrollTo = (label: string) => {
    const id = label.toLowerCase();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <section className="hero" id="discover">
        <div className="hero-grain"/>
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> THE ART OF SEEING · PSR</div>
          <h1>See beyond<br/>the <em>obvious.</em></h1>
          <p className="hero-lede">A community of curious eyes and creative minds. We capture moments, tell stories and find meaning in the light between them.</p>
          <div className="hero-ctas">
            <button className="button button-primary" onClick={() => scrollTo("Membership")}>
              Find your focus <span>↗</span>
            </button>
            <button className="button button-quiet" onClick={() => scrollTo("Community")}>
              Explore the society <span>↓</span>
            </button>
          </div>
          <div className="hero-meta"><span><b>01</b> / A CREATIVE COMMUNITY</span><span>RAJSHAHI · BANGLADESH</span></div>
        </div>
        <div className="hero-art" aria-label="Abstract photographic aperture artwork">
          <CameraIllustration size="lg" animate />
          <div className="art-caption"><span>FIG. 001</span><span>AN OPEN PERSPECTIVE</span></div>
          <div className="vertical-note">LIGHT · FRAME · STORY</div>
        </div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="scroll-line"/></div>
      </section>

      <section className="intro section-pad" id="community">
        <div className="section-kicker"><span>01 / THE SOCIETY</span><span>MORE THAN A CAMERA CLUB</span></div>
        <div className="intro-grid"><h2>We don&rsquo;t just<br/>take pictures.<br/><em>We see stories.</em></h2><div className="intro-copy"><p className="lead">Photography is a way of paying attention. PSR brings together people who believe every frame can hold a different point of view.</p><p>From first-time creators to seasoned photographers, this is a space to learn, experiment, collaborate and make work that means something.</p><button className="underlink" onClick={() => scrollTo("Membership")}>Become part of the story <span>↗</span></button></div></div>
        <div className="feature-grid">{features.map(f => <article className="feature" key={f.n}><div className="feature-top"><span>{f.n}</span><span className="feature-icon">{f.icon}</span></div><h3>{f.title}</h3><p>{f.text}</p></article>)}</div>
      </section>

      <section className="work-section section-pad" id="exhibitions">
        <div className="section-kicker"><span>02 / THE PERSPECTIVE</span><span>FRAMES THAT SPEAK</span></div>
        <div className="work-heading"><h2>Every frame,<br/><em>a point of view.</em></h2><p>A glimpse into the worlds that inspire us. Different eyes, different stories — one shared passion.</p></div>
        <div className="photo-grid">{shots.map((s,i) => <article className={`photo-card ${shotClasses[i]}`} key={`${s.title}-${i}`}><div className="photo-image"><img src={s.image} alt={s.title} loading="lazy" decoding="async"/><span className="photo-index">0{i+1}</span><span className="photo-arrow">↗</span></div><div className="photo-caption"><div><h3>{s.title}</h3><span>{s.type}</span></div></div></article>)}</div>
        <div className="gallery-note"><span>IMAGERY FOR INSPIRATION</span><span>MEMBER GALLERY · COMING INTO FOCUS</span></div>
      </section>

      <section className="membership-section section-pad" id="membership">
        <div className="membership-art"><BrandSymbol size={180} className="membership-brand-symbol"/><span className="membership-orbit"/></div>
        <div className="membership-content"><div className="section-kicker"><span>03 / YOUR NEXT CHAPTER</span><span>OPEN TO THE CURIOUS</span></div><h2>Find your<br/><em>people.</em></h2><p>Bring your curiosity. Bring your perspective. Whether you shoot on a phone or a full-frame camera, there&rsquo;s room for your story here.</p><Link href="/membership" className="button button-primary">Apply for membership <span>↗</span></Link><span className="membership-small">A GOOD EYE HAS NO ENTRY REQUIREMENT.</span></div>
      </section>

      <section className="events-section section-pad" id="events">
        <div className="section-kicker"><span>04 / WHAT&rsquo;S HAPPENING</span><span>MAKE SOMETHING HAPPEN</span></div>
        <div className="events-row"><div><h2>Out there,<br/><em>together.</em></h2><p>Photo walks, creative sessions, exhibitions and conversations. The best moments are often the ones we make together.</p></div><div className="event-placeholder"><span className="event-symbol">✳</span><div><span className="event-label">THE NEXT FRAME IS YOURS</span><h3>Something worth<br/>showing up for.</h3><p>Sign in to stay connected with society updates and member activities.</p>{user ? <span className="signed-in-label">YOU&rsquo;RE SIGNED IN · {notices.length} NOTIFICATIONS</span> : <button className="underlink" onClick={() => scrollTo("Membership")}>Join the community <span>↗</span></button>}</div></div></div>
      </section>

      <section className="closing section-pad"><div className="closing-inner"><BrandSymbol size={50} className="closing-brand-symbol"/><span className="eyebrow">YOUR VIEW. YOUR VOICE. YOUR COMMUNITY.</span><h2>Make room<br/>for <em>more.</em></h2><button className="button button-primary" onClick={() => scrollTo("Membership")}>Start your story <span>↗</span></button></div></section>
    </main>
  );
}
