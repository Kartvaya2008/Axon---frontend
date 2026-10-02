'use client';

import { useEffect, useRef } from 'react';
import { gsap, registerGsap, prefersReducedMotion } from '@/lib/motion';
import { identity, outro, socials, marqueeWords } from '@/lib/data';
import { Marquee, Magnetic, SplitHeading } from './ui';

/**
 * Act VI — the close.
 *
 * The headline scales up slightly as the section arrives ("+54 Scroll
 * Animation/10 — telescope zoom"), which lands the page on its loudest note.
 * The email is a real mailto link, not a copy-to-clipboard gimmick.
 */
export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.outro-zoom',
        { scale: 0.88, opacity: 0.4 },
        {
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'center 60%',
            scrub: 0.7,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={root}
      id="contact"
      className="scroll-mt-24 border-t border-[var(--color-line)]"
    >
      <Marquee words={marqueeWords} speed={45} />

      <div className="shell py-24 md:py-36">
        <p className="t-mono mb-6">{outro.eyebrow} — Contact</p>

        <div className="outro-zoom origin-left">
          <SplitHeading
            text={outro.headline}
            as="h2"
            className="t-display mb-10 max-w-5xl text-balance"
          />
        </div>

        <p className="t-body mb-14 max-w-xl text-pretty">{outro.body}</p>

        <Magnetic strength={0.3} className="inline-block">
          <a
            href="/app"
            data-cursor="grow"
            className="group inline-flex items-center gap-4 border border-[var(--color-bone)] px-7 py-4 transition-colors duration-500 hover:bg-[var(--color-bone)] hover:text-[var(--color-void)] motion-reduce:transition-none"
          >
            <span className="font-mono text-sm uppercase tracking-[0.18em]">
              {outro.cta}
            </span>
            <span
              aria-hidden="true"
              className="transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </a>
        </Magnetic>

        <p className="mt-8">
          <a
            href={`mailto:${identity.email}`}
            className="font-mono text-sm text-[var(--color-mute)] underline-offset-4 hover:text-[var(--color-amber)] hover:underline"
          >
            {identity.email}
          </a>
        </p>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-6 border-t border-[var(--color-line)] py-8">
        <p className="t-mono">
          © {new Date().getFullYear()} {identity.name}
        </p>

        <nav aria-label="Social links">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    s.href.startsWith('http')
                      ? 'noreferrer noopener'
                      : undefined
                  }
                  className="t-mono transition-colors duration-300 hover:text-[var(--color-amber)] motion-reduce:transition-none"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="t-mono">Built with Next.js, GSAP &amp; Three.js</p>
      </div>
    </footer>
  );
}
