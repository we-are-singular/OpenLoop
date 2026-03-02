interface LogoProps {
  size?: string;     // Tailwind size classes, e.g. 'w-10 h-10'
  invert?: boolean;  // true = white logo for dark backgrounds
  className?: string;
}

export default function Logo({ size = 'w-10 h-10', invert = false, className = '' }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="OpenLoop"
      className={`${size} ${invert ? 'brightness-0 invert' : ''} ${className}`.trim()}
    />
  );
}
