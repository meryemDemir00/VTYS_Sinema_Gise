const mock = {
  movies: [],
  halls: [],
  sessions: [],
  customers: [],
  tickets: [],
};

const state = {
  selectedMovieId: null,
  selectedDate: "",
  selectedTime: "",
  selectedSeats: [],
  adminTab: "Filmler",
  adminLogin: { username: "", password: "", error: "" },
  isAddMovieModalOpen: false,
  isEditMovieModalOpen: false,
  isDeleteDialogOpen: false,
  selectedMovie: null,
  addMoviePoster: "",
  currentUser: null,
  isLoggedIn: false,
  isAuthModalOpen: false,
  authTab: "login",
  authLogin: {
    identifier: "",
    sifre: "",
    rememberMe: false,
    showPassword: false,
    recaptcha: false,
    fieldErrors: {},
    error: "",
    loading: false,
  },
  authRegister: {
    ad: "",
    soyad: "",
    email: "",
    telefon: "",
    dogumGun: "",
    dogumAy: "",
    dogumYil: "",
    cinsiyet: "",
    sifre: "",
    sifreTekrar: "",
    smsOptIn: false,
    emailOptIn: false,
    kvkkOnay: false,
    recaptcha: false,
    showPassword: false,
    showPasswordRepeat: false,
    fieldErrors: {},
    error: "",
    loading: false,
  },
  toast: "",
  toastType: "success",
};

const app = document.querySelector("#app");
const seatRows = ["A", "B", "C", "D", "E", "F", "G"];
const takenSeats = new Set(["A3", "A4", "B8", "C2", "D5", "D6", "E7", "F1", "G9"]);
const showTimes = ["11:30", "13:30", "16:30", "20:30"];
const dayNames = ["Paz", "Pzt", "Sal", "Car", "Per", "Cum", "Cmt"];
const monthNames = ["Oca", "Sub", "Mar", "Nis", "May", "Haz", "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara"];
const movieGenreOptions = ["Animasyon", "Aksiyon", "Bilim Kurgu", "Macera", "Dram", "Komedi", "Korku", "Romantik"];
const genderOptions = ["Kadin", "Erkek"];
const authStorageKeys = {
  persistent: "biletin_auth_user",
  session: "biletin_auth_user_session",
};
const today = new Date();
const yearOptions = Array.from({ length: 90 }, (_, index) => String(today.getFullYear() - index));
const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));

const API_BASE = "http://localhost:3000/api";

function normalizeMovie(movie) {
  const rawGenres = movie.Tur ?? "Dram";
  const genres = Array.isArray(rawGenres)
    ? rawGenres
    : String(rawGenres).split(",").map((genre) => genre.trim()).filter(Boolean);

  return {
    id: Number(movie.FilmID),
    name: movie.FilmAd ?? "",
    duration: Number(movie.Sure ?? 0),
    genres,
    director: "Bilinmiyor",
    releaseDate: "2026-01-01",
    poster: "assets/default-poster.png",
    price: 150,
    rating: "-",
  };
}

function showToast(message, type = "success") {
  state.toast = message;
  state.toastType = type;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 3000);
}

