const getToken   = ()            => localStorage.getItem("token");
const getUser    = ()            => JSON.parse(localStorage.getItem("user") || "null");
const isLoggedIn = ()            => !!getToken();
const saveAuth   = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
const clearAuth  = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
// ── Lucide icon renderer ──────────────────────────────────────────────────────
const LUCIDE_ICONS = {
  "smartphone":    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`,
  "laptop":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
  "car":           `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5m14 0a2 2 0 0 0 2-2v-2.34a2 2 0 0 0-.26-1L18.5 7.5A2 2 0 0 0 16.76 6.5H7.24a2 2 0 0 0-1.74 1l-2.24 4.16a2 2 0 0 0-.26 1V15a2 2 0 0 0 2 2m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0M7 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/></svg>`,
  "shirt":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V9.54h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`,
  "home":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  "trophy":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
  "briefcase":     `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  "baby":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>`,
  "paw-print":     `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>`,
  "wrench":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  "headphones":    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
  "watch":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/></svg>`,
  "tablet":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
  "monitor":       `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  "camera":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  "gamepad-2":     `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="17" x2="17.01" y1="10" y2="10"/><path d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>`,
  "tv":            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  "bike":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
  "truck":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v12H5zm9-9h4l3 3v4h-7V8z"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  "settings":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  "anchor":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
  "footprints":    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.43 3 8c.03-2.69 1.22-5.35 3.03-6.63C7.87.47 10.25-.64 12 1.42c1.75-2.06 4.13-.95 5.97.95C19.78 3.65 20.97 6.31 21 9c.03 2.43-1 3.5-1 5.62V16"/><path d="M4 16c0 2.2 1.8 4 4 4s4-1.8 4-4"/><path d="M16 16c0 2.2 1.8 4 4 4"/></svg>`,
  "shopping-bag":  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  "sofa":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/><path d="M12 4v9"/></svg>`,
  "utensils":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  "flower-2":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/><circle cx="12" cy="11" r="1"/><path d="M11 17a1 1 0 0 1 2 0c0 .5-.34 3-.5 4.5a.5.5 0 0 1-1 0c-.16-1.5-.5-4-.5-4.5z"/></svg>`,
  "plug":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a2 2 0 0 0-2 2v2a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-2a2 2 0 0 0-2-2z"/></svg>`,
  "bed":           `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`,
  "dumbbell":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`,
  "tent":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/></svg>`,
  "waves":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  "clock":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  "graduation-cap":`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  "globe":         `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  "shield":        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  "dog":           `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2 3.055.426 5.544-.608 6.accompany-1.5.5"/><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 2-3.055.426-5.544-.608-6.5-1.5-.5-.5-.267-3.5 2.656-5.328z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 20A2 2 0 0 0 6.34 22h11.32a2 2 0 0 0 1.92-2.57L18 14H6l-1.58 6z"/></svg>`,
  "cat":           `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 17 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/><path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/></svg>`,
  "bird":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75v3.25"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>`,
  "fish":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 3.5-.5 6.5 1.33 9.5-1.83 3-2.33 6-.33 9 2.5-.5 4.5-2 5.5-4.5 2 0 4 1 5.5 2C21 20 21 12.1 21 12c0-.07 0-6.5-5.27-9.5-1.5 1-2.23 3.17-2.23 5.5"/></svg>`,
  "bone":          `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5L17 10z"/></svg>`,
  "sparkles":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  "book-open":     `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  "scissors":      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>`,
  "package":       `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`,
};

