import { transform, useTransform, type MotionValue } from 'framer-motion';

// Comme useTransform(value, input, output), mais toujours calculé en JavaScript.
// Framer Motion 12 confie sinon certaines opacités au navigateur (ViewTimeline),
// qui se trompe de progression quand l'élément suivi contient du « sticky ».
export function useScrollRange<T>(value: MotionValue<number>, input: number[], output: T[]) {
  const map = transform(input, output);
  return useTransform(value, (v) => map(v));
}
