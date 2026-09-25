"use client";

import { useRef, type ComponentProps } from "react";
import { Button } from "./button";

type ButtonProps = ComponentProps<typeof Button>;

// Small travel-themed icons (plane / bus / suitcase) that burst out of the
// button the instant it's pressed, purely decorative.
const TRAVEL_SVGS = [
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M480 192H365.71L260.61 8.88A16 16 0 0 0 248 0h-40a16 16 0 0 0-13.43 24.69L262.24 192H112l-38.34-51.13A16 16 0 0 0 60.86 134H20a16 16 0 0 0-14.73 22.28L43.89 256 5.27 355.72A16 16 0 0 0 20 378h40.86a16 16 0 0 0 12.8-6.87L112 320h150.24l-67.67 167.31A16 16 0 0 0 208 512h40a16 16 0 0 0 12.61-8.88L365.71 320H480a32 32 0 0 0 0-64z"/></svg>',
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M499.99 176h-59.51l-43.1-96.97C388.92 60.05 370.4 48 349.52 48H162.48c-20.88 0-39.4 12.05-47.86 31.03L71.52 176H12.01C5.38 176 0 181.38 0 188.01v68c0 6.63 5.38 12 12.01 12h20.67l7.63 118.25c.98 15.22 13.62 27.75 28.87 27.75h36.65c15.25 0 27.89-12.53 28.87-27.75L142.17 268h227.66l7.47 118.25c.98 15.22 13.62 27.75 28.87 27.75h36.65c15.25 0 27.89-12.53 28.87-27.75L479.32 268h20.67c6.63 0 12.01-5.37 12.01-12v-68c0-6.63-5.38-12.01-12.01-12.01zM112 224c-13.25 0-24-10.75-24-24s10.75-24 24-24 24 10.75 24 24-10.75 24-24 24zm288 0c-13.25 0-24-10.75-24-24s10.75-24 24-24 24 10.75 24 24-10.75 24-24 24z"/></svg>',
  '<svg viewBox="0 0 512 512" fill="currentColor"><path d="M128 96V64c0-17.7 14.3-32 32-32h192c17.7 0 32 14.3 32 32v32h48c26.5 0 48 21.5 48 48v288c0 26.5-21.5 48-48 48H80c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h48zm64-32v32h128V64H192zm-80 384h300V144H112v304z"/></svg>',
];
const PARTICLE_COLORS = ["rgb(76, 71, 205)", "#6366f1", "#818cf8", "#a5b4fc", "#4338ca"];

// Appends particles to <body> (position: fixed, viewport coordinates)
// rather than a local wrapper, so they keep animating even when the
// button's own subtree — e.g. a dialog closing right after submit —
// fades out or unmounts immediately after the click.
function burstTravelParticles(btn: HTMLElement) {
  const btnRect = btn.getBoundingClientRect();
  const centerX = btnRect.left + btnRect.width / 2;
  const centerY = btnRect.top + btnRect.height / 2;

  const count = 6;
  const maxDist = 130;
  const speed = 0.4;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.style.position = "fixed";
    p.style.left = "0";
    p.style.top = "0";
    p.style.pointerEvents = "none";
    p.style.width = "30px";
    p.style.height = "30px";
    p.style.zIndex = "9999";
    p.style.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    p.innerHTML = TRAVEL_SVGS[Math.floor(Math.random() * TRAVEL_SVGS.length)];
    document.body.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = maxDist * 0.7 + Math.random() * maxDist * 0.5;
    const duration = 1200 / speed + Math.random() * 500;
    const startX = centerX - 15;
    const startY = centerY - 15;
    const targetX = startX + Math.cos(angle) * dist;
    const targetY = startY + Math.sin(angle) * dist;

    p.animate(
      [
        { transform: `translate(${startX}px, ${startY}px) scale(0.1) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${targetX}px, ${targetY}px) scale(0.9) rotate(${(Math.random() - 0.5) * 320}deg)`,
          opacity: 0,
        },
      ],
      { duration, easing: "cubic-bezier(0.1, 0.82, 0.25, 1)" },
    ).onfinish = () => p.remove();
  }
}

/**
 * A Button that bursts small travel-icon particles from itself on click, in
 * addition to whatever the click normally does (e.g. submitting the form
 * it's in). Used for the primary "create" actions across the app.
 */
export function ParticleBurstButton({ onClick, ...props }: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick: NonNullable<ButtonProps["onClick"]> = (event) => {
    if (btnRef.current) burstTravelParticles(btnRef.current);
    onClick?.(event);
  };

  return <Button ref={btnRef} onClick={handleClick} {...props} />;
}