function money(value) {
  return `TL${value.toFixed(2)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateTimeFromKey(key, time) {
  const [hour, minute] = time.split(":").map(Number);
  const date = dateFromKey(key);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatDateParts(key) {
  const date = dateFromKey(key);
  return {
    day: dayNames[date.getDay()],
    date: `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`,
  };
}

function formatBookingDate(key) {
  const parts = formatDateParts(key);
  return `${parts.day}, ${parts.date}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function truncateLabel(value, maxLength = 22) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function availableTimesForDate(key) {
  const now = new Date();
  const currentDay = dateKey(now);
  if (key < currentDay) return [];
  if (key > currentDay) return showTimes;
  return showTimes.filter((time) => dateTimeFromKey(key, time) > now);
}

function upcomingDates(limit = 4) {
  const dates = [];
  const now = new Date();
  for (let offset = 0; offset < 21 && dates.length < limit; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = dateKey(date);
    if (availableTimesForDate(key).length > 0) dates.push(key);
  }
  return dates;
}

function ensureScheduleSelection() {
  const dates = upcomingDates();
  if (!dates.length) return false;
  if (!dates.includes(state.selectedDate)) state.selectedDate = dates[0];
  const times = availableTimesForDate(state.selectedDate);
  if (!times.includes(state.selectedTime)) state.selectedTime = times[0] || "";
  return Boolean(state.selectedDate && state.selectedTime);
}

function getMovie(id = state.selectedMovieId) {
  return mock.movies.find((movie) => movie.id === Number(id)) || mock.movies[0];
}

function setRoute(route) {
  window.location.hash = route;
}

function currentRoute() {
  return window.location.hash.replace("#", "") || "home";
}

function currentUserLabel() {
  if (!state.currentUser) return "";
  const fullName = `${state.currentUser.ad || ""} ${state.currentUser.soyad || ""}`.trim();
  return truncateLabel(fullName || state.currentUser.email || "");
}

function authNavMarkup() {
  if (!state.isLoggedIn || !state.currentUser) {
    return `<button class="btn secondary small auth-nav-btn" type="button" data-open-auth-modal>Giris Yap</button>`;
  }

  const label = currentUserLabel();
  const fullText = `${state.currentUser.ad || ""} ${state.currentUser.soyad || ""}`.trim() || state.currentUser.email || "";
  return `
    <div class="auth-nav-user">
      <span class="auth-user-pill" title="${escapeHtml(fullText)}">${escapeHtml(label)}</span>
      <button class="btn secondary small" type="button" data-auth-logout>Cikis Yap</button>
    </div>
  `;
}

function layout(content, options = {}) {
  const nav = options.hideAdmin
    ? authNavMarkup()
    : `<button class="btn secondary small" data-route="home">Vizyondakiler</button>
       <button class="btn small" data-route="admin-login">Yonetim</button>
       ${authNavMarkup()}`;

  return `
    <section class="screen">
      <header class="topbar">
        <button class="brand" data-route="home" aria-label="Ana sayfa">
          <img class="brand-logo" src="/sinematör-logo.png" alt="sinematör" onerror="this.remove()" />
          <span class="brand-text">SİNEMATÖR</span>
        </button>
        <nav class="nav-actions">${nav}</nav>
      </header>
      <main class="main-shell">${content}</main>
      ${state.toast && currentRoute() !== "admin" ? `<div class="toast ${state.toastType === "warning" ? "warning-toast" : "success-toast"}">${escapeHtml(state.toast)}</div>` : ""}
    </section>
  `;
}

function home() {
  if (mock.movies.length === 0) {
    return layout(`<h1 class="center-title">Yukleniyor...</h1>`);
  }
  return layout(`
    <h1 class="center-title">Vizyondakiler</h1>
    <div class="movie-grid">
      ${mock.movies.map((movie) => `
        <button class="movie-card" data-movie="${movie.id}" data-route="detail">
          <span class="poster" style="background-image:url('${movie.poster}')"></span>
          <span class="movie-title">${escapeHtml(movie.name)}</span>
          <span class="movie-meta">${escapeHtml(movie.genres.join(", "))}</span>
          <span class="movie-meta">${movie.duration} dk</span>
        </button>
      `).join("")}
    </div>
  `);
}

function detail() {
  const hasSchedule = ensureScheduleSelection();
  const movie = getMovie();
  if (!movie) return home();
  const dates = upcomingDates();
  const times = availableTimesForDate(state.selectedDate);

  return layout(`
    <div class="detail-layout">
      <section class="detail-panel">
        <h1>Seans Secimi</h1>
        <div class="field-group">
          <label>Tarih Secin</label>
          <div class="chip-row">
            ${dates.map((date) => {
              const parts = formatDateParts(date);
              return `<button class="chip ${state.selectedDate === date ? "active" : ""}" data-date="${date}">${parts.day}<br>${parts.date}</button>`;
            }).join("")}
          </div>
        </div>
        <div class="field-group">
          <label>Saat</label>
          <div class="chip-row">
            ${times.map((time) => `<button class="chip ${state.selectedTime === time ? "active" : ""}" data-time="${time}">${time}</button>`).join("")}
          </div>
        </div>
        ${hasSchedule ? "" : `<p class="empty-note">Su anda uygun gelecek seans bulunmuyor.</p>`}
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Hemen Bilet Al</button>
      </section>
      <aside class="summary-card">
        <div class="poster" style="background-image:url('${movie.poster}')"></div>
        <h2>${escapeHtml(movie.name)}</h2>
        <p>${escapeHtml(movie.genres.join(", "))} | ${movie.duration} dk</p>
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Koltuk Sec</button>
      </aside>
    </div>
  `);
}

function seats() {
  ensureScheduleSelection();
  const movie = getMovie();
  const seats = seatRows.flatMap((row) => Array.from({ length: 10 }, (_, index) => `${row}${index + 1}`));
  const total = movie.price * state.selectedSeats.length;

  return layout(`
    <section class="seat-shell">
      <h1 class="seat-title">Koltuk Secimi</h1>
      <div class="seat-map-wrap">
        <div class="seat-map">
          ${seats.map((seat) => {
            const isTaken = takenSeats.has(seat);
            const isSelected = state.selectedSeats.includes(seat);
            return `<button class="seat ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}" ${isTaken ? "disabled" : ""} data-seat="${seat}">${seat}</button>`;
          }).join("")}
        </div>
        <div class="screen-bar">PERDE</div>
      </div>
      <div class="payment-strip">
        <div><span class="tiny-label">Koltuk</span><div>${state.selectedSeats.length ? state.selectedSeats.join(", ") : "Koltuk secin"}</div></div>
        <div><span class="tiny-label">Toplam Odeme</span><div class="pay-value">${money(total)}</div></div>
        <button class="btn secondary" data-route="detail">Geri</button>
        <button class="btn" data-route="booking" ${state.selectedSeats.length ? "" : "disabled"}>Odemeye Gec</button>
      </div>
    </section>
  `);
}

function booking() {
  ensureScheduleSelection();
  const movie = getMovie();
  const total = movie.price * state.selectedSeats.length;

  return layout(`
    <section class="booking-card">
      <h1>Rezervasyon Detayi</h1>
      <div class="booking-lines">
        <p>Film Adi: <strong>${escapeHtml(movie.name)}</strong></p>
        <p>Tarih ve Saat: <strong>${formatBookingDate(state.selectedDate)} - ${state.selectedTime}</strong></p>
        <p>Koltuk: <strong>${state.selectedSeats.join(", ")}</strong></p>
        <p>Toplam: <strong>${money(total)}</strong></p>
      </div>
      <button class="btn" data-route="otp">Bileti Satin Al</button>
    </section>
  `);
}

function otp() {
  return layout(`
    <section class="form-screen">
      <div class="otp-card dark-card">
        <h1>OTP Kodunu Girin</h1>
        <div class="otp-inputs">
          ${[0, 1, 2, 3].map((index) => `<input maxlength="1" inputmode="numeric" data-otp="${index}" value="${index === 0 ? "5" : ""}" />`).join("")}
        </div>
        <button class="btn" data-route="success">Onayla</button>
      </div>
    </section>
  `, { hideAdmin: true });
}

function success() {
  return layout(`
    <section class="form-screen">
      <div class="success-card dark-card">
        <div class="success-mark">&check;</div>
        <h1>Odeme Basarili</h1>
        <button class="btn" data-route="home">Yeni Bilet Al</button>
        <button class="btn secondary" data-route="home">Ana Sayfaya Don</button>
      </div>
    </section>
  `, { hideAdmin: true });
}

function adminLogin() {
  return `
    <section class="form-screen admin-login">
      <div class="login-card">
        <h1>Yonetici Girisi</h1>
        <form class="input-stack" data-admin-login-form autocomplete="off" novalidate>
          <input name="username" value="${escapeHtml(state.adminLogin.username)}" placeholder="Kullanici adi" data-admin-login-field="username" />
          <input name="password" type="password" value="${escapeHtml(state.adminLogin.password)}" placeholder="Sifre" data-admin-login-field="password" />
          ${state.adminLogin.error ? `<p class="login-error">${escapeHtml(state.adminLogin.error)}</p>` : ""}
          <button class="btn" type="submit">Giris Yap</button>
          <button class="btn secondary" type="button" data-route="home">Sinemaya Don</button>
        </form>
      </div>
    </section>
  `;
}

function admin() {
  const tabs = ["Filmler", "Salonlar", "Kullanicilar", "Siparisler", "Rapor"];
  return `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <h2>Yonetim</h2>
        ${tabs.map((tab) => `<button class="admin-tab ${state.adminTab === tab ? "active" : ""}" data-admin-tab="${tab}">${tab}</button>`).join("")}
      </aside>
      <main class="admin-main">
        <div class="admin-head">
          <h1>Yonetim Paneli</h1>
          <div class="admin-profile"><span class="avatar"></span> yonetici</div>
        </div>
        ${adminContent()}
      </main>
      ${state.isAddMovieModalOpen ? movieModal("add") : ""}
      ${state.isEditMovieModalOpen ? movieModal("edit") : ""}
      ${state.isDeleteDialogOpen ? deleteMovieDialog() : ""}
      ${state.toast ? `<div class="toast ${state.toastType === "warning" ? "warning-toast" : "success-toast"}">${escapeHtml(state.toast)}</div>` : ""}
    </section>
  `;
}

function movieModal(mode = "add") {
  const isEdit = mode === "edit";
  const movie = isEdit ? state.selectedMovie : null;
  const selectedGenres = movie?.genres || [];

  return `
    <div class="modal-overlay" data-close-movie-modal>
      <section class="movie-modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2>${isEdit ? "Filmi Duzenle" : "Film Ekle"}</h2>
          <button class="modal-close" type="button" data-close-movie-modal>&times;</button>
        </div>
        <form class="movie-form" data-movie-form data-mode="${mode}" novalidate>
          <div class="form-field">
            <label>Film Adi</label>
            <input name="name" type="text" autocomplete="off" value="${escapeHtml(movie?.name || "")}" />
          </div>
          <div class="form-field">
            <span class="field-label">Tur</span>
            <div class="genre-tags" data-genre-tags>
              ${movieGenreOptions.map((genre) => `
                <button type="button" class="genre-tag ${selectedGenres.includes(genre) ? "selected" : ""}" data-genre="${genre}">${genre}</button>
              `).join("")}
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>Sure (Dakika)</label>
              <input name="duration" type="number" min="1" step="1" value="${movie?.duration || ""}" />
            </div>
          </div>
          <div class="modal-actions" style="margin-top:20px;">
            <button class="btn secondary modal-cancel" type="button" data-close-movie-modal>Iptal</button>
            <button class="btn modal-save" type="submit">Kaydet</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function deleteMovieDialog() {
  return `
    <div class="modal-overlay" data-cancel-delete-movie>
      <section class="confirm-dialog" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2>Filmi Kaldir</h2>
          <button class="modal-close" type="button" data-cancel-delete-movie>&times;</button>
        </div>
        <div class="confirm-body">
          <p>Bu filmi veritabanindan kalici olarak silmek istediginize emin misiniz?</p>
          <div class="modal-actions">
            <button class="btn secondary modal-cancel" type="button" data-cancel-delete-movie>Hayir, Vazgec</button>
            <button class="btn danger confirm-delete" type="button" data-confirm-delete-movie>Evet, Sil</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function authFieldError(errors, field) {
  return errors[field] ? `<p class="auth-inline-error">${escapeHtml(errors[field])}</p>` : `<p class="auth-inline-error"></p>`;
}

function authSelectOptions(options, placeholder, selectedValue) {
  return `
    <option value="">${placeholder}</option>
    ${options.map((option) => `<option value="${escapeHtml(option)}" ${selectedValue === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
  `;
}

function fakeRecaptcha(checked, fieldName) {
  return `
    <button type="button" class="auth-recaptcha" data-auth-toggle-checkbox="${fieldName}">
      <span class="auth-recaptcha-check ${checked ? "checked" : ""}"></span>
      <span class="auth-recaptcha-copy">Ben robot degilim</span>
      <span class="auth-recaptcha-badge">reCAPTCHA</span>
    </button>
  `;
}

function authModal() {
  const login = state.authLogin;
  const register = state.authRegister;
  const activeTab = state.authTab;

  return `
    <div class="modal-overlay auth-overlay" data-close-auth-modal>
      <section class="auth-modal" role="dialog" aria-modal="true">
        <div class="auth-tabs">
          <button type="button" class="auth-tab ${activeTab === "login" ? "active" : ""}" data-auth-tab="login">Giris Yap</button>
          <button type="button" class="auth-tab ${activeTab === "register" ? "active" : ""}" data-auth-tab="register">Uye Ol</button>
          <button type="button" class="modal-close auth-modal-close" data-close-auth-modal>&times;</button>
        </div>
        <div class="auth-modal-body">
          ${activeTab === "login" ? `
            <div class="auth-panel">
              <div class="auth-field-block">
                <input class="auth-input" type="text" placeholder="Cep Telefonu / E-Posta *" value="${escapeHtml(login.identifier)}" data-auth-field="identifier" data-auth-scope="login" />
                ${authFieldError(login.fieldErrors, "identifier")}
              </div>
              <div class="auth-field-block auth-password-block">
                <input class="auth-input" type="${login.showPassword ? "text" : "password"}" placeholder="Sifre *" value="${escapeHtml(login.sifre)}" data-auth-field="sifre" data-auth-scope="login" />
                <button type="button" class="auth-eye-btn" data-auth-toggle-visibility="login-password">${login.showPassword ? "Gizle" : "Goster"}</button>
                ${authFieldError(login.fieldErrors, "sifre")}
              </div>
              <div class="auth-helper-row">
                <label class="auth-checkline">
                  <input type="checkbox" ${login.rememberMe ? "checked" : ""} data-auth-toggle-checkbox="rememberMe" />
                  <span>Beni Hatirla</span>
                </label>
                <button type="button" class="auth-text-link">Sifremi Unuttum</button>
              </div>
              ${fakeRecaptcha(login.recaptcha, "loginRecaptcha")}
              <button type="button" class="auth-submit-btn" data-auth-submit="login" ${login.loading ? "disabled" : ""}>${login.loading ? "Giris Yapiliyor..." : "Giris Yap"}</button>
              ${login.error ? `<p class="auth-submit-error">${escapeHtml(login.error)}</p>` : ""}
            </div>
          ` : `
            <div class="auth-panel">
              <div class="auth-grid-two">
                <div class="auth-field-block">
                  <input class="auth-input" type="text" placeholder="Adin *" value="${escapeHtml(register.ad)}" data-auth-field="ad" data-auth-scope="register" />
                  ${authFieldError(register.fieldErrors, "ad")}
                </div>
                <div class="auth-field-block">
                  <input class="auth-input" type="text" placeholder="Soyadin *" value="${escapeHtml(register.soyad)}" data-auth-field="soyad" data-auth-scope="register" />
                  ${authFieldError(register.fieldErrors, "soyad")}
                </div>
              </div>
              <div class="auth-field-block">
                <input class="auth-input" type="email" placeholder="E-Posta *" value="${escapeHtml(register.email)}" data-auth-field="email" data-auth-scope="register" />
                ${authFieldError(register.fieldErrors, "email")}
              </div>
              <div class="auth-field-block">
                <input class="auth-input" type="text" placeholder="Cep Telefonu *" value="${escapeHtml(register.telefon)}" data-auth-field="telefon" data-auth-scope="register" />
                ${authFieldError(register.fieldErrors, "telefon")}
              </div>
              <div class="auth-field-block">
                <label class="auth-group-label">Dogum Tarihi</label>
                <div class="auth-grid-three">
                  <select class="auth-select" data-auth-field="dogumGun" data-auth-scope="register">${authSelectOptions(dayOptions, "Gun", register.dogumGun)}</select>
                  <select class="auth-select" data-auth-field="dogumAy" data-auth-scope="register">${authSelectOptions(monthNames, "Ay", register.dogumAy)}</select>
                  <select class="auth-select" data-auth-field="dogumYil" data-auth-scope="register">${authSelectOptions(yearOptions, "Yil", register.dogumYil)}</select>
                </div>
                ${authFieldError(register.fieldErrors, "dogumTarihi")}
              </div>
              <div class="auth-field-block">
                <label class="auth-group-label">Cinsiyet</label>
                <div class="auth-radio-row">
                  ${genderOptions.map((option) => `
                    <label class="auth-radio-line">
                      <input type="radio" name="auth-gender" value="${option}" ${register.cinsiyet === option ? "checked" : ""} data-auth-field="cinsiyet" data-auth-scope="register" />
                      <span>${option}</span>
                    </label>
                  `).join("")}
                </div>
                ${authFieldError(register.fieldErrors, "cinsiyet")}
              </div>
              <div class="auth-grid-two">
                <div class="auth-field-block auth-password-block">
                  <input class="auth-input" type="${register.showPassword ? "text" : "password"}" placeholder="Sifre *" value="${escapeHtml(register.sifre)}" data-auth-field="sifre" data-auth-scope="register" />
                  <button type="button" class="auth-eye-btn" data-auth-toggle-visibility="register-password">${register.showPassword ? "Gizle" : "Goster"}</button>
                  ${authFieldError(register.fieldErrors, "sifre")}
                </div>
                <div class="auth-field-block auth-password-block">
                  <input class="auth-input" type="${register.showPasswordRepeat ? "text" : "password"}" placeholder="Sifre Tekrar *" value="${escapeHtml(register.sifreTekrar)}" data-auth-field="sifreTekrar" data-auth-scope="register" />
                  <button type="button" class="auth-eye-btn" data-auth-toggle-visibility="register-password-repeat">${register.showPasswordRepeat ? "Gizle" : "Goster"}</button>
                  ${authFieldError(register.fieldErrors, "sifreTekrar")}
                </div>
              </div>
              <div class="auth-legal-copy">
                Mars Sinema Turizm ve Sportif Tesisler Isl. AS'ye verdigim iletisim onay formundaki iletisim bilgilerimin kullanilarak, tarafima tanitim, kampanya, promosyon, indirim, hediye, firsat ve CGV Cinema Club etkinliklerine iliskin bilgi vb. icerikte ticari ileti gonderilmesine onay veriyorum.
              </div>
              <div class="auth-checkbox-row">
                <label class="auth-checkline">
                  <input type="checkbox" ${register.smsOptIn ? "checked" : ""} data-auth-toggle-checkbox="smsOptIn" />
                  <span>SMS Almak Istiyorum.</span>
                </label>
                <label class="auth-checkline">
                  <input type="checkbox" ${register.emailOptIn ? "checked" : ""} data-auth-toggle-checkbox="emailOptIn" />
                  <span>E-Posta Almak Istiyorum.</span>
                </label>
              </div>
              <label class="auth-checkline auth-kvkk-line">
                <input type="checkbox" ${register.kvkkOnay ? "checked" : ""} data-auth-toggle-checkbox="kvkkOnay" />
                <span>6698 sayili Kisisel Verilerin Korunmasi Hakkindaki Kanunun kapsami ve sinirlari cercevesinde kullanilmasina onay verilir.</span>
              </label>
              ${authFieldError(register.fieldErrors, "kvkkOnay")}
              ${fakeRecaptcha(register.recaptcha, "registerRecaptcha")}
              <button type="button" class="auth-submit-btn" data-auth-submit="register" ${register.loading ? "disabled" : ""}>${register.loading ? "Kayit Yapiliyor..." : "Sinemator Uyesi Ol"}</button>
              ${register.error ? `<p class="auth-submit-error">${escapeHtml(register.error)}</p>` : ""}
            </div>
          `}
        </div>
      </section>
    </div>
  `;
}

function adminContent() {
  if (state.adminTab === "Salonlar") {
    return `
      <table class="admin-table">
        <thead><tr><th>Salon ID</th><th>Salon Adi</th><th>Kapasite</th></tr></thead>
        <tbody>
          ${mock.halls.map((hall) => `<tr><td>${hall.SalonID}</td><td>${escapeHtml(hall.SalonAd)}</td><td>${hall.Kapasite} Kisi</td></tr>`).join("")}
          ${mock.halls.length === 0 ? "<tr><td colspan='3'>Kayit bulunamadi.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Kullanicilar") {
    return `
      <table class="admin-table">
        <thead><tr><th>Musteri ID</th><th>Ad Soyad</th><th>Email</th></tr></thead>
        <tbody>
          ${mock.customers.map((customer) => `<tr><td>${customer.MusteriID}</td><td>${escapeHtml(customer.Ad)} ${escapeHtml(customer.Soyad)}</td><td>${escapeHtml(customer.Email)}</td></tr>`).join("")}
          ${mock.customers.length === 0 ? "<tr><td colspan='3'>Kayit bulunamadi.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Siparisler") {
    return `
      <table class="admin-table">
        <thead><tr><th>Bilet ID</th><th>Seans ID</th><th>Musteri ID</th><th>Koltuk No</th><th>Satis Tarihi</th></tr></thead>
        <tbody>
          ${mock.tickets.map((ticket) => {
            const dateObj = new Date(ticket.SatisTarihi);
            const formattedDate = Number.isNaN(dateObj.getTime()) ? ticket.SatisTarihi : dateObj.toLocaleString("tr-TR");
            return `<tr><td>${ticket.BiletID}</td><td>${ticket.SeansID}</td><td>${ticket.MusteriID}</td><td>${ticket.KoltukNo}</td><td>${formattedDate}</td></tr>`;
          }).join("")}
          ${mock.tickets.length === 0 ? "<tr><td colspan='5'>Kayit bulunamadi.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Rapor") {
    const revenue = mock.tickets.length * 150;
    return `
      <div class="report-grid">
        <div class="metric">Filmler<strong>${mock.movies.length}</strong></div>
        <div class="metric">Toplam Bilet<strong>${mock.tickets.length}</strong></div>
        <div class="metric">Tahmini Gelir<strong>${money(revenue)}</strong></div>
      </div>
    `;
  }

  return `
    <div class="admin-toolbar">
      <button class="btn small" data-open-add-movie>Film Ekle</button>
    </div>
    <br><br>
    <table class="admin-table">
      <thead><tr><th>Film ID</th><th>Film Adi</th><th>Tur</th><th>Sure</th><th>Islemler</th></tr></thead>
      <tbody>
        ${mock.movies.map((movie) => `
          <tr>
            <td>${movie.id}</td>
            <td>${escapeHtml(movie.name)}</td>
            <td>${escapeHtml(movie.genres.join(", "))}</td>
            <td>${movie.duration} dk</td>
            <td>
              <div class="admin-actions">
                <button data-edit-movie="${movie.id}">Duzenle</button>
                <button class="delete" data-delete-movie="${movie.id}">Sil</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function persistAuthState(user, rememberMe = true) {
  const payload = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(authStorageKeys.persistent, payload);
    sessionStorage.removeItem(authStorageKeys.session);
  } else {
    sessionStorage.setItem(authStorageKeys.session, payload);
    localStorage.removeItem(authStorageKeys.persistent);
  }
}

function restoreAuthState() {
  const rawPersistent = localStorage.getItem(authStorageKeys.persistent);
  const rawSession = sessionStorage.getItem(authStorageKeys.session);
  const raw = rawPersistent || rawSession;
  if (!raw) return;

  try {
    const user = JSON.parse(raw);
    if (user && typeof user === "object") {
      state.currentUser = user;
      state.isLoggedIn = true;
    }
  } catch (error) {
    localStorage.removeItem(authStorageKeys.persistent);
    sessionStorage.removeItem(authStorageKeys.session);
  }
}

function clearStoredAuth() {
  localStorage.removeItem(authStorageKeys.persistent);
  sessionStorage.removeItem(authStorageKeys.session);
}

function resetAuthErrors(scope) {
  if (scope === "login") {
    state.authLogin.fieldErrors = {};
    state.authLogin.error = "";
    return;
  }

  state.authRegister.fieldErrors = {};
  state.authRegister.error = "";
}

function openAuthModal(tab = "login") {
  state.isAuthModalOpen = true;
  state.authTab = tab;
  resetAuthErrors("login");
  resetAuthErrors("register");
  render();
}

function closeAuthModal() {
  state.isAuthModalOpen = false;
  render();
}

function setLoggedInUser(user, rememberMe = true) {
  state.currentUser = user;
  state.isLoggedIn = true;
  persistAuthState(user, rememberMe);
}

function validateLoginForm() {
  const errors = {};
  if (!state.authLogin.identifier.trim()) errors.identifier = "Cep telefonu veya e-posta girin.";
  if (!state.authLogin.sifre.trim()) errors.sifre = "Sifre girin.";
  state.authLogin.fieldErrors = errors;
  return Object.keys(errors).length === 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildBirthDate() {
  const register = state.authRegister;
  if (!register.dogumGun || !register.dogumAy || !register.dogumYil) return "";
  const monthIndex = monthNames.indexOf(register.dogumAy) + 1;
  return `${register.dogumYil}-${pad(monthIndex)}-${pad(register.dogumGun)}`;
}

function validateRegisterForm() {
  const register = state.authRegister;
  const errors = {};

  if (!register.ad.trim()) errors.ad = "Ad zorunludur.";
  if (!register.soyad.trim()) errors.soyad = "Soyad zorunludur.";
  if (!register.email.trim()) errors.email = "E-posta zorunludur.";
  else if (!isValidEmail(register.email.trim())) errors.email = "Gecerli bir e-posta girin.";
  if (!register.telefon.trim()) errors.telefon = "Telefon zorunludur.";
  if (!register.dogumGun || !register.dogumAy || !register.dogumYil) errors.dogumTarihi = "Dogum tarihi secin.";
  if (!register.cinsiyet) errors.cinsiyet = "Cinsiyet secin.";
  if (!register.sifre.trim()) errors.sifre = "Sifre zorunludur.";
  if (!register.sifreTekrar.trim()) errors.sifreTekrar = "Sifre tekrari zorunludur.";
  else if (register.sifre !== register.sifreTekrar) errors.sifreTekrar = "Sifreler eslesmiyor.";
  if (!register.kvkkOnay) errors.kvkkOnay = "KVKK onayi zorunludur.";

  state.authRegister.fieldErrors = errors;
  return Object.keys(errors).length === 0;
}

async function submitLogin() {
  resetAuthErrors("login");
  if (!validateLoginForm()) {
    render();
    return;
  }

  state.authLogin.loading = true;
  render();

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        identifier: state.authLogin.identifier.trim(),
        sifre: state.authLogin.sifre,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      state.authLogin.error = result.message || "E-posta/telefon veya sifre hatali.";
      return;
    }

    setLoggedInUser(result.user, state.authLogin.rememberMe);
    state.authLogin.loading = false;
    closeAuthModal();
    showToast("Giris basarili.", "success");
  } catch (error) {
    state.authLogin.error = "Giris sirasinda bir hata olustu.";
  } finally {
    state.authLogin.loading = false;
    render();
  }
}

async function submitRegister() {
  resetAuthErrors("register");
  if (!validateRegisterForm()) {
    render();
    return;
  }

  state.authRegister.loading = true;
  render();

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ad: state.authRegister.ad.trim(),
        soyad: state.authRegister.soyad.trim(),
        email: state.authRegister.email.trim(),
        telefon: state.authRegister.telefon.trim(),
        dogumTarihi: buildBirthDate(),
        cinsiyet: state.authRegister.cinsiyet,
        sifre: state.authRegister.sifre,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      state.authRegister.error = result.message || "Kayit sirasinda bir hata olustu.";
      return;
    }

    setLoggedInUser(result.user, true);
    state.authRegister.loading = false;
    closeAuthModal();
    showToast("Kayit basarili.", "success");
  } catch (error) {
    state.authRegister.error = "Kayit sirasinda bir hata olustu.";
  } finally {
    state.authRegister.loading = false;
    render();
  }
}

async function logoutUser() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    // no-op
  }

  clearStoredAuth();
  state.currentUser = null;
  state.isLoggedIn = false;
  showToast("Cikis yapildi.", "success");
}

