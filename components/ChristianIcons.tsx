type IconProps = {
  className?: string;
  size?: number;
};

export function CrossIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2v20M7 7h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IchthysIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 12c4-6 12-6 16 0-4 6-12 6-16 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="15.5" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function DoveIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 14c2-4 6-6 10-5 1 3-1 6-4 8-3 2-7 1-9-2 2-1 3-1 3-1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M8 11l-2-2M8 11l-1-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function OliveBranchIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 18c4-8 10-12 16-14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <ellipse cx="8" cy="12" rx="1.2" ry="2" fill="currentColor" transform="rotate(-35 8 12)" />
      <ellipse cx="11" cy="9.5" rx="1.2" ry="2" fill="currentColor" transform="rotate(-25 11 9.5)" />
      <ellipse cx="14.5" cy="7.5" rx="1.2" ry="2" fill="currentColor" transform="rotate(-15 14.5 7.5)" />
    </svg>
  );
}
