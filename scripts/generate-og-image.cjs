// Generate og-image.png (1200x630) using sharp
const sharp = require("sharp");

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066FF"/>
      <stop offset="100%" style="stop-color:#0040AA"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#60A5FA"/>
      <stop offset="100%" style="stop-color:#3B82F6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1050" cy="100" r="200" fill="white" opacity="0.05"/>
  <circle cx="150" cy="530" r="150" fill="white" opacity="0.05"/>
  <circle cx="900" cy="500" r="120" fill="white" opacity="0.03"/>

  <!-- Graduation cap icon -->
  <g transform="translate(100, 180)">
    <rect width="80" height="80" rx="16" fill="white" opacity="0.15"/>
    <g transform="translate(16, 16)">
      <path d="M24 12L2 22l10 5.5v7L24 40l12-5.5v-7L46 22z" fill="white" stroke="none"/>
      <path d="M12 27.5v7L24 40l12-5.5v-7" fill="none" stroke="white" stroke-width="2"/>
      <line x1="36" y1="22" x2="36" y2="34" stroke="white" stroke-width="2"/>
    </g>
  </g>

  <!-- Title -->
  <text x="200" y="215" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="white">
    School Smart
  </text>
  <text x="200" y="275" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold" fill="#93C5FD">
    Pakistan
  </text>

  <!-- Tagline -->
  <text x="100" y="350" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="white" opacity="0.85">
    Complete School Management System
  </text>

  <!-- Feature pills -->
  <g transform="translate(100, 400)">
    <rect x="0" y="0" width="160" height="40" rx="20" fill="white" opacity="0.15"/>
    <text x="80" y="26" font-family="Arial, sans-serif" font-size="15" fill="white" text-anchor="middle">Attendance</text>

    <rect x="180" y="0" width="150" height="40" rx="20" fill="white" opacity="0.15"/>
    <text x="255" y="26" font-family="Arial, sans-serif" font-size="15" fill="white" text-anchor="middle">Homework</text>

    <rect x="350" y="0" width="120" height="40" rx="20" fill="white" opacity="0.15"/>
    <text x="410" y="26" font-family="Arial, sans-serif" font-size="15" fill="white" text-anchor="middle">Grades</text>

    <rect x="490" y="0" width="110" height="40" rx="20" fill="white" opacity="0.15"/>
    <text x="545" y="26" font-family="Arial, sans-serif" font-size="15" fill="white" text-anchor="middle">Chat</text>

    <rect x="620" y="0" width="180" height="40" rx="20" fill="white" opacity="0.15"/>
    <text x="710" y="26" font-family="Arial, sans-serif" font-size="15" fill="white" text-anchor="middle">Notifications</text>
  </g>

  <!-- Bottom bar -->
  <rect x="0" y="590" width="1200" height="40" fill="black" opacity="0.2"/>
  <text x="100" y="617" font-family="Arial, sans-serif" font-size="16" fill="white" opacity="0.7">
    smart-school-pakistan.vercel.app
  </text>
  <text x="1100" y="617" font-family="Arial, sans-serif" font-size="16" fill="white" opacity="0.7" text-anchor="end">
    6 Roles • PWA • Dark Mode
  </text>
</svg>`;

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png()
  .toFile("public/og-image.png")
  .then(() => console.log("og-image.png created!"))
  .catch((err) => console.error(err));
