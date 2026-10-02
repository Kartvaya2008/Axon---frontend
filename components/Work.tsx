'use client';

import { useEffect, useRef } from 'react';
import { gsap, registerGsap, prefersReducedMotion } from '@/lib/motion';
import { projects, type Project } from '@/lib/data';
import { SplitHeading, Magnetic } from './ui';

/**
 * Act III — selected work.
 *
 * Cards assemble on scroll ("+10 Grid Animations/7 — layout formation"),
 * lean toward the cursor ("+24 Hover Effects/19 — magnetic cards"), and
 * reveal their accent wash on hover.
 *
 * Each card is a single <a>, so the whole surface is one keyboard stop and
 * one screen-reader announcement rather than a thicket of nested links.
 */
export default function Work() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.work-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 70, opacity: 0, rotateX: 8 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.1,
            ease: 'power3.out',
            // Alternating delay makes the two columns settle out of sync,
            // which reads as assembly rather than a single block sliding up.
            delay: (i % 2) * 0.12,
            scrollTrigger: { trigger: card, start: 'top 86%', once: true },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="work"
      className="scroll-mt-24 border-t border-[var(--color-line)] py-20 md:py-32"
    >
      <div className="shell">
        <header className="mb-14 flex flex-wrap items-end justify-between gap-6 md:mb-20">
          <div>
            <p className="t-mono mb-4">Act III — Features</p>
            <SplitHeading text="What Axon does" className="t-h1" />
          </div>
          <p className="t-mono">
            {String(projects.length).padStart(2, '0')} features
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {projects.map((p) => (
            <Card key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({ project: p }: { project: Project }) {
  // A private repo gets a non-interactive card. Linking it would hand every
  // visitor a GitHub 404, which looks worse than saying the source is closed.
  const linked = Boolean(p.href) && !p.private;
  const Tag = linked ? 'a' : 'article';

  const linkProps = linked
    ? {
        href: p.href,
        target: p.href?.startsWith('http') ? '_blank' : undefined,
        rel: p.href?.startsWith('http') ? 'noreferrer noopener' : undefined,
        'data-cursor': 'grow',
        'aria-label': `${p.title} — ${p.category}. ${p.summary} Opens on GitHub in a new tab.`,
      }
    : {};

  return (
    <Magnetic
      strength={0.08}
      className={p.featured ? 'md:col-span-1' : 'md:col-span-1'}
    >
      <Tag
        {...linkProps}
        className="work-card group relative flex h-full flex-col justify-between overflow-hidden border border-[var(--color-line)] bg-[var(--color-ink)] p-6 transition-colors duration-500 hover:border-[var(--color-mute)] md:p-8"
        style={{ perspective: 1000 }}
      >
        {/* Accent wash blooms from the corner on hover. Transform/opacity
            only, so it composites on the GPU and never triggers layout. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-30 motion-reduce:transition-none"
          style={{ background: p.accent }}
        />

        <div className="relative">
          <div className="mb-8 flex items-start justify-between gap-4">
            <span className="t-mono">{p.category}</span>
            <span className="t-mono">{p.year}</span>
          </div>

          <h3 className="t-h2 mb-4 transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none">
            {p.title}
          </h3>

          <p className="t-body mb-8 max-w-md text-pretty">{p.summary}</p>
        </div>

        <div className="relative">
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
            {p.metrics.map((m) => (
              <span key={m.label} className="flex items-baseline gap-2">
                <span
                  className="font-mono text-lg"
                  style={{ color: p.accent }}
                >
                  {m.value}
                </span>
                <span className="t-mono">{m.label}</span>
              </span>
            ))}
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Stack">
            {p.stack.map((s) => (
              <li
                key={s}
                className="border border-[var(--color-line)] px-2.5 py-1 font-mono text-[0.65rem] tracking-wide text-[var(--color-mute)]"
              >
                {s}
              </li>
            ))}
          </ul>

          {linked ? (
            <span className="mt-7 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-bone)]">
              See how it works
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-500 group-hover:translate-x-1.5 motion-reduce:transition-none"
              >
                ↗
              </span>
            </span>
          ) : (
            <span className="mt-7 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[var(--color-mute)]">
              <span
                aria-hidden="true"
                className="inline-block h-1 w-1 rounded-full bg-[var(--color-amber)]"
              />
              Included in Axon
            </span>
          )}
        </div>
      </Tag>
    </Magnetic>
  );
}
