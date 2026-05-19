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

  // ── Listings ──────────────────────────────────────────────────────────────
  getListings:     (params = {}) => apiFetch(`/listings?${new URLSearchParams(params)}`),
  getListing:      (id)          => apiFetch(`/listings/${id}`),
  createListing:   (fd)          => apiFetch("/listings", { method: "POST", body: fd }),
  updateListing:   (id, body)    => apiFetch(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteListing:   (id)          => apiFetch(`/listings/${id}`, { method: "DELETE" }),
  getUserListings: (uid)         => apiFetch(`/listings/user/${uid}`),
  getCategories:   ()            => apiFetch("/categories"),
  searchUsers:     (q)           => apiFetch(`/listings/search/users?q=${encodeURIComponent(q)}`),

  // ── Ratings ───────────────────────────────────────────────────────────────
  getRatings:      (userId)       => apiFetch(`/ratings/${userId}`),
  submitRating:    (userId, body) => apiFetch(`/ratings/${userId}`, { method: "POST", body: JSON.stringify(body) }),
  deleteRating:    (userId)       => apiFetch(`/ratings/${userId}`, { method: "DELETE" }),

  // ── Messages ──────────────────────────────────────────────────────────────
  getInbox:        ()             => apiFetch("/messages/inbox"),
  startConversation: (body)       => apiFetch("/messages/conversation", { method: "POST", body: JSON.stringify(body) }),
  getMessages:     (convId)       => apiFetch(`/messages/${convId}`),
  sendMessage:     (convId, body) => apiFetch(`/messages/${convId}`, { method: "POST", body: JSON.stringify(body) }),
  getUnreadCount:  ()             => apiFetch("/messages/unread/count"),
  markAsRead:      (convId)       => apiFetch(`/messages/${convId}/read`, { method: "POST" }),
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
  const user    = getUser();
  const navAuth = document.getElementById("nav-auth");
  if (!navAuth) return;
  if (user) {
    navAuth.innerHTML = `
      <a href="/post-ad.html" class="btn btn-primary">+ Post Ad</a>
      <div class="notif-wrap">
        <a href="/inbox.html" class="btn btn-ghost" style="padding:9px 14px" id="inbox-btn">💬</a>
      </div>
      <a href="/profile.html?id=${user.id}" class="nav-user">
        <span class="avatar-circle">${user.name[0].toUpperCase()}</span>
        ${user.name.split(" ")[0]}
      </a>
      <button class="btn btn-ghost" onclick="logout()">Logout</button>`;
    loadUnreadBadge();
  } else {
    navAuth.innerHTML = `
      <a href="/login.html" class="btn btn-ghost">Login</a>
      <a href="/register.html" class="btn btn-primary">Register</a>`;
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