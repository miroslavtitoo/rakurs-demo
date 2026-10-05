import React from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

export default function Atmosphere() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32 });
  return <>
    <div className="ambient-light" aria-hidden="true"><i /><i /></div>
    {!reduced && <motion.div className="reading-progress" style={{ scaleX: progress }} aria-hidden="true" />}
  </>;
}