function render() {
  const routes = {
    home,
    detail,
    seats,
    booking,
    otp,
    success,
    "admin-login": adminLogin,
    admin,
    movies: home,
  };

  app.innerHTML = `${(routes[currentRoute()] || home)()}${state.isAuthModalOpen ? authModal() : ""}`;
}

async function fetchAllDataFromAPI() {
  try {
    const [moviesRes, hallsRes, customersRes, sessionsRes, ticketsRes] = await Promise.all([
      fetch(`${API_BASE}/filmler`),
      fetch(`${API_BASE}/salonlar`),
      fetch(`${API_BASE}/musteriler`),
      fetch(`${API_BASE}/seanslar`),
      fetch(`${API_BASE}/biletler`),
    ]);

    const moviesData = await moviesRes.json();
    mock.movies = moviesData.map((film) => normalizeMovie(film));
    if (!state.selectedMovieId && mock.movies.length > 0) state.selectedMovieId = mock.movies[0].id;

    mock.halls = await hallsRes.json();
    mock.customers = await customersRes.json();
    mock.sessions = await sessionsRes.json();
    mock.tickets = await ticketsRes.json();

    render();
  } catch (error) {
    console.error("Veriler cekilemedi:", error);
    showToast("Veritabani baglantisi kurulamadi! Sunucuyu kontrol et.", "warning");
  }
}

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-open-auth-modal]")) {
    openAuthModal("login");
    return;
  }

  if (event.target.closest("[data-auth-logout]")) {
    await logoutUser();
    return;
  }

  if (event.target.closest("[data-auth-tab]")) {
    state.authTab = event.target.closest("[data-auth-tab]").dataset.authTab;
    render();
    return;
  }

  if (event.target.closest("[data-close-auth-modal]") && !event.target.closest(".auth-modal")) {
    closeAuthModal();
    return;
  }

  if (event.target.closest(".auth-modal-close")) {
    closeAuthModal();
    return;
  }

  const visibilityToggle = event.target.closest("[data-auth-toggle-visibility]");
  if (visibilityToggle) {
    const target = visibilityToggle.dataset.authToggleVisibility;
    if (target === "login-password") state.authLogin.showPassword = !state.authLogin.showPassword;
    if (target === "register-password") state.authRegister.showPassword = !state.authRegister.showPassword;
    if (target === "register-password-repeat") state.authRegister.showPasswordRepeat = !state.authRegister.showPasswordRepeat;
    render();
    return;
  }

  const checkboxToggle = event.target.closest("[data-auth-toggle-checkbox]");
  if (checkboxToggle) {
    const field = checkboxToggle.dataset.authToggleCheckbox;
    if (field === "rememberMe") state.authLogin.rememberMe = !state.authLogin.rememberMe;
    if (field === "loginRecaptcha") state.authLogin.recaptcha = !state.authLogin.recaptcha;
    if (field === "registerRecaptcha") state.authRegister.recaptcha = !state.authRegister.recaptcha;
    if (field === "smsOptIn") state.authRegister.smsOptIn = !state.authRegister.smsOptIn;
    if (field === "emailOptIn") state.authRegister.emailOptIn = !state.authRegister.emailOptIn;
    if (field === "kvkkOnay") state.authRegister.kvkkOnay = !state.authRegister.kvkkOnay;
    render();
    return;
  }

  const authSubmit = event.target.closest("[data-auth-submit]");
  if (authSubmit) {
    if (authSubmit.dataset.authSubmit === "login") await submitLogin();
    if (authSubmit.dataset.authSubmit === "register") await submitRegister();
    return;
  }

  if (event.target.closest("[data-open-add-movie]")) {
    state.isAddMovieModalOpen = true;
    state.isEditMovieModalOpen = false;
    state.selectedMovie = null;
    render();
    return;
  }

  if (event.target.closest("[data-edit-movie]")) {
    const button = event.target.closest("[data-edit-movie]");
    const movie = mock.movies.find((item) => item.id === Number(button.dataset.editMovie));
    if (movie) {
      state.selectedMovie = { ...movie };
      state.isEditMovieModalOpen = true;
      render();
    }
    return;
  }

  if (event.target.closest("[data-delete-movie]")) {
    const button = event.target.closest("[data-delete-movie]");
    state.selectedMovie = mock.movies.find((item) => item.id === Number(button.dataset.deleteMovie));
    state.isDeleteDialogOpen = true;
    render();
    return;
  }

  if (event.target.closest("[data-cancel-delete-movie]") || (event.target.closest("[data-close-movie-modal]") && !event.target.closest(".movie-modal"))) {
    state.isDeleteDialogOpen = false;
    state.isAddMovieModalOpen = false;
    state.isEditMovieModalOpen = false;
    render();
    return;
  }

  if (event.target.closest("[data-confirm-delete-movie]")) {
    if (state.selectedMovie) {
      try {
        await fetch(`${API_BASE}/filmler/${state.selectedMovie.id}`, { method: "DELETE" });
        showToast("Film basariyla silindi.", "success");
        await fetchAllDataFromAPI();
      } catch (error) {
        showToast("Silme islemi basarisiz oldu!", "warning");
      }
    }
    state.isDeleteDialogOpen = false;
    render();
    return;
  }

  const genreTag = event.target.closest("[data-genre]");
  if (genreTag) {
    genreTag.classList.toggle("selected");
    return;
  }

  const movieButton = event.target.closest("[data-movie]");
  if (movieButton) {
    state.selectedMovieId = Number(movieButton.dataset.movie);
    state.selectedSeats = [];
  }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton && !routeButton.disabled) {
    const targetRoute = routeButton.dataset.route;

    if (targetRoute === "success" && state.selectedSeats.length > 0) {
      routeButton.disabled = true;
      routeButton.textContent = "Biletler Kesiliyor...";

      try {
        let actualSessionId = 1;
        const selectedSession = mock.sessions.find((session) => session.FilmID === state.selectedMovieId);
        if (selectedSession) actualSessionId = selectedSession.SeansID;

        for (const seat of state.selectedSeats) {
          await fetch(`${API_BASE}/biletler`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              SeansID: actualSessionId,
              MusteriID: 1,
              KoltukNo: seat,
            }),
          });
        }

        await fetchAllDataFromAPI();
        state.selectedSeats.forEach((seat) => takenSeats.add(seat));
        state.selectedSeats = [];
        showToast("Biletiniz basariyla olusturuldu!", "success");
        setRoute("success");
      } catch (error) {
        showToast("Odeme alinirken hata olustu!", "warning");
        routeButton.disabled = false;
        routeButton.textContent = "Onayla";
      }
      return;
    }

    setRoute(targetRoute);
  }

  const dateButton = event.target.closest("[data-date]");
  if (dateButton) {
    state.selectedDate = dateButton.dataset.date;
    state.selectedTime = availableTimesForDate(state.selectedDate)[0] || "";
    render();
  }

  const timeButton = event.target.closest("[data-time]");
  if (timeButton) {
    state.selectedTime = timeButton.dataset.time;
    render();
  }

  const seatButton = event.target.closest("[data-seat]");
  if (seatButton && !seatButton.disabled) {
    const seat = seatButton.dataset.seat;
    state.selectedSeats = state.selectedSeats.includes(seat)
      ? state.selectedSeats.filter((value) => value !== seat)
      : [...state.selectedSeats, seat];
    render();
  }

  const adminTab = event.target.closest("[data-admin-tab]");
  if (adminTab) {
    state.adminTab = adminTab.dataset.adminTab;
    render();
  }
});

