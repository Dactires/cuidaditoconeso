import type { SVGProps } from "react";

export function BombIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v4" />
      <path d="m16.2 3.8 2.3 2.3" />
      <path d="M20 12h-4" />
      <path d="m16.2 20.2-2.3-2.3" />
      <path d="M12 20v-4" />
      <path d="m3.8 16.2 2.3-2.3" />
      <path d="M4 12h4" />
      <path d="m3.8 3.8 2.3 2.3" />
    </svg>
  );
}
