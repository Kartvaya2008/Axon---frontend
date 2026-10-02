'use client';

import { useEffect, useRef } from 'react';
import { gsap, registerGsap, prefersReducedMotion } from '@/lib/motion';
import { experience, metrics, stack } from '@/lib/data';
import { SplitHeading, Reveal, Counter } from './ui';

/**
 * Act V — the path, the numbers, and the toolkit.
 *
 * The timeline rail draws itself as the section scrolls
 * ("+11 SVG Animations/5 — on-scroll path animations"), scaled on the Y axis
 * so it stays on the compositor rather than re-laying out a height.
 */
export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.exp-rail',
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: 'top',
          ease: 'none',
          scrollTrigger: {
            trigger: '.exp-list',
            start: 'top 75%',
            end: 'bottom 75%',
            scrub: 0.5,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="experience"
      className="scroll-mt-24 border-t border-[var(--color-line)] py-20 md:py-32"
    >
      <div className="shell">
        {/* ---- Metrics ---------------------------------------------- */}
        <div className="mb-24 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {metrics.map((m) => (
            <Reveal key={m.label}>
              <p className="font-mono text-4xl leading-none text-[var(--color-bone)] md:text-6xl">
                <Counter value={m.value} suffix={m.suffix} />
              </p>
              <p className="t-mono mt-3 max-w-[16ch]">{m.label}</p>
            </Reveal>
          ))}
        </div>

        <hr className="rule mb-20" />

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          {/* ---- Timeline ------------------------------------------- */}
          <div>
            <p className="t-mono mb-4">Act V — The roadmap</p>
            <SplitHeading text="How Axon was built" className="t-h2 mb-14" />

            <ol className="exp-list relative pl-8">
              {/* Rail */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-[var(--color-line)]"
              />
              <span
                aria-hidden="true"
                className="exp-rail absolute left-0 top-2 h-[calc(100%-1rem)] w-px origin-top bg-[var(--color-amber)]"
              />

              {experience.map((e) => (
                <li key={`${e.org}-${e.period}`} className="relative pb-12 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="absolute -left-8 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--color-amber)]"
                  />
                  <Reveal y={24}>
                    <p className="t-mono mb-2">{e.period}</p>
                    <h3 className="text-xl text-[var(--color-bone)] md:text-2xl">
                      {e.role}
                      <span className="text-[var(--color-mute)]"> — {e.org}</span>
                    </h3>
                    <p className="t-body mt-3 max-w-md text-pretty">{e.detail}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          {/* ---- Toolkit -------------------------------------------- */}
          <div>
            <p className="t-mono mb-4">The technology</p>
            <SplitHeading text="What powers it" className="t-h2 mb-14" />

            <dl className="flex flex-col">
              {stack.map((group) => (
                <Reveal key={group.group} y={20}>
                  <div className="grid grid-cols-[7rem_1fr] gap-4 border-t border-[var(--color-line)] py-5">
                    <dt className="t-mono pt-1">{group.group}</dt>
                    <dd className="flex flex-wrap gap-x-4 gap-y-2">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="text-sm text-[var(--color-bone)] transition-colors duration-300 hover:text-[var(--color-amber)] motion-reduce:transition-none"
                        >
                          {item}
                        </span>
                      ))}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
