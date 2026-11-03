import { useEffect, useRef } from 'react';
import { MARQUEE_IMAGES } from '../data';

const ROW_1 = MARQUEE_IMAGES.slice(0, 11);
const ROW_2 = MARQUEE_IMAGES.slice(11);
const GAP = 12; // gap-3

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const row1 = row1Ref.current;
      const row2 = row2Ref.current;
      if (!section || !row1 || !row2) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;

      // Chaque ligne contient 3 copies des images : on démarre sur la copie du milieu
      // pour qu'il n'y ait jamais de vide sur les côtés.
      const set1 = (row1.scrollWidth + GAP) / 3;
      const set2 = (row2.scrollWidth + GAP) / 3;

      row1.style.transform = `translate3d(${offset - 200 - set1}px, 0, 0)`;
      row2.style.transform = `translate3d(${-(offset - 200) - set2}px, 0, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Aperçu des classeurs et des cartes"
      className="flex flex-col gap-3 pb-10 pt-24 sm:pt-32 md:pt-40"
      style={{ background: '#0C0C0C' }}
    >
      <Row images={ROW_1} rowRef={row1Ref} />
      <Row images={ROW_2} rowRef={row2Ref} />
    </section>
  );
}

function Row({ images, rowRef }: { images: string[]; rowRef: React.RefObject<HTMLDivElement> }) {
  const tripled = [...images, ...images, ...images];
  return (
    <div ref={rowRef} className="flex w-max gap-3" style={{ willChange: 'transform' }}>
      {tripled.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-[193px] w-[300px] shrink-0 rounded-2xl object-cover sm:h-[270px] sm:w-[420px]"
        />
      ))}
    </div>
  );
}
