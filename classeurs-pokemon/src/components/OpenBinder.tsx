import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ChevronsDown } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { LiveProjectButton } from './Buttons';
import { useScrollRange } from './useScrollRange';
import { CARD_ART, CARD_FRAMES, POKEMON, PRODUCTS, TYPE_COLORS, TYPE_LABELS, type BinderLook } from '../data';

// Étapes de l'animation (progression du scroll de 0 à 1) :
// 0.00 → 0.12 le classeur arrive
// 0.08 → 0.25 la tirette descend : on dézippe
// 0.25 → 0.68 la couverture s'ouvre et le classeur se pose à plat
// 0.60 → 0.90 les cartes s'allument une par une
// 0.78 → 0.92 le nom et le prix apparaissent
export const OPEN_AT = 0.95;

type Size = { W: number; H: number; closedScale: number };

function computeSize(): Size {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const W = Math.round(Math.max(150, Math.min(vw * 0.44, (vh - 300) * 0.74, 420)));
  const H = Math.round(W / 0.74);
  const closedScale = Math.max(1, Math.min(1.45, (vw * 0.62) / W, (vh - 300) / H));
  return { W, H, closedScale };
}

function useBinderSize() {
  const [size, setSize] = useState<Size>(() =>
    typeof window === 'undefined' ? { W: 380, H: 514, closedScale: 1 } : computeSize(),
  );
  useEffect(() => {
    const onResize = () => setSize(computeSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

type OpenBinderProps = {
  selected: number;
  onSelect: (index: number) => void;
  trackRef: RefObject<HTMLDivElement>;
};

export default function OpenBinder({ selected, onSelect, trackRef }: OpenBinderProps) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const opened = useMotionValue(1);
  const p = reduce ? opened : scrollYProgress;

  const size = useBinderSize();
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const { W, H, closedScale } = size;
  const t = Math.round(W * 0.07); // épaisseur du classeur
  const tw = W * 0.052; // largeur de la fermeture éclair

  const product = PRODUCTS[selected];
  const look = product.binder;

  // Caméra
  const scale = useTransform(p, (v) => {
    const s = sizeRef.current.closedScale;
    if (v < 0.12) return s * (0.86 + (v / 0.12) * 0.14);
    if (v < 0.25) return s;
    if (v < 0.68) return s + (1 - s) * ease((v - 0.25) / 0.43);
    return 1;
  });
  const rotateX = useScrollRange(p, [0.25, 0.68], [6, 22]);
  const rotateY = useScrollRange(p, [0, 0.25, 0.68], [34, 24, 0]);
  const rotateZ = useScrollRange(p, [0.25, 0.68], [-3, 0]);
  const x = useScrollRange(p, [0.25, 0.68], ['-50%', '0%']);
  const originX = useScrollRange(p, [0.25, 0.68], [0.5, 0]);

  // Couverture et tirette
  const coverRotate = useScrollRange(p, [0.25, 0.68], [0, -180]);
  // Une fois ouverte, la couverture se pose à la même hauteur que la page de droite.
  const coverZ = useTransform(p, (v) => {
    const thickness = Math.round(sizeRef.current.W * 0.07);
    const k = Math.min(1, Math.max(0, (v - 0.45) / 0.23));
    return thickness * (1 - k);
  });
  const pullTop = useScrollRange(p, [0.08, 0.25], ['12%', '88%']);

  // Textes
  const hintOpacity = useScrollRange(p, [0, 0.14], [1, 0]);
  const infoOpacity = useScrollRange(p, [0.78, 0.92], [0, 1]);
  const infoY = useScrollRange(p, [0.78, 0.92], [16, 0]);

  const stageH = Math.round(H * closedScale);
  const vars = {
    '--W': `${W}px`,
    '--r': `${W * 0.07}px`,
    '--tw': `${tw}px`,
    '--page': look.page,
  } as CSSProperties;

  return (
    <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-5 overflow-hidden sm:gap-6">
      <div
        role="group"
        aria-label="Choisir le classeur à ouvrir"
        className="relative z-20 flex gap-1 rounded-full border border-[#D7E2EA]/20 p-1"
      >
        {PRODUCTS.map((item, i) => (
          <button
            key={item.number}
            type="button"
            aria-pressed={i === selected}
            onClick={() => onSelect(i)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-200 sm:px-6 sm:text-sm ${
              i === selected ? 'bg-[#D7E2EA] text-[#0C0C0C]' : 'text-[#D7E2EA] hover:bg-[#D7E2EA]/10'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="relative" style={{ width: W * 2, height: stageH, perspective: W * 6 }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background] duration-500"
          style={{
            width: W * 2.6,
            height: H * 1.6,
            background: `radial-gradient(closest-side, ${look.glow}, transparent)`,
          }}
        />

        <motion.div
          role="img"
          aria-label={`${product.name} qui s'ouvre et montre ses pages de cartes`}
          className="absolute"
          style={{
            ...vars,
            left: '50%',
            top: (stageH - H) / 2,
            width: W,
            height: H,
            x,
            scale,
            rotateX,
            rotateY,
            rotateZ,
            originX,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Page de droite (fond du classeur) */}
          <div className="bd-half bd-right absolute inset-0" style={{ background: look.shell }}>
            <Page ids={look.right} look={look} progress={p} offset={9} />
          </div>

          {/* Dos */}
          <div
            className="absolute top-0"
            style={{
              left: -t / 2,
              width: t,
              height: H,
              borderRadius: t / 2,
              background: look.spine,
              transform: `translateZ(${t / 2}px) rotateY(-90deg)`,
            }}
          />

          {/* Couverture qui pivote sur le dos */}
          <motion.div
            className="absolute inset-0"
            style={{ z: coverZ, rotateY: coverRotate, originX: 0, transformStyle: 'preserve-3d' }}
          >
            <div className="bd-face">
              <img src={look.cover} alt="" draggable={false} className="h-full w-full select-none" />
              <motion.div className="bd-pull" style={{ top: pullTop }} />
            </div>
            <div
              className="bd-face bd-half bd-left"
              style={{ background: look.shell, transform: 'rotateY(180deg)' }}
            >
              <Page ids={look.left} look={look} progress={p} offset={0} />
            </div>
          </motion.div>
        </motion.div>

        {!reduce && (
          <motion.p
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 left-1/2 flex -translate-x-1/2 translate-y-full items-center gap-2 whitespace-nowrap text-xs uppercase tracking-widest text-[#D7E2EA]/70 sm:text-sm"
            style={{ opacity: hintOpacity }}
          >
            <ChevronsDown className="h-4 w-4" aria-hidden="true" />
            Fais défiler pour ouvrir
          </motion.p>
        )}
      </div>

      <motion.div
        className="relative z-20 flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-6"
        style={{ opacity: infoOpacity, y: infoY }}
      >
        <div className="flex flex-col items-center sm:items-end">
          <span className="text-xs uppercase tracking-widest text-[#D7E2EA]/60">{product.category}</span>
          <span className="flex items-baseline gap-2 text-[#D7E2EA]">
            <span className="font-medium uppercase" style={{ fontSize: 'clamp(1rem, 2vw, 1.6rem)' }}>
              {product.name}
            </span>
            {product.price && <span className="text-base font-semibold sm:text-xl">{product.price}</span>}
          </span>
        </div>
        <LiveProjectButton href={product.url} label={product.price ? 'Voir le produit' : 'Voir le prix'} />
      </motion.div>
    </div>
  );
}

function Page({
  ids,
  look,
  progress,
  offset,
}: {
  ids: (number | null)[];
  look: BinderLook;
  progress: MotionValue<number>;
  offset: number;
}) {
  return (
    <div className="bd-page">
      {ids.map((id, i) => (
        <div key={i} className="pk-pocket">
          {id !== null && (
            <PocketCard id={id} frame={look.frame} holo={(offset + i) % 4 === 0} order={offset + i} progress={progress} />
          )}
        </div>
      ))}
    </div>
  );
}

function PocketCard({
  id,
  frame,
  holo,
  order,
  progress,
}: {
  id: number;
  frame: BinderLook['frame'];
  holo: boolean;
  order: number;
  progress: MotionValue<number>;
}) {
  const start = 0.6 + (order / 18) * 0.22;
  const opacity = useScrollRange(progress, [start, start + 0.08], [0.35, 1]);
  const scale = useScrollRange(progress, [start, start + 0.04, start + 0.08], [0.94, 1.04, 1]);
  const info = POKEMON[id];
  const [c1, c2, c3] = TYPE_COLORS[info.type];

  return (
    <motion.div
      className="pk-card"
      style={
        {
          opacity,
          scale,
          '--frame': CARD_FRAMES[frame],
          '--c1': c1,
          '--c2': c2,
          '--c3': c3,
        } as unknown as CSSProperties
      }
    >
      <div className="pk-win">
        {holo && <div className="pk-holo" />}
        <img className="pk-art" src={CARD_ART(id)} alt="" loading="lazy" draggable={false} />
        <div className="pk-type">{TYPE_LABELS[info.type]}</div>
        <div className="pk-bar">
          <span className="pk-name">{info.name}</span>
          <span className="pk-no">N° {String(id).padStart(3, '0')}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ease(v: number) {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}
