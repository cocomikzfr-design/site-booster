import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties, ElementType, ReactNode } from 'react';

type FadeInProps = {
  as?: ElementType;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

// motion.create() est appelé une seule fois par type de balise.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<ElementType, any>();
function getMotion(tag: ElementType) {
  if (!cache.has(tag)) cache.set(tag, motion.create(tag as never));
  return cache.get(tag);
}

export default function FadeIn({
  as = 'div',
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  className,
  style,
  children,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const Tag = getMotion(as);

  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  );
}
