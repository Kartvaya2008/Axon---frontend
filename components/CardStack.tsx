'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, registerGsap } from '@/lib/motion';
import { capabilities } from '@/lib/data';
import { SplitHeading } from './ui';

const POSITIONS = [14, 38, 62, 86];
const ROTATIONS = [-15, -7.5, 7.5, 15];

/**
 * Act IV — capabilities, as a pinned card fan.
 *
 * Direct port of "+54 Scroll Animation/44 — Lusion 3D cards": the section
 * pins for three viewport heights; in the first the cards fan out from a
 * stack, then each flips on its Y axis with a staggered offset to show the
 * detail on its back.
 *
 * Wrapped in `gsap.matchMedia` so the pin only ever exists on wide,
 * motion-tolerant viewports. Everywhere else the same content renders as a
 * plain, fully-readable grid — no pinning, no flipping, nothing to get stuck in.
 */
export default function CardStack() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();

    const mm = gsap.matchMedia();

    mm.add(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      () => {
        const cards = gsap.utils.toArray<HTMLElement>('.cap-card');
        if (!cards.length) return;

        const total = window.innerHeight * 3;

        ScrollTrigger.create({
          trigger: '.cap-stage',
          start: 'top top',
          end: `+=${total}`,
          pin: true,
          pinSpacing: true,
        });

        // Phase 1 — fan the stack out.
        cards.forEach((card, i) => {
          gsap.to(card, {
            left: `${POSITIONS[i]}%`,
            rotation: ROTATIONS[i],
            ease: 'none',
            scrollTrigger: {
              trigger: '.cap-stage',
              start: 'top top',
              end: `+=${window.innerHeight}`,
              scrub: 0.5,
            },
          });
        });

        // Phase 2 — flip each card, staggered.
        cards.forEach((card, i) => {
          const front = card.querySelector<HTMLElement>('.cap-front');
          const back = card.querySelector<HTMLElement>('.cap-back');
          if (!front || !back) return;

          const stagger = i * 0.05;
          const startAt = 1 / 3 + stagger;
          const endAt = 2 / 3 + stagger;

          ScrollTrigger.create({
            trigger: '.cap-stage',
            start: 'top top',
            end: `+=${total}`,
            scrub: 1,
            onUpdate: (self) => {
              const p = self.progress;
              if (p < startAt || p > endAt) return;
              const t = (p - startAt) / (1 / 3);
              front.style.transform = `rotateY(${-180 * t}deg)`;
              back.style.transform = `rotateY(${180 - 180 * t}deg)`;
              card.style.transform = `translate(-50%, -50%) rotate(${
                ROTATIONS[i] * (1 - t)
              }deg)`;
            },
          });
        });
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={root}
      id="stack"
      className="scroll-mt-24 border-t border-[var(--color-line)]"
    >
      <div className="shell py-20 md:pb-0 md:pt-32">
        <header className="mb-14">
          <p className="t-mono mb-4">Act IV — Capabilities</p>
          <SplitHeading text="How Axon works" className="t-h1" />
        </header>
      </div>

      {/* ---- Desktop: pinned fan ------------------------------------- */}
      <div className="cap-stage relative hidden h-[100svh] w-full overflow-hidden lg:block">
        {capabilities.map((c, i) => (
          <article
            key={c.index}
            className="cap-card absolute left-1/2 top-1/2 h-[380px] w-[280px] -translate-x-1/2 -translate-y-1/2"
            style={{ perspective: 1200 }}
          >
            <div className="relative h-full w-full">
              {/* Front */}
              <div
                className="cap-front absolute inset-0 flex flex-col justify-between border border-[var(--color-line)] bg-[var(--color-surface)] p-6 [backface-visibility:hidden]"
                style={{ transform: 'rotateY(0deg)' }}
              >
                <span className="t-mono text-[var(--color-amber)]">
                  {c.index}
                </span>
                <h3 className="t-h2">{c.title}</h3>
              </div>

              {/* Back */}
              <div
                className="cap-back absolute inset-0 flex flex-col justify-between border border-[var(--color-amber)]/40 bg-[var(--color-ink)] p-6 [backface-visibility:hidden]"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <p className="t-body text-[0.9rem] leading-relaxed text-[var(--color-bone)]">
                  {c.back}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <li
                      key={t}
                      className="border border-[var(--color-line)] px-2 py-0.5 font-mono text-[0.6rem] text-[var(--color-mute)]"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}

        <p className="t-mono absolute bottom-8 left-1/2 -translate-x-1/2">
          Keep scrolling
        </p>
      </div>

      {/* ---- Everywhere else: the same content, flat and readable ----- */}
      <div className="shell grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:hidden">
        {capabilities.map((c) => (
          <article
            key={c.index}
            className="flex flex-col gap-4 border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
          >
            <span className="t-mono text-[var(--color-amber)]">{c.index}</span>
            <h3 className="t-h2">{c.title}</h3>
            <p className="t-body text-[0.9rem]">{c.back}</p>
            <ul className="mt-auto flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <li
                  key={t}
                  className="border border-[var(--color-line)] px-2 py-0.5 font-mono text-[0.6rem] text-[var(--color-mute)]"
                >
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
