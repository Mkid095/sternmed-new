/**
 * Homepage hero carousel.
 *
 * What this fixes
 * ---------------
 * 1. **The overlay covered the flyer.** The active slide sat at `z-10` while a
 *    text overlay had no z-index at all, so the banner painted straight over
 *    the heading, tagline and Shop Now button on every screen size.
 *
 *    The overlay is gone entirely now. These flyers already carry their own
 *    headline ("WELCOME TO STERNMED AFRIKA LTD."), and stacking the site's h1
 *    and a Shop Now button on top of that produced two overlapping headlines.
 *    The flyer IS the message, and the image itself is the link.
 *
 * 2. **Banners overflowed the viewport.** The hero was a fixed height per
 *    breakpoint (`h-[280px] sm:h-[400px] md:h-[500px]`) with `object-cover`. A
 *    1900x500 flyer — 3.8:1 — dropped into a 375x280 box (1.34:1) had to scale
 *    1.23x to cover, throwing away half its width: on a phone the word
 *    "STERNMED" ran off the left edge of the screen.
 *
 * 3. **The image is the link.** A slide with a `linkTarget` is wrapped in a
 *    button covering the whole image and navigates on click — there is no
 *    separate call-to-action to aim at. A slide without one is decoration, and
 *    is not focusable, so a screen reader is never offered a dead link.
 *
 * How it fits
 * -----------
 * On a phone the slide box adopts the flyer's OWN aspect ratio, read from the
 * loaded image and published as the `--slide-ratio` custom property. The box is
 * then exactly the right shape at any width, so `object-cover` crops nothing
 * and nothing overflows. There is no guessed ratio to be wrong on a phone.
 *
 * From `sm` up the box switches to fixed ratios close enough to a standard
 * flyer that cover only trims a little vertical space, so it still fills edge
 * to edge.
 *
 * @module HeroCarousel
 */

import { useEffect, useState, type CSSProperties, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../../../types';

interface HeroCarouselProps {
  banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratio, setRatio] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // A banner deleted or parked mid-session must not leave the index past the end.
  useEffect(() => {
    setCurrentIndex((prev) => (banners.length === 0 ? 0 : Math.min(prev, banners.length - 1)));
  }, [banners.length]);

  if (banners.length === 0) return null;

  const hasMultiple = banners.length > 1;

  const goTo = (index: number) => setCurrentIndex(index);
  const next = () => goTo((currentIndex + 1) % banners.length);
  const prev = () => goTo((currentIndex - 1 + banners.length) % banners.length);

  /** Each banner can differ in shape, so the box follows whichever is showing. */
  const measure = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) setRatio(`${naturalWidth} / ${naturalHeight}`);
  };

  // Falls back to the 1900x500 guidance until an image reports its own size.
  const slideStyle = { '--slide-ratio': ratio ?? '1900 / 500' } as CSSProperties;

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900"
      aria-roledescription="carousel"
      aria-label="Featured banners"
    >
      {/*
        `aspect-[var(--slide-ratio)]` takes the flyer's own shape on a phone;
        `sm:` and up replace it with ratios a standard flyer nearly fills.
      */}
      <div
        className="relative aspect-[var(--slide-ratio)] sm:aspect-[16/9] md:h-[420px] md:aspect-auto lg:h-[500px]"
        style={slideStyle}
      >
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          const target = banner.linkTarget;

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={!isActive}
            >
              {/* The whole slide is the click target when it has a link. */}
              {target ? (
                <button
                  type="button"
                  onClick={() => navigate(target)}
                  className="absolute inset-0 block w-full cursor-pointer"
                  tabIndex={isActive ? 0 : -1}
                  aria-label={describeTarget(target)}
                >
                  <SlideImage banner={banner} onLoad={measure} />
                </button>
              ) : (
                <SlideImage banner={banner} onLoad={measure} />
              )}
            </div>
          );
        })}

        {/* Carousel controls, above the slides so they stay clickable. */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 z-30 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors hover:bg-white/45 sm:left-4"
              aria-label="Previous banner"
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 z-30 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors hover:bg-white/45 sm:right-4"
              aria-label="Next banner"
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>

            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2 sm:bottom-4">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === currentIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/85'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </section>
  );
}

/**
 * One banner image.
 *
 * `w-full` inside a box that already matches the image's own ratio is what
 * keeps an oversized flyer from pushing past the slide — the box constrains it,
 * not the viewport.
 */
function SlideImage({
  banner,
  onLoad,
}: {
  banner: Banner;
  onLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
}) {
  return (
    <img
      src={banner.imageUrl}
      alt=""
      className="h-full w-full object-cover"
      onLoad={onLoad}
      loading={banner.order === 1 ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

/** Turns '/product/<uuid>' into something a screen reader can read aloud. */
function describeTarget(target: string): string {
  if (target.startsWith('/product/')) return 'Go to this product';
  if (target.startsWith('/category/')) return 'Go to this category';
  return 'Go to this banner destination';
}