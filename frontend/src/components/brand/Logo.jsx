function Logo({
  title,
  className = "",
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title && <title>{title}</title>}

      <path
        d="M232 128 A128 128 0 0 0 232 384"
        strokeWidth="33"
        strokeLinecap="butt"
      />

      <path
        d="M232 128 L232 384"
        strokeWidth="32"
        strokeLinecap="square"
      />

      <path
        d="M280 384 A128 128 0 0 0 280 128"
        strokeWidth="33"
        strokeLinecap="butt"
      />

      <path
        d="M280 128 L280 384"
        strokeWidth="32"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default Logo;