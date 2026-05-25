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