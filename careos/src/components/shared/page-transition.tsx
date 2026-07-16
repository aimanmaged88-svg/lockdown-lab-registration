"use client";

import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

/** Wraps page content in the standard CareOS entrance transition. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}
