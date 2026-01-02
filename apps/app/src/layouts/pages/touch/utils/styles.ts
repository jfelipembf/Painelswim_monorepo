export const buildWaveBackground = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 600" preserveAspectRatio="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="40%" stop-color="#D6EBFF" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#BBDFFF" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <path d="M0,420 C180,360 360,460 540,420 C720,380 900,300 1080,340 C1260,380 1350,450 1440,420 L1440,600 L0,600 Z" fill="url(#g)"/>
  <path d="M0,480 C220,420 420,520 640,480 C860,440 1040,350 1220,400 C1340,435 1400,480 1440,470 L1440,600 L0,600 Z" fill="#EAF5FF" fill-opacity="0.8"/>
</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
