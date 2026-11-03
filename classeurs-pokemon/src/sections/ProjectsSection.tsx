import { animate, motion, useScroll, type MotionValue } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useRef, useState } from 'react';
import FadeIn from '../components/FadeIn';
import OpenBinder, { OPEN_AT } from '../components/OpenBinder';
import { useScrollRange } from '../components/useScrollRange';
import { LiveProjectButton } from '../components/Buttons';
import { PRODUCTS, type Product } from '../data';

const IMAGE_RADIUS = 'rounded-[40px] sm:rounded-[50px] md:rounded-[60px]';

export default function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Bouton « Ouvrir le classeur » : on remonte au classeur fermé puis on fait défiler
  // la page tout seul jusqu'à ce qu'il soit ouvert.
  const openBinder = (index: number) => {
    setSelected(index);
    const track = trackRef.current;
    if (!track) return;
    const start = track.getBoundingClientRect().top + window.scrollY;
    const end = start + (track.offsetHeight - window.innerHeight) * OPEN_AT;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'auto' });
      return;
    }
    window.scrollTo({ top: start, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => {
      animate(start, end, {
        duration: 3.4,
        ease: 'easeInOut',
        onUpdate: (y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }),
      });
    });
  };

  return (
    <section
      id="produits"
      className="relative z-10 -mt-10 rounded-t-[40px] px-5 pb-10 pt-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 sm:pt-24 md:-mt-14 md:rounded-t-[60px] md:px-10 md:pt-32"
      style={{ background: '#0C0C0C' }}
    >
      <FadeIn
        as="h2"
        className="hero-heading mb-12 text-center font-black uppercase leading-none tracking-tight sm:mb-16 md:mb-20"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Produits
      </FadeIn>

      <div ref={trackRef} className="relative -mx-5 h-[320vh] motion-reduce:h-auto sm:-mx-8 md:-mx-10">
        <OpenBinder selected={selected} onSelect={setSelected} trackRef={trackRef} />
      </div>

      <div ref={containerRef} className="mx-auto mt-10 max-w-6xl">
        {PRODUCTS.map((product, i) => (
          <ProjectCard
            key={product.number}
            product={product}
            index={i}
            total={PRODUCTS.length}
            progress={scrollYProgress}
            onOpen={() => openBinder(i)}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  product,
  index,
  total,
  progress,
  onOpen,
}: {
  product: Product;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onOpen: () => void;
}) {
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const scale = useScrollRange(progress, [index / total, 1], [1, targetScale]);

  return (
    <div className="sticky top-24 h-[85vh] md:top-32">
      <motion.article
        style={{ scale, top: `${index * 28}px`, background: '#0C0C0C' }}
        className="relative origin-top rounded-[40px] border-2 border-[#D7E2EA] p-4 sm:rounded-[50px] sm:p-6 md:rounded-[60px] md:p-8"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-2 sm:mb-6 sm:px-3">
          <div className="flex min-w-0 items-end gap-4 sm:gap-6">
            <span
              className="hero-heading font-black leading-none [font-variant-numeric:tabular-nums]"
              style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
            >
              {product.number}
            </span>
            <div className="flex min-w-0 flex-col gap-1 pb-1 sm:pb-3">
              <span className="text-xs uppercase tracking-widest text-[#D7E2EA]/60 sm:text-sm">
                {product.category}
              </span>
              <h3
                className="font-medium uppercase leading-tight text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}
              >
                {product.name}
              </h3>
              {product.price && (
                <p className="flex items-baseline gap-2 text-[#D7E2EA]">
                  <span className="text-lg font-semibold sm:text-2xl">{product.price}</span>
                  {product.oldPrice && (
                    <s className="text-sm font-light opacity-50 sm:text-base">{product.oldPrice}</s>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-1 sm:pb-3">
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium uppercase tracking-widest text-[#D7E2EA] underline-offset-[6px] transition-opacity duration-200 hover:underline sm:text-base"
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              Ouvrir le classeur
            </button>
            <LiveProjectButton
              href={product.url}
              label={product.price ? 'Voir le produit' : 'Voir le prix'}
            />
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4">
          <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
            <img
              src={product.images.top}
              alt={`${product.name} : couverture`}
              loading="lazy"
              className={`w-full object-cover ${IMAGE_RADIUS}`}
              style={{ height: 'min(clamp(130px, 16vw, 230px), 22vh)' }}
            />
            <img
              src={product.images.bottom}
              alt={`${product.name} : page avec cartes rangées`}
              loading="lazy"
              className={`w-full object-cover ${IMAGE_RADIUS}`}
              style={{ height: 'min(clamp(160px, 22vw, 340px), 32vh)' }}
            />
          </div>
          <div className="w-[60%]">
            <img
              src={product.images.tall}
              alt={`${product.name} ouvert, cartes rangées dans les pochettes`}
              loading="lazy"
              className={`h-full w-full object-cover ${IMAGE_RADIUS}`}
            />
          </div>
        </div>
      </motion.article>
    </div>
  );
}
