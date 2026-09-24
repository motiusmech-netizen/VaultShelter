/* Hand-authored SVG icon set (24x24). Used by the DOM UI and rasterized for the canvas. */

const S = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`;

const OL = 'stroke="#1b1410" stroke-width="1.1" stroke-linejoin="round"';

export const ICONS: Record<string, string> = {
  power: S(
    `<defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff39a"/><stop offset="1" stop-color="#ffb21e"/></linearGradient></defs>
    <path d="M13.8 1.8 4.6 13.6h6l-1.6 8.6 9.6-12.4h-6.2z" fill="url(#gp)" ${OL}/>
    <path d="M12.6 4.6 7.4 11.6h3.2" fill="none" stroke="#fffbe0" stroke-width="1" stroke-linecap="round" opacity=".8"/>`,
  ),
  food: S(
    `<defs><linearGradient id="gf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc07a"/><stop offset="1" stop-color="#d9642a"/></linearGradient></defs>
    <path d="M14.8 3.2c3.6 0 6.3 2.8 6.1 6.3-.2 3.3-3 5.6-6.2 5.6-.9 0-1.6.2-2.2.8l-3.1 3.1" fill="none"/>
    <path d="M9 15.3 5.6 18.7a2 2 0 1 1-2.2 2.2 2 2 0 1 1 1.6-3.5l3.3-3.3z" fill="#f4ead8" ${OL}/>
    <path d="M14.6 2.8c3.9 0 6.8 3 6.6 6.8-.2 3.6-3.2 6.1-6.8 6.1-1.4 0-2.6.5-3.6 1.5l-1.6-1.6c1-1 1.5-2.2 1.5-3.6-.1-5 1.8-9.2 3.9-9.2z" fill="url(#gf)" ${OL}/>
    <path d="M15 5.4c1.9.2 3.3 1.7 3.4 3.6" fill="none" stroke="#ffe3bf" stroke-width="1.2" stroke-linecap="round"/>`,
  ),
  water: S(
    `<defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ff0ff"/><stop offset="1" stop-color="#1c8fd0"/></linearGradient></defs>
    <path d="M12 1.8C9 6.4 5.2 10.4 5.2 14.8a6.8 6.8 0 0 0 13.6 0C18.8 10.4 15 6.4 12 1.8z" fill="url(#gw)" ${OL}/>
    <path d="M8.6 14.6c.1 1.8 1.2 3.2 2.8 3.7" fill="none" stroke="#e6fdff" stroke-width="1.4" stroke-linecap="round"/>`,
  ),
  nuts: S(
    `<defs><linearGradient id="gn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#e8b43a"/><stop offset="1" stop-color="#9a6a14"/></linearGradient></defs>
    <path d="M12 1.6 21 6.8v10.4L12 22.4 3 17.2V6.8z" fill="url(#gn)" ${OL}/>
    <circle cx="12" cy="12" r="4.2" fill="#3a2a0e" stroke="#6a4a10" stroke-width="1"/>
    <path d="M12 3.8 19 7.8" stroke="#fff8d8" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`,
  ),
  iso: S(
    `<defs><linearGradient id="gi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2ffcc"/><stop offset=".45" stop-color="#6aff8c"/><stop offset="1" stop-color="#138a4a"/></linearGradient></defs>
    <path d="M12 1.5 18.5 7 16.5 20 12 22.5 7.5 20 5.5 7z" fill="url(#gi)" ${OL}/>
    <path d="M12 1.5V22.5M5.5 7 12 11.5 18.5 7" fill="none" stroke="#0e5a30" stroke-width=".8" opacity=".7"/>
    <path d="M8 8.2 9 16" stroke="#f4fff0" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`,
  ),
  medkit: S(
    `<rect x="3" y="6" width="18" height="14" rx="3" fill="#f7f3ee" ${OL}/>
    <path d="M9 6V4.2h6V6" fill="none" stroke="#1b1410" stroke-width="1.2"/>
    <path d="M10.3 9h3.4v3h3v3.4h-3v3h-3.4v-3h-3V12h3z" fill="#e8453c" stroke="#8a1a14" stroke-width=".6"/>`,
  ),
  antirad: S(
    `<path d="M9 2.5h6v3l2.5 4v10.2A2.3 2.3 0 0 1 15.2 22H8.8a2.3 2.3 0 0 1-2.3-2.3V9.5L9 5.5z" fill="#fdf6e8" ${OL}/>
    <path d="M6.6 12h10.8v7.7a2.3 2.3 0 0 1-2.3 2.3H8.9a2.3 2.3 0 0 1-2.3-2.3z" fill="#ff9a3d"/>
    <circle cx="12" cy="16.5" r="3" fill="#2a1a0e"/><circle cx="12" cy="16.5" r=".9" fill="#ff9a3d"/>
    <path d="M12 16.5 13.9 14.6M12 16.5l-1.9-1.9M12 16.5v2.6" stroke="#ff9a3d" stroke-width=".9"/>`,
  ),
  dawn: S(
    `<defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#ffb02e"/></linearGradient></defs>
    <path d="M4 17a8 8 0 0 1 16 0z" fill="url(#gd)" ${OL}/>
    <path d="M12 3.5v3M4.2 7.4l2 2M19.8 7.4l-2 2M1.5 13.5h3M19.5 13.5h3" stroke="#ffcf4a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M2 20h20" stroke="#6fbf5a" stroke-width="2.4" stroke-linecap="round"/>`,
  ),
  dweller: S(
    `<circle cx="12" cy="7.2" r="4.4" fill="#f1c6a8" ${OL}/>
    <path d="M7.6 6.2c.6-2.4 2.4-3.6 4.4-3.6s3.8 1.2 4.4 3.6c-1.6-.8-3-1-4.4-1s-2.8.2-4.4 1z" fill="#5a3a22"/>
    <path d="M4.5 21.5c.4-4.6 3.4-7.5 7.5-7.5s7.1 2.9 7.5 7.5z" fill="#2b7fb8" ${OL}/>
    <path d="M12 14v7.5" stroke="#ffb02e" stroke-width="1.6"/>`,
  ),
  happy: S(
    `<circle cx="12" cy="12" r="9.5" fill="#ffd23d" ${OL}/>
    <circle cx="8.8" cy="10" r="1.3" fill="#1b1410"/><circle cx="15.2" cy="10" r="1.3" fill="#1b1410"/>
    <path d="M7.4 13.6c1 2.3 2.7 3.4 4.6 3.4s3.6-1.1 4.6-3.4" fill="none" stroke="#1b1410" stroke-width="1.5" stroke-linecap="round"/>`,
  ),
  sad: S(
    `<circle cx="12" cy="12" r="9.5" fill="#9fb4c7" ${OL}/>
    <circle cx="8.8" cy="10" r="1.3" fill="#1b1410"/><circle cx="15.2" cy="10" r="1.3" fill="#1b1410"/>
    <path d="M7.8 17c1-1.8 2.5-2.6 4.2-2.6s3.2.8 4.2 2.6" fill="none" stroke="#1b1410" stroke-width="1.5" stroke-linecap="round"/>`,
  ),
  hammer: S(
    `<path d="M13.4 9.6 4 19a1.9 1.9 0 0 0 2.7 2.7l9.4-9.4z" fill="#c98a4a" ${OL}/>
    <path d="M10.8 5.2 14.6 1.8l7.4 7.4-2.4 2.4-2.2-2.2-2 2-3.4-3.4 2-2z" fill="#9aa7b0" ${OL}/>
    <path d="M14.6 3.4l5.8 5.8" stroke="#e6edf2" stroke-width="1" stroke-linecap="round"/>`,
  ),
  people: S(
    `<circle cx="8" cy="8" r="3.4" fill="#f1c6a8" ${OL}/><path d="M2.4 19.8c.3-3.8 2.5-6 5.6-6s5.3 2.2 5.6 6z" fill="#2b7fb8" ${OL}/>
    <circle cx="16.4" cy="7.2" r="3.4" fill="#d49a6a" ${OL}/><path d="M11.4 19.8c.3-4.2 2.4-6.8 5-6.8 3.1 0 5.3 2.5 5.6 6.8z" fill="#ff7cc0" ${OL}/>`,
  ),
  storage: S(
    `<path d="M3 8.5 12 4l9 4.5v10L12 23l-9-4.5z" fill="#c98a4a" ${OL}/>
    <path d="M3 8.5 12 13l9-4.5M12 13v10" fill="none" stroke="#1b1410" stroke-width="1.1"/>
    <path d="m7.5 6.3 9 4.5v3.6" fill="none" stroke="#f4e0b0" stroke-width="1.6"/>`,
  ),
  wasteland: S(
    `<path d="M1.5 20.5 8 9l3.4 5.4L14.5 9l8 11.5z" fill="#c9905a" ${OL}/>
    <path d="m8 9 1.8 3.2-1.6-.6-1.8 1.2z" fill="#f4e0c0"/>
    <circle cx="18.5" cy="5" r="2.6" fill="#ffd23d" ${OL}/>
    <path d="M1.5 20.5h21" stroke="#1b1410" stroke-width="1.1"/>`,
  ),
  objectives: S(
    `<rect x="4" y="3.5" width="16" height="19" rx="2.4" fill="#f4ead8" ${OL}/>
    <rect x="8.4" y="1.8" width="7.2" height="3.6" rx="1.2" fill="#9aa7b0" ${OL}/>
    <path d="m7.5 10.5 1.6 1.6 3-3M7.5 16.5l1.6 1.6 3-3" fill="none" stroke="#3aa35a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 10.6h3.4M14 16.6h3.4" stroke="#6a5a4a" stroke-width="1.4" stroke-linecap="round"/>`,
  ),
  crate: S(
    `<rect x="2.5" y="7" width="19" height="14.5" rx="1.6" fill="#3f7ac0" ${OL}/>
    <path d="M2.5 7 5 3h14l2.5 4" fill="#5f9ae0" ${OL}/>
    <rect x="10" y="7" width="4" height="14.5" fill="#ffcf4a" stroke="#1b1410" stroke-width=".8"/>
    <path d="M11 3h2v4h-2z" fill="#ffcf4a"/>
    <circle cx="12" cy="12" r="2.2" fill="#fff4c8" stroke="#1b1410" stroke-width=".8"/>`,
  ),
  shop: S(
    `<path d="M3 9h18l-1.4 11.2a2 2 0 0 1-2 1.8H6.4a2 2 0 0 1-2-1.8z" fill="#e8453c" ${OL}/>
    <path d="M8 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke="#1b1410" stroke-width="1.6"/>
    <path d="m12 11.8 1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#ffd23d"/>`,
  ),
  settings: S(
    `<path d="M10.2 1.8h3.6l.6 2.8 2 .9 2.4-1.6 2.6 2.6-1.6 2.4.9 2 2.8.6v3.6l-2.8.6-.9 2 1.6 2.4-2.6 2.6-2.4-1.6-2 .9-.6 2.8h-3.6l-.6-2.8-2-.9-2.4 1.6-2.6-2.6 1.6-2.4-.9-2L1.8 14v-3.6l2.8-.6.9-2-1.6-2.4 2.6-2.6 2.4 1.6 2-.9z" fill="#9aa7b0" ${OL}/>
    <circle cx="12" cy="12" r="3.6" fill="#3a424b" stroke="#1b1410" stroke-width="1"/>`,
  ),
  alert: S(
    `<path d="M12 2.2 23 21H1z" fill="#ffcf4a" ${OL}/>
    <path d="M12 8.5v6.2" stroke="#1b1410" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="12" cy="18" r="1.4" fill="#1b1410"/>`,
  ),
  heart: S(
    `<path d="M12 21.2S2.2 15 2.2 8.6A5 5 0 0 1 12 6.4a5 5 0 0 1 9.8 2.2C21.8 15 12 21.2 12 21.2z" fill="#ff4a5a" ${OL}/>
    <path d="M6 7.6c.8-1 2-1.4 3.2-1" stroke="#ffd0d4" stroke-width="1.4" stroke-linecap="round" fill="none"/>`,
  ),
  rad: S(
    `<circle cx="12" cy="12" r="10" fill="#ffcf4a" ${OL}/>
    <path d="M12 12 7.6 4.4A8.8 8.8 0 0 1 16.4 4.4zM12 12l8.8 0a8.8 8.8 0 0 1-4.4 7.6zM12 12l-4.4 7.6A8.8 8.8 0 0 1 3.2 12z" fill="#1b1410" transform="rotate(-30 12 12)"/>
    <circle cx="12" cy="12" r="2.2" fill="#ffcf4a" stroke="#1b1410" stroke-width="1"/>`,
  ),
  xp: S(`<path d="m12 1.8 2.9 6.4 7 .7-5.2 4.7 1.5 6.9L12 17l-6.2 3.5 1.5-6.9L2.1 8.9l7-.7z" fill="#ffd23d" ${OL}/>`),
  levelup: S(
    `<circle cx="12" cy="12" r="10" fill="#3aa35a" ${OL}/>
    <path d="M12 5.5 6.5 11.5h3.6v6.5h3.8v-6.5h3.6z" fill="#f4fff0"/>`,
  ),
  weapon: S(
    `<path d="M2 8.6h15.5l1.4-1.8h3v5.4h-9.2l-1.2 1.6v2.6l1 4.6H8.6l-1-4.6v-3H2z" fill="#5c6670" ${OL}/>
    <rect x="10.8" y="12.4" width="3.2" height="2.4" rx=".6" fill="#c98a4a"/>
    <path d="M3 9.8h13" stroke="#aab4bd" stroke-width="1" stroke-linecap="round"/>`,
  ),
  outfit: S(
    `<path d="M8.4 2.5 12 5l3.6-2.5 6 3.6-2.4 5-2.2-1v11.4H7V10.1l-2.2 1-2.4-5z" fill="#2b7fb8" ${OL}/>
    <path d="M12 5v16.5" stroke="#ffb02e" stroke-width="1.6"/>`,
  ),
  pet: S(
    `<ellipse cx="12" cy="16" rx="5.4" ry="4.6" fill="#c98a4a" ${OL}/>
    <ellipse cx="5.2" cy="10.6" rx="2.2" ry="2.8" fill="#c98a4a" ${OL}/><ellipse cx="18.8" cy="10.6" rx="2.2" ry="2.8" fill="#c98a4a" ${OL}/>
    <ellipse cx="9" cy="5.8" rx="2.2" ry="2.8" fill="#c98a4a" ${OL}/><ellipse cx="15" cy="5.8" rx="2.2" ry="2.8" fill="#c98a4a" ${OL}/>`,
  ),
  robot: S(
    `<rect x="4" y="6.5" width="16" height="13" rx="4.5" fill="#b9c3cc" ${OL}/>
    <path d="M12 6.5V3" stroke="#1b1410" stroke-width="1.2"/><circle cx="12" cy="2.6" r="1.6" fill="#ff5a4a" ${OL}/>
    <rect x="6.5" y="9.5" width="11" height="6" rx="3" fill="#1d2a33"/>
    <circle cx="9.6" cy="12.5" r="1.4" fill="#6aff8c"/><circle cx="14.4" cy="12.5" r="1.4" fill="#6aff8c"/>
    <path d="M2 12.5h2M20 12.5h2" stroke="#1b1410" stroke-width="1.6" stroke-linecap="round"/>`,
  ),
  clock: S(
    `<circle cx="12" cy="12" r="9.5" fill="#f4ead8" ${OL}/>
    <path d="M12 6.5V12l3.6 2.4" fill="none" stroke="#1b1410" stroke-width="1.8" stroke-linecap="round"/>`,
  ),
  video: S(
    `<rect x="2" y="5" width="20" height="14" rx="3.2" fill="#ff4a5a" ${OL}/>
    <path d="M10 8.8v6.4l5.4-3.2z" fill="#fff"/>`,
  ),
  lock: S(
    `<rect x="4.5" y="10" width="15" height="12" rx="2.4" fill="#ffcf4a" ${OL}/>
    <path d="M7.8 10V7.2a4.2 4.2 0 0 1 8.4 0V10" fill="none" stroke="#1b1410" stroke-width="1.8"/>
    <circle cx="12" cy="15.4" r="1.6" fill="#1b1410"/>`,
  ),
  check: S(`<circle cx="12" cy="12" r="10" fill="#3aa35a" ${OL}/><path d="m7 12.4 3.4 3.4 6.6-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`),
  close: S(`<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`),
  plus: S(`<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>`),
  upgrade: S(
    `<path d="M12 3 4 11h5v4h6v-4h5z" fill="#6aff8c" ${OL}/><path d="M9 17h6v4H9z" fill="#3aa35a" ${OL}/>`,
  ),
  rush: S(
    `<circle cx="12" cy="12" r="10" fill="#ff9a3d" ${OL}/>
    <path d="M5.5 8v8l5.6-4zM12 8v8l5.6-4z" fill="#fff"/>`,
  ),
  trash: S(
    `<path d="M5 7h14l-1.2 13.2A2 2 0 0 1 15.8 22H8.2a2 2 0 0 1-2-1.8z" fill="#9aa7b0" ${OL}/>
    <path d="M3 6h18M9.5 6V3.5h5V6" stroke="#1b1410" stroke-width="1.4" fill="none"/>
    <path d="M10 10v8M14 10v8" stroke="#1b1410" stroke-width="1.2"/>`,
  ),
  info: S(`<circle cx="12" cy="12" r="10" fill="#5fb8ff" ${OL}/><path d="M12 10.5v7" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="6.8" r="1.5" fill="#fff"/>`),
  mission: S(
    `<path d="M5 22V2.5" stroke="#1b1410" stroke-width="1.8"/>
    <path d="M5.8 3h13.4l-3 4.4 3 4.4H5.8z" fill="#e8453c" ${OL}/>
    <path d="m11.8 5.2.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z" fill="#ffd23d"/>`,
  ),
  baby: S(
    `<circle cx="12" cy="10.5" r="7" fill="#f6d5bd" ${OL}/>
    <path d="M9 4.6c1-1.6 3.4-2 4.4-.6-.8.2-1.4.8-1.4 1.6" fill="none" stroke="#5a3a22" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="9.6" cy="10" r="1" fill="#1b1410"/><circle cx="14.4" cy="10" r="1" fill="#1b1410"/>
    <circle cx="12" cy="14" r="1.8" fill="#ff9ab8" stroke="#1b1410" stroke-width=".8"/>
    <path d="M6 21c1-2.6 3.4-3.8 6-3.8s5 1.2 6 3.8z" fill="#7fc3e8" ${OL}/>`,
  ),
  cat: S(
    `<path d="M4 20.5V9L2.8 3l5 3.4a9 9 0 0 1 8.4 0L21.2 3 20 9v11.5z" fill="#6b5b8a" ${OL}/>
    <ellipse cx="8.8" cy="12" rx="1.6" ry="2" fill="#ffe27a"/><ellipse cx="15.2" cy="12" rx="1.6" ry="2" fill="#ffe27a"/>
    <path d="M8.8 11v2M15.2 11v2" stroke="#1b1410" stroke-width=".9"/>
    <path d="M11 15.4h2l-1 1.2z" fill="#ff9ab8"/><text x="12" y="23" font-size="4" text-anchor="middle" fill="#ffe27a">?</text>`,
  ),
  door: S(
    `<circle cx="12" cy="12" r="10" fill="#8a949e" ${OL}/><circle cx="12" cy="12" r="6" fill="none" stroke="#3a424b" stroke-width="1.2"/>
    <circle cx="12" cy="12" r="3" fill="#ffb02e" stroke="#1b1410" stroke-width=".8"/>`,
  ),
  star: S(`<path d="m12 1.8 2.9 6.4 7 .7-5.2 4.7 1.5 6.9L12 17l-6.2 3.5 1.5-6.9L2.1 8.9l7-.7z" fill="#ffd23d" ${OL}/>`),
  menu: S(`<path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`),
  map: S(
    `<path d="M2 5.5 8 3l8 2.5L22 3v15.5L16 21l-8-2.5L2 21z" fill="#e8d9b5" ${OL}/>
    <path d="M8 3v15.5M16 5.5V21" stroke="#1b1410" stroke-width=".9"/>
    <path d="M4 15c2-1 3-4 6-4s3 3 6 2 3-4 4-5" fill="none" stroke="#e8453c" stroke-width="1.3" stroke-dasharray="1.6 1.2"/>`,
  ),
  gift: S(
    `<rect x="3" y="9" width="18" height="12.5" rx="1.6" fill="#b58cff" ${OL}/>
    <rect x="2" y="6.5" width="20" height="4" rx="1.2" fill="#9a6ae8" ${OL}/>
    <path d="M12 6.5v15" stroke="#ffd23d" stroke-width="2.4"/>
    <path d="M12 6.5C10 3 6.5 2.8 6.6 5c.1 1.8 3.6 1.6 5.4 1.5zM12 6.5c2-3.5 5.5-3.7 5.4-1.5-.1 1.8-3.6 1.6-5.4 1.5z" fill="#ffd23d" ${OL}/>`,
  ),
  sound: S(`<path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  music: S(`<path d="M9 17.5V5l11-2v12.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.8" fill="currentColor"/>`),
  swap: S(`<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
  arrow_right: S(`<path d="M8 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`),
  arrow_left: S(`<path d="M16 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`),
  pin: S(`<circle cx="12" cy="9" r="6.5" fill="#e8453c" ${OL}/><path d="M12 15.5V22" stroke="#1b1410" stroke-width="1.8"/><circle cx="10" cy="7" r="1.8" fill="#fff" opacity=".7"/>`),
  junk: S(
    `<circle cx="9" cy="14" r="6" fill="#9aa7b0" ${OL}/><circle cx="9" cy="14" r="2.2" fill="#3a424b"/>
    <path d="M13 3.5h7.5v5H13z" fill="#c98a4a" ${OL}/><path d="M16 12.5l5 5-2 2-5-5z" fill="#ffcf4a" ${OL}/>`,
  ),
  craft: S(
    `<path d="M4.5 19.5 14 10" stroke="#8a5a36" stroke-width="3" stroke-linecap="round"/>
    <path d="M12.2 5.4 16 1.6l6.4 6.4-3.8 3.8-2.2-2.2-1.2 1.2-2.8-2.8 1.2-1.2z" fill="#9aa7b0" ${OL}/>
    <path d="m2.5 3.5 3 3M6.5 2l1 3M2 7.5l3-1" stroke="#ffcf4a" stroke-width="1.4" stroke-linecap="round"/>`,
  ),
  stat_str: S(
    `<path d="M7 11.5V6.2a1.6 1.6 0 0 1 3.2 0v-.8a1.6 1.6 0 0 1 3.2 0v.6a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0V13c0 5-3.2 8.5-7.6 8.5-3.4 0-5.6-1.8-6.8-4.6L4.2 12.6a1.6 1.6 0 0 1 2.8-1.1z" fill="#ff6a4d" ${OL}/>`,
  ),
  stat_per: S(
    `<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="#f4fbff" ${OL}/>
    <circle cx="12" cy="12" r="4.2" fill="#39c6e8" stroke="#1b1410" stroke-width="1"/><circle cx="12" cy="12" r="1.8" fill="#1b1410"/><circle cx="13.2" cy="10.8" r=".8" fill="#fff"/>`,
  ),
  stat_end: S(
    `<path d="M12 2 20 5v6.4c0 5-3.4 9-8 10.6-4.6-1.6-8-5.6-8-10.6V5z" fill="#62d17a" ${OL}/>
    <path d="M12 7.5v8M8 11.5h8" stroke="#f4fff0" stroke-width="2.4" stroke-linecap="round"/>`,
  ),
  stat_cha: S(
    `<path d="M12 21.2S2.2 15 2.2 8.6A5 5 0 0 1 12 6.4a5 5 0 0 1 9.8 2.2C21.8 15 12 21.2 12 21.2z" fill="#ff7cc0" ${OL}/>
    <path d="M8.2 11.8c.9 1.6 2.2 2.4 3.8 2.4s2.9-.8 3.8-2.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  ),
  stat_int: S(
    `<path d="M9 3.5a4 4 0 0 0-4 4 3.8 3.8 0 0 0-2 3.4 4 4 0 0 0 2.3 3.6A4.2 4.2 0 0 0 9 20.5h1.4V3.6z" fill="#7f95ff" ${OL}/>
    <path d="M15 3.5a4 4 0 0 1 4 4 3.8 3.8 0 0 1 2 3.4 4 4 0 0 1-2.3 3.6 4.2 4.2 0 0 1-3.7 6H13.6V3.6z" fill="#9aaaff" ${OL}/>
    <path d="M6.5 9.5c1 .2 1.8.9 2 2M17.5 9.5c-1 .2-1.8.9-2 2M7 15c1-.3 2-.1 2.6.6M17 15c-1-.3-2-.1-2.6.6" fill="none" stroke="#1b1410" stroke-width=".9" stroke-linecap="round"/>`,
  ),
  stat_agi: S(
    `<circle cx="14.6" cy="4" r="2.4" fill="#ffc23d" ${OL}/>
    <path d="m9.4 7.6 4.6-.8 2.6 3.8 3.4.8-.6 2-4.4-1.2-1.6-1.6-1.4 3.4 3 2.6-1.8 5.6-2.2-.6 1.4-4.2-3.6-2.8-1.6 3.6-4.6.4-.2-2.2 3.4-.4 2.6-6.2-1.8.6-1.4 2.6-1.8-1z" fill="#ffc23d" ${OL}/>`,
  ),
  stat_luc: S(
    `<g fill="#b6e04a" ${OL}><circle cx="8.3" cy="8.3" r="4.2"/><circle cx="15.7" cy="8.3" r="4.2"/><circle cx="8.3" cy="15.7" r="4.2"/><circle cx="15.7" cy="15.7" r="4.2"/></g>
    <circle cx="12" cy="12" r="2" fill="#7fae2a"/><path d="M12 14l3.6 8" stroke="#1b1410" stroke-width="1.4" stroke-linecap="round"/>`,
  ),
};

export function iconSvg(name: string): string {
  return ICONS[name] ?? ICONS.info;
}

/** Rasterized icons for canvas use. */
const imgCache = new Map<string, HTMLImageElement>();
export function iconImage(name: string): HTMLImageElement | null {
  let img = imgCache.get(name);
  if (!img) {
    img = new Image();
    const svg = iconSvg(name).replace(/currentColor/g, '#ffffff');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    imgCache.set(name, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function preloadIcons(): Promise<void> {
  const names = Object.keys(ICONS);
  return Promise.all(
    names.map(
      (n) =>
        new Promise<void>((res) => {
          const img = new Image();
          img.onload = () => res();
          img.onerror = () => res();
          const svg = iconSvg(n).replace(/currentColor/g, '#ffffff');
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
          imgCache.set(n, img);
        }),
    ),
  ).then(() => undefined);
}
