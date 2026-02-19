export default function Logo({ className = 'w-8 h-8', ...props }) {
  return (
    <img
      src="/logo.svg"
      alt="Hostlr"
      className={className}
      {...props}
    />
  );
}