function lucideIcon(name, size = 22) {
  const svg = LUCIDE_ICONS[name];
  if (!svg) return `<span style="font-size:${size}px">📦</span>`;
  return svg.replace('width="24"', `width="${size}"`).replace('height="24"', `height="${size}"`);
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (getToken()) headers["Authorization"] = `Bearer ${getToken()}`;
  if (!(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";

  const res  = await fetch(`/api${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register:        (body) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:           (body) => apiFetch("/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  me:              ()     => apiFetch("/auth/me"),
  getPublicUser:   (id)   => apiFetch(`/auth/user/${id}`),
  uploadAvatar:    (fd)   => apiFetch("/auth/avatar", { method: "POST", body: fd }),

  // ── Listings ──────────────────────────────────────────────────────────────
  getListings:     (params = {}) => apiFetch(`/listings?${new URLSearchParams(params)}`),
  getListing:      (id)          => apiFetch(`/listings/${id}`),
  createListing:   (fd)          => apiFetch("/listings", { method: "POST", body: fd }),
  updateListing:   (id, body)    => apiFetch(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteListing:   (id)          => apiFetch(`/listings/${id}`, { method: "DELETE" }),
  getUserListings: (uid)         => apiFetch(`/listings/user/${uid}`),
  getCategories:   ()            => apiFetch("/categories"),
  searchUsers:     (q)           => apiFetch(`/listings/search/users?q=${encodeURIComponent(q)}`),
  suggestTags:     (q)           => apiFetch(`/listings/tags/suggest?q=${encodeURIComponent(q)}`),
  suggestListings: (q)           => apiFetch(`/listings/suggest?q=${encodeURIComponent(q)}`),

  // ── Ratings ───────────────────────────────────────────────────────────────
  getRatings:      (userId)       => apiFetch(`/ratings/${userId}`),
  submitRating:    (userId, body) => apiFetch(`/ratings/${userId}`, { method: "POST", body: JSON.stringify(body) }),
  deleteRating:    (userId)       => apiFetch(`/ratings/${userId}`, { method: "DELETE" }),
  submitReport:      (body)  => apiFetch("/reports", { method: "POST", body: JSON.stringify(body) }),
  getListingReports: (id)    => apiFetch(`/reports/listing/${id}`),

  // ── Messages ──────────────────────────────────────────────────────────────
  getInbox:        ()             => apiFetch("/messages/inbox"),
  startConversation: (body)       => apiFetch("/messages/conversation", { method: "POST", body: JSON.stringify(body) }),
  getMessages:     (convId)       => apiFetch(`/messages/${convId}`),
  sendMessage:     (convId, body) => apiFetch(`/messages/${convId}`, { method: "POST", body: JSON.stringify(body) }),
  getUnreadCount:  ()             => apiFetch("/messages/unread/count"),
  getRelatedListings: (id)        => apiFetch(`/listings/${id}/related`),
  promoteListing:   (id)          => apiFetch(`/listings/${id}/promote`, { method: "POST" }),
  saveSearch:       (query)       => apiFetch("/search/history", { method: "POST", body: JSON.stringify({ query }) }),
  getSaved:         ()            => apiFetch("/saved"),
  saveListing:      (id)          => apiFetch(`/saved/${id}`, { method: "POST" }),
  unsaveListing:    (id)          => apiFetch(`/saved/${id}`, { method: "DELETE" }),
  checkSaved:       (id)          => apiFetch(`/saved/check/${id}`),
  recordView:       (id)          => apiFetch(`/recently-viewed/${id}`, { method: "POST" }),
  getRecentlyViewed: ()           => apiFetch("/recently-viewed"),
  clearRecentlyViewed: ()         => apiFetch("/recently-viewed", { method: "DELETE" }),
  getSearchHistory: ()            => apiFetch("/search/history"),
  clearSearchHistory: ()          => apiFetch("/search/history", { method: "DELETE" }),
  removeSearchItem: (query)       => apiFetch(`/search/history/${encodeURIComponent(query)}`, { method: "DELETE" }),
  markAsRead:      (convId)       => apiFetch(`/messages/${convId}/read`, { method: "POST" }),
  getNotifications: ()            => apiFetch("/notifications"),
  markNotifsRead:   ()            => apiFetch("/notifications/read", { method: "POST" }),
};

// ── Encryption (AES-GCM) ─────────────────────────────────────────────────────
// A per-conversation key is derived from both user IDs so only participants
// can decrypt. Nothing secret ever leaves the browser unencrypted.
async function getConvKey(user1_id, user2_id) {
  const raw    = `conv-${Math.min(user1_id, user2_id)}-${Math.max(user1_id, user2_id)}`;
  const enc    = new TextEncoder();
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(raw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("marketplace-ke-salt"), iterations: 100000, hash: "SHA-256" },
    keyMat,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptMessage(text, user1_id, user2_id) {
  const key = await getConvKey(user1_id, user2_id);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct  = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
  return {
    content: btoa(String.fromCharCode(...new Uint8Array(ct))),
    iv:      btoa(String.fromCharCode(...iv)),
  };
}

async function decryptMessage(content, ivStr, user1_id, user2_id) {
  try {
    const key = await getConvKey(user1_id, user2_id);
    const iv  = Uint8Array.from(atob(ivStr),  c => c.charCodeAt(0));
    const ct  = Uint8Array.from(atob(content), c => c.charCodeAt(0));
    const pt  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return "🔒 Unable to decrypt message";
  }
}

// ── UI Helpers ────────────────────────────────────────────────────────────────
function formatPrice(price) {
  return "KSh " + Number(price).toLocaleString("en-KE");
}
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function conditionLabel(val) {
  return { new: "New", used_like_new: "Like New", used_good: "Good", used_fair: "Fair" }[val] || val;
}
function renderStars(score, interactive = false, onRate = null) {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.round(score);
    if (interactive) {
      return `<span class="star interactive ${filled ? "filled" : ""}"
                    data-val="${i+1}"
                    onclick="handleStarClick(${i+1})"
                    onmouseover="highlightStars(${i+1})"
                    onmouseout="resetStars()">★</span>`;
    }
    return `<span class="star ${filled ? "filled" : ""}">★</span>`;
  }).join("");
}
function updateNav() {
  initDarkMode();
  const user    = getUser();
  const navAuth = document.getElementById("nav-auth");
  if (!navAuth) return;
  if (user) {
    navAuth.innerHTML = `
      <a href="/post-ad.html" class="btn btn-primary">+ Post Ad</a>
      <button id="dark-mode-btn" class="btn btn-ghost" style="padding:9px 14px;font-size:16px"
              onclick="toggleDarkMode()" title="Toggle dark mode">🌙</button>
      <a href="/favourites.html" class="btn btn-ghost" style="padding:9px 14px;font-size:16px" title="My Favourites">♡</a>
      <div class="notif-wrap">
        <a href="/inbox.html" class="btn btn-ghost" style="padding:9px 14px" id="inbox-btn">💬</a>
      </div>
      <div class="notif-wrap">
        <button class="btn btn-ghost" style="padding:9px 14px" id="notif-btn" onclick="toggleNotifPanel()">🔔</button>
        <div id="notif-panel" style="
          display:none;position:absolute;top:62px;right:0;width:320px;
          background:var(--surface);border:1px solid var(--border);
          border-radius:var(--radius);box-shadow:var(--shadow-lg);
          z-index:500;overflow:hidden;
        "></div>
      </div>
      <a href="/profile.html?id=${user.id}" class="nav-user">
        ${user.avatar
          ? `<img src="${user.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--brand)" />`
          : `<span class="avatar-circle" style="width:36px;height:36px;font-size:15px">${user.name[0].toUpperCase()}</span>`}
        <span style="font-weight:600;font-size:14px">${user.name.split(" ")[0]}</span>
      </a>
      <button class="btn btn-ghost" onclick="logout()">Logout</button>`;
    loadUnreadBadge();
    loadNotifBadge();
  } else {
    navAuth.innerHTML = `
      <button id="dark-mode-btn" class="btn btn-ghost" style="padding:9px 14px;font-size:16px"
              onclick="toggleDarkMode()" title="Toggle dark mode">🌙</button>
      <a href="/login.html" class="btn btn-ghost">Login</a>
      <a href="/register.html" class="btn btn-primary">Register</a>`;
  }
  // Sync avatar from server in background
  if (user) {
    api.me().then(fresh => {
      if (fresh.avatar !== user.avatar) {
        user.avatar = fresh.avatar;
        saveAuth(getToken(), user);
        updateNav();
      }
    }).catch(() => {});
  }
}
function logout() {
  clearAuth();
  window.location.href = "/";
}
function toast(msg, type = "success") {
  const c = document.getElementById("toast-container");
  if (!c) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
async function loadUnreadBadge() {
  if (!isLoggedIn()) return;
  try {
    const { count } = await api.getUnreadCount();
    const wrap = document.querySelector(".notif-wrap");
    if (!wrap) return;
    // remove old badge if any
    const old = wrap.querySelector(".notif-badge");
    if (old) old.remove();
    if (count > 0) {
      const badge = document.createElement("div");
      badge.className   = "notif-badge";
      badge.textContent = count > 9 ? "9+" : count;
      wrap.appendChild(badge);
    }
  } catch {}
}

async function loadNotifBadge() {
  if (!isLoggedIn()) return;
  try {
    const { unread } = await api.getNotifications();
    const wrap = document.querySelector("#notif-btn")?.parentElement;
    if (!wrap) return;
    const old = wrap.querySelector(".notif-badge");
    if (old) old.remove();
    if (unread > 0) {
      const badge = document.createElement("div");
      badge.className   = "notif-badge";
      badge.textContent = unread > 9 ? "9+" : unread;
      wrap.appendChild(badge);
    }
  } catch {}
}

async function toggleNotifPanel() {
  const panel = document.getElementById("notif-panel");
  if (!panel) return;

  if (panel.style.display === "block") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  panel.innerHTML = `<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px">Loading…</div>`;

  try {
    const { notifications } = await api.getNotifications();

    // Mark all as read
    await api.markNotifsRead();
    // Remove badge
    const badge = document.querySelector("#notif-btn + .notif-badge, #notif-btn ~ .notif-badge");
    if (badge) badge.remove();
    const wrap = document.querySelector("#notif-btn")?.parentElement;
    if (wrap) {
      const b = wrap.querySelector(".notif-badge");
      if (b) b.remove();
    }

    if (!notifications.length) {
      panel.innerHTML = `
        <div style="padding:24px;text-align:center">
          <div style="font-size:28px;margin-bottom:8px">🔔</div>
          <div style="font-size:13px;color:var(--muted)">No notifications yet</div>
        </div>`;
      return;
    }

    const icons = { view: "👁", rating: "⭐", message: "💬" };

    panel.innerHTML = `
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-weight:600;font-size:14px">
        Notifications
      </div>
      <div style="max-height:360px;overflow-y:auto">
        ${notifications.map(n => `
          <div onclick="${n.link ? `window.location='${n.link}'` : ''}"
               style="padding:12px 16px;border-bottom:1px solid var(--border);
                      display:flex;gap:12px;align-items:flex-start;
                      cursor:${n.link ? 'pointer' : 'default'};
                      background:${n.is_read ? 'transparent' : '#fff8f0'};
                      transition:background .15s"
               onmouseover="this.style.background='#fff0e6'"
               onmouseout="this.style.background='${n.is_read ? 'transparent' : '#fff8f0'}'">
            <span style="font-size:20px;flex-shrink:0">${icons[n.type] || '🔔'}</span>
            <div>
              <div style="font-size:13px;font-weight:500;color:var(--text)">${n.message}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:3px">${timeAgo(n.created_at)}</div>
            </div>
          </div>`).join("")}
      </div>`;
  } catch (e) {
    panel.innerHTML = `<div style="padding:16px;color:red;font-size:13px">${e.message}</div>`;
  }

  // Close panel when clicking outside
  setTimeout(() => {
    document.addEventListener("click", function closePanel(e) {
      if (!panel.contains(e.target) && e.target.id !== "notif-btn") {
        panel.style.display = "none";
        document.removeEventListener("click", closePanel);
      }
    });
  }, 100);
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateDarkModeBtn();
}

function toggleDarkMode() {
  const current = document.documentElement.getAttribute("data-theme");
  const next    = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateDarkModeBtn();
}

function updateDarkModeBtn() {
  const btn = document.getElementById("dark-mode-btn");
  if (!btn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  btn.textContent  = isDark ? "☀️" : "🌙";
  btn.title        = isDark ? "Switch to light mode" : "Switch to dark mode";
}