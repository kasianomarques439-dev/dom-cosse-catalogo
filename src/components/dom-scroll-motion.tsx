'use client';

import { useEffect } from 'react';

const REVEAL_SELECTOR = [
  '.dc-home-section > .dc-eyebrow',
  '.dc-home-section > h1',
  '.dc-home-section > h2',
  '.dc-home-section > .dc-section-intro',
  '.dc-home-section > p:not(.dc-eyebrow)',
  '.dc-feature-card',
  '.dc-differentials article',
  '.dc-education-grid article',
  '.dc-wholesale-layout > *',
].join(',');

export default function DomScrollMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const home = document.querySelector<HTMLElement>('.dc-home');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!home || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    const elements = [...home.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)];
    const images = [...home.querySelectorAll<HTMLElement>('.dc-feature-image')];
    const isInViewport = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    elements.forEach((element) => {
      element.dataset.dcReveal = '';
      if (isInViewport(element)) element.dataset.dcVisible = '';
    });
    images.forEach((element) => { element.dataset.dcDepth = ''; });
    root.dataset.dcScrollMotion = 'ready';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) (target as HTMLElement).dataset.dcVisible = '';
        else delete (target as HTMLElement).dataset.dcVisible;
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      delete root.dataset.dcScrollMotion;
      elements.forEach((element) => {
        delete element.dataset.dcReveal;
        delete element.dataset.dcVisible;
      });
      images.forEach((element) => { delete element.dataset.dcDepth; });
    };
  }, []);

  return null;
}
