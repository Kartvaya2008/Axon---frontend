'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, registerGsap, prefersReducedMotion } from '@/lib/motion';
import { identity, nav, socials } from '@/lib/data';
import { Magnetic } from './ui';

/**
 * Header + full-screen overlay menu.
 *
 * Adapted from "+21 Navigation Menus/16 — Noir mode menu": a dark panel
 * wipes down over the page and the links stagger up out of masked rows.
 *
 * The visual is from the library; the focus trap, Escape handling, scroll
 * lock and aria wiring are added here — the demo had none of them, and a
 * menu you cannot escape with a keyboard is a bug, not a style.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* Open/close choreography */
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    registerGsap();

    const links = el.querySelectorAll('.nav-line > span');
    const meta = el.querySelectorAll('.nav-meta');

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: open ? 1 : 0, clipPath: 'none' });
      gsap.set([links, meta], { y: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      if (open) {
        gsap.set(el, { autoAlpha: 1, pointerEvents: 'auto' });
        gsap
          .timeline()
          .fromTo(
            el,
            { clipPath: 'inset(0 0 100% 0)' },
            { clipPath: 'inset(0 0 0% 0)', duration: 0.85, ease: 'power4.inOut' }
          )
          .fromTo(
            links,
            { y: '110%' },
            { y: '0%', duration: 0.75, stagger: 0.06, ease: 'power4.out' },
            '-=0.35'
          )
          .fromTo(
            meta,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 },
            '-=0.4'
          );
      } else {
        gsap
          .timeline({
            onComplete: () => gsap.set(el, { autoAlpha: 0, pointerEvents: 'none' }),
          })
          .to(links, { y: '-110%', duration: 0.4, stagger: 0.03, ease: 'power3.in' })
          .to(meta, { opacity: 0, duration: 0.25 }, 0)
          .to(
            el,
            { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power4.inOut' },
            '-=0.15'
          );
      }
    }, el);

    return () => ctx.revert();
  }, [open]);

  /* Scroll lock, Escape, and focus management */
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      // Trap focus inside the panel while it is open.
      const focusables = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    // Defer so the panel is interactive before we move focus into it.
    const t = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>('a[href]')?.focus();
    }, 120);

    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <>
      {/* Scrim. The header is mix-blend-difference so it is always legible,
          but without this, body copy scrolling underneath collides with the
          logo and menu button. Sits below the header, above the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[79] h-28 bg-gradient-to-b from-[var(--color-void)] via-[var(--color-void)]/80 to-transparent"
      />

      <header className="fixed inset-x-0 top-0 z-[80] mix-blend-difference">
        <div className="flex items-center justify-between px-[var(--gutter)] py-6">
          <a
            href="#hero"
            className="t-mono text-[0.75rem] font-semibold tracking-[0.25em] text-white"
          >
            {identity.initials}
            <span className="text-[var(--color-amber)]">.</span>
          </a>

          <span className="t-mono hidden text-white md:block">
            {identity.role}
          </span>

          <Magnetic strength={0.25}>
            <button
              ref={toggleRef}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              className="t-mono flex items-center gap-3 text-white"
            >
              <span className="relative flex h-3 w-6 flex-col justify-between">
                <span
                  className="block h-px w-full bg-white transition-transform duration-300"
                  style={{ transform: open ? 'translateY(5.5px) rotate(45deg)' : undefined }}
                />
                <span
                  className="block h-px w-full bg-white transition-transform duration-300"
                  style={{ transform: open ? 'translateY(-5.5px) rotate(-45deg)' : undefined }}
                />
              </span>
              {open ? 'Close' : 'Menu'}
            </button>
          </Magnetic>
        </div>
      </header>

      <div
        id="site-menu"
        ref={panel}
        aria-hidden={!open}
        // Belt and braces: GSAP's autoAlpha already sets visibility:hidden
        // when closed, but `inert` guarantees the links can never be tabbed
        // into mid-transition.
        inert={!open}
        className="pointer-events-none invisible fixed inset-0 z-[75] flex flex-col justify-between bg-[var(--color-ink)] px-[var(--gutter)] pb-10 pt-28"
      >
        <nav aria-label="Primary">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href} className="overflow-hidden border-b border-[var(--color-line)]">
                <span className="nav-line block overflow-hidden">
                  <span className="block">
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline gap-5 py-3 transition-colors hover:text-[var(--color-amber)] md:py-4"
                    >
                      <span className="t-mono w-8 shrink-0 text-[var(--color-mute)]">
                        {item.index}
                      </span>
                      <span className="t-h1">{item.label}</span>
                    </a>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="nav-meta">
            <p className="t-mono mb-2">Links</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={s.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    className="text-sm text-[var(--color-bone)] underline-offset-4 hover:text-[var(--color-amber)] hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="nav-meta t-mono max-w-xs text-right">
            {identity.location}
          </p>
        </div>
      </div>
    </>
  );
}
