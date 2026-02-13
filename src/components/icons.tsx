import { type SVGProps } from 'react';

export function Badminton(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Shuttlecock */}
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v2" />
      <path d="M8 9c0 0 2 6 4 6s4-6 4-6" />
      <path d="M10 9l2 6" />
      <path d="M14 9l-2 6" />
      {/* Racket */}
      <ellipse cx="12" cy="17" rx="3.5" ry="2.5" />
      <line x1="12" y1="19.5" x2="12" y2="23" />
    </svg>
  );
}
