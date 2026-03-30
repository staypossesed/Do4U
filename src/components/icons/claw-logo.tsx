"use client";

import { motion } from "framer-motion";

interface ClawLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function ClawLogo({ size = 32, animated = true, className }: ClawLogoProps) {
  const Wrapper = animated ? motion.div : "div";
  const animProps = animated
    ? {
        whileHover: { scale: 1.1, rotate: 5 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <Wrapper
      className={className}
      {...animProps}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="clawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b2b" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#clawGrad)" />
        {/* Claw marks */}
        <path
          d="M14 12 C14 12, 16 28, 18 34"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M22 10 C22 10, 24 28, 24 36"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 12 C30 12, 30 28, 30 34"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M36 16 C36 16, 34 28, 34 32"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </Wrapper>
  );
}