document.addEventListener("input", (event) => {
  const adminLoginField = event.target.closest("[data-admin-login-field]");
  if (adminLoginField) {
    state.adminLogin[adminLoginField.dataset.adminLoginField] = adminLoginField.value;
    return;
  }

  const authField = event.target.closest("[data-auth-field]");
  if (!authField) return;

  const scope = authField.dataset.authScope;
  const field = authField.dataset.authField;
  if (scope === "login") {
    state.authLogin[field] = authField.value;
    delete state.authLogin.fieldErrors[field];
    state.authLogin.error = "";
  }

  if (scope === "register") {
    state.authRegister[field] = authField.type === "radio" ? authField.value : authField.value;
    delete state.authRegister.fieldErrors[field];
    state.authRegister.error = "";
    if (field === "dogumGun" || field === "dogumAy" || field === "dogumYil") delete state.authRegister.fieldErrors.dogumTarihi;
  }
});

document.addEventListener("change", (event) => {
  const authField = event.target.closest("[data-auth-field]");
  if (!authField) return;

  if (authField.type === "radio" && authField.dataset.authScope === "register") {
    state.authRegister[authField.dataset.authField] = authField.value;
    delete state.authRegister.fieldErrors.cinsiyet;
    render();
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (event.target.closest("[data-admin-login-form]")) {
    if (state.adminLogin.username === "admin" && state.adminLogin.password === "admin123") {
      state.adminLogin = { username: "", password: "", error: "" };
      setRoute("admin");
    } else {
      state.adminLogin.error = "Hatali giris!";
      render();
    }
    return;
  }

  const form = event.target.closest("[data-movie-form]");
  if (!form) return;

  const isEdit = form.dataset.mode === "edit";
  const formData = new FormData(form);
  const movieData = {
    FilmAd: String(formData.get("name") || "").trim(),
    Tur: [...form.querySelectorAll("[data-genre].selected")].map((tag) => tag.dataset.genre).join(", "),
    Sure: Number(formData.get("duration")),
  };

  try {
    if (isEdit) {
      await fetch(`${API_BASE}/filmler/${state.selectedMovie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movieData),
      });
      showToast("Film basariyla guncellendi.", "success");
    } else {
      const response = await fetch(`${API_BASE}/filmler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movieData),
      });
      if (!response.ok) throw new Error("Sunucu eklemeyi reddetti");
      showToast("Film basariyla veritabanina eklendi!", "success");
    }

    state.isAddMovieModalOpen = false;
    state.isEditMovieModalOpen = false;
    await fetchAllDataFromAPI();
  } catch (error) {
    console.error(error);
    showToast("Veritabanina kayit yapilamadi! SQL'i kontrol et.", "warning");
  }
});

restoreAuthState();
fetchAllDataFromAPI();
