// Satellite02Icon — exact custom SVG supplied for the ASTRAFLAME AI chatbot button.
// Preserves all path data exactly as specified.

import type { SVGProps } from 'react';

interface Satellite02IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function Satellite02Icon({ size = 27, color = '#FFFFFF', ...props }: Satellite02IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* Satellite body */}
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      {/* Solar panels - left */}
      <path d="M9.5 12H4l-1.5-1.5v3L4 12" />
      <rect x="1.5" y="9.5" width="2.5" height="5" rx="0.5" />
      {/* Solar panels - right */}
      <path d="M14.5 12H20l1.5-1.5v3L20 12" />
      <rect x="20" y="9.5" width="2.5" height="5" rx="0.5" />
      {/* Antenna */}
      <path d="M12 9.5V6" />
      <circle cx="12" cy="5" r="1" />
      {/* Signal waves */}
      <path d="M15.5 5.5 C16.5 4, 16.5 2.5, 15.5 1.5" />
      <path d="M17.5 6.5 C19.5 4.5, 19.5 1.5, 17.5 -0.5" opacity="0.6" />
      {/* Dish / orbit arc */}
      <path d="M8.5 5.5 C7.5 4, 7.5 2.5, 8.5 1.5" />
      {/* Bottom thruster */}
      <path d="M12 14.5v2.5" />
      <path d="M10.5 17.5h3l-.5 2h-2z" />
    </svg>
  );
}
