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
  toast: "",
  toastType: "success",
};

const app = document.querySelector("#app");
const seatRows = ["A", "B", "C", "D", "E", "F", "G"];
const takenSeats = new Set(["A3", "A4", "B8", "C2", "D5", "D6", "E7", "F1", "G9"]);
const showTimes = ["11:30", "13:30", "16:30", "20:30"];
const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const movieGenreOptions = ["Animasyon", "Aksiyon", "Bilim Kurgu", "Macera", "Dram", "Komedi", "Korku", "Romantik"];

const API_BASE = "http://localhost:3000/api";

function normalizeMovie(movie) {
  const rawGenres = movie.Tur ?? "Dram"; 
  const genres = Array.isArray(rawGenres)
    ? rawGenres
    : String(rawGenres).split(",").map((g) => g.trim()).filter(Boolean);

  return {
    id: Number(movie.FilmID),           
    name: movie.FilmAd ?? "",           
    duration: Number(movie.Sure ?? 0),  
    genres: genres,                     
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
  window.setTimeout(() => { state.toast = ""; render(); }, 3000);
}

function money(value) { return `₺${value.toFixed(2)}`; }
function pad(value) { return String(value).padStart(2, "0"); }
function dateKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
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
  return { day: dayNames[date.getDay()], date: `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}` };
}
function formatBookingDate(key) {
  const parts = formatDateParts(key);
  return `${parts.day}, ${parts.date}`;
}

function availableTimesForDate(key) {
  const now = new Date();
  const today = dateKey(now);
  if (key < today) return [];
  if (key > today) return showTimes;
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

function setRoute(route) { window.location.hash = route; }
function currentRoute() { return window.location.hash.replace("#", "") || "home"; }

function layout(content, options = {}) {
  const nav = options.hideAdmin
    ? ""
    : `<button class="btn secondary small" data-route="home">Vizyondakiler</button>
       <button class="btn small" data-route="admin-login">Yönetim</button>`;
  return `
    <section class="screen">
      <header class="topbar">
        <button class="brand" data-route="home" aria-label="Ana sayfa">
          <img class="brand-logo" src="assets/Bilet_in.png" alt="Bilet.in" onerror="this.remove()" />
          <span class="brand-mark"></span><span>Bilet.in</span>
        </button>
        <nav class="nav-actions">${nav}</nav>
      </header>
      <main class="main-shell">${content}</main>
    </section>
  `;
}

function home() {
  if (mock.movies.length === 0) {
    return layout(`<h1 class="center-title">Yükleniyor... 🍿</h1>`);
  }
  return layout(`
    <h1 class="center-title">Vizyondakiler</h1>
    <div class="movie-grid">
      ${mock.movies.map((movie) => `
        <button class="movie-card" data-movie="${movie.id}" data-route="detail">
          <span class="poster" style="background-image:url('${movie.poster}')"></span>
          <span class="movie-title">${movie.name}</span>
          <span class="movie-meta">${movie.genres.join(", ")}</span>
          <span class="movie-meta">${movie.duration} dk</span>
        </button>
      `).join("")}
    </div>
  `);
}

function detail() {
  const hasSchedule = ensureScheduleSelection();
  const movie = getMovie();
  if(!movie) return home();
  const dates = upcomingDates();
  const times = availableTimesForDate(state.selectedDate);

  return layout(`
    <div class="detail-layout">
      <section class="detail-panel">
        <h1>Seans Seçimi</h1>
        <div class="field-group">
          <label>Tarih Seçin</label>
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
        ${hasSchedule ? "" : `<p class="empty-note">Şu anda uygun gelecek seans bulunmuyor.</p>`}
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Hemen Bilet Al</button>
      </section>
      <aside class="summary-card">
        <div class="poster" style="background-image:url('${movie.poster}')"></div>
        <h2>${movie.name}</h2>
        <p>${movie.genres.join(", ")} | ${movie.duration} dk</p>
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Koltuk Seç</button>
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
      <h1 class="seat-title">Koltuk Seçimi</h1>
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
        <div><span class="tiny-label">Koltuk</span><div>${state.selectedSeats.length ? state.selectedSeats.join(", ") : "Koltuk seçin"}</div></div>
        <div><span class="tiny-label">Toplam Ödeme</span><div class="pay-value">${money(total)}</div></div>
        <button class="btn secondary" data-route="detail">Geri</button>
        <button class="btn" data-route="booking" ${state.selectedSeats.length ? "" : "disabled"}>Ödemeye Geç</button>
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
      <h1>Rezervasyon Detayı</h1>
      <div class="booking-lines">
        <p>Film Adı: <strong>${movie.name}</strong></p>
        <p>Tarih ve Saat: <strong>${formatBookingDate(state.selectedDate)} - ${state.selectedTime}</strong></p>
        <p>Koltuk: <strong>${state.selectedSeats.join(", ")}</strong></p>
        <p>Toplam: <strong>${money(total)}</strong></p>
      </div>
      <button class="btn" data-route="otp">Bileti Satın Al</button>
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
        <h1>Ödeme Başarılı</h1>
        <button class="btn" data-route="home">Yeni Bilet Al</button>
        <button class="btn secondary" data-route="home">Ana Sayfaya Dön</button>
      </div>
    </section>
  `, { hideAdmin: true });
}

function adminLogin() {
  return `
    <section class="form-screen admin-login">
      <div class="login-card">
        <h1>Yönetici Girişi</h1>
        <form class="input-stack" data-admin-login-form autocomplete="off" novalidate>
          <input name="username" value="${state.adminLogin.username}" placeholder="Kullanıcı adı" data-admin-login-field="username" />
          <input name="password" type="password" value="${state.adminLogin.password}" placeholder="Şifre" data-admin-login-field="password" />
          ${state.adminLogin.error ? `<p class="login-error">${state.adminLogin.error}</p>` : ""}
          <button class="btn" type="submit">Giriş Yap</button>
          <button class="btn secondary" type="button" data-route="home">Sinemaya Dön</button>
        </form>
      </div>
    </section>
  `;
}

function admin() {
  const tabs = ["Filmler", "Salonlar", "Kullanıcılar", "Siparişler", "Rapor"];
  return `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <h2>Yönetim</h2>
        ${tabs.map((tab) => `<button class="admin-tab ${state.adminTab === tab ? "active" : ""}" data-admin-tab="${tab}">${tab}</button>`).join("")}
      </aside>
      <main class="admin-main">
        <div class="admin-head">
          <h1>Yönetim Paneli</h1>
          <div class="admin-profile"><span class="avatar"></span> yönetici</div>
        </div>
        ${adminContent()}
      </main>
      ${state.isAddMovieModalOpen ? movieModal("add") : ""}
      ${state.isEditMovieModalOpen ? movieModal("edit") : ""}
      ${state.isDeleteDialogOpen ? deleteMovieDialog() : ""}
      ${state.toast ? `<div class="toast ${state.toastType === "warning" ? "warning-toast" : "success-toast"}">${state.toast}</div>` : ""}
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
          <h2>${isEdit ? "Filmi Düzenle" : "Film Ekle"}</h2>
          <button class="modal-close" type="button" data-close-movie-modal>&times;</button>
        </div>
        <form class="movie-form" data-movie-form data-mode="${mode}" novalidate>
          <div class="form-field">
            <label>Film Adı</label>
            <input name="name" type="text" autocomplete="off" value="${movie?.name || ""}" />
          </div>
          <div class="form-field">
            <span class="field-label">Tür (Tur)</span>
            <div class="genre-tags" data-genre-tags>
              ${movieGenreOptions.map((genre) => `
                <button type="button" class="genre-tag ${selectedGenres.includes(genre) ? "selected" : ""}" data-genre="${genre}">${genre}</button>
              `).join("")}
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label>Süre (Dakika)</label>
              <input name="duration" type="number" min="1" step="1" value="${movie?.duration || ""}" />
            </div>
          </div>
          <div class="modal-actions" style="margin-top:20px;">
            <button class="btn secondary modal-cancel" type="button" data-close-movie-modal>İptal</button>
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
          <h2>Filmi Kaldır</h2>
          <button class="modal-close" type="button" data-cancel-delete-movie>&times;</button>
        </div>
        <div class="confirm-body">
          <p>Bu filmi veritabanından kalıcı olarak silmek istediğinize emin misiniz?</p>
          <div class="modal-actions">
            <button class="btn secondary modal-cancel" type="button" data-cancel-delete-movie>Hayır, Vazgeç</button>
            <button class="btn danger confirm-delete" type="button" data-confirm-delete-movie>Evet, Sil</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

// === YENİ: DİĞER TABLOLARI DOLDURMA ===
function adminContent() {
  if (state.adminTab === "Salonlar") {
    return `
      <table class="admin-table">
        <thead><tr><th>Salon ID</th><th>Salon Adı</th><th>Kapasite</th></tr></thead>
        <tbody>
          ${mock.halls.map((h) => `<tr><td>${h.SalonID}</td><td>${h.SalonAd}</td><td>${h.Kapasite} Kişi</td></tr>`).join("")}
          ${mock.halls.length === 0 ? "<tr><td colspan='3'>Kayıt bulunamadı.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Kullanıcılar") {
    return `
      <table class="admin-table">
        <thead><tr><th>Müşteri ID</th><th>Ad Soyad</th><th>Email</th></tr></thead>
        <tbody>
          ${mock.customers.map((c) => `<tr><td>${c.MusteriID}</td><td>${c.Ad} ${c.Soyad}</td><td>${c.Email}</td></tr>`).join("")}
          ${mock.customers.length === 0 ? "<tr><td colspan='3'>Kayıt bulunamadı.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Siparişler") {
    return `
      <table class="admin-table">
        <thead><tr><th>Bilet ID</th><th>Seans ID</th><th>Müşteri ID</th><th>Koltuk No</th><th>Satış Tarihi</th></tr></thead>
        <tbody>
          ${mock.tickets.map((t) => {
            const dateObj = new Date(t.SatisTarihi);
            const formattedDate = isNaN(dateObj) ? t.SatisTarihi : dateObj.toLocaleString('tr-TR');
            return `<tr><td>${t.BiletID}</td><td>${t.SeansID}</td><td>${t.MusteriID}</td><td>${t.KoltukNo}</td><td>${formattedDate}</td></tr>`;
          }).join("")}
          ${mock.tickets.length === 0 ? "<tr><td colspan='5'>Kayıt bulunamadı.</td></tr>" : ""}
        </tbody>
      </table>`;
  }

  if (state.adminTab === "Rapor") {
    const revenue = mock.tickets.length * 150; // Varsayılan fiyatla hesaplama
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
      <thead><tr><th>Film ID</th><th>Film Adı</th><th>Tür</th><th>Süre</th><th>İşlemler</th></tr></thead>
      <tbody>
        ${mock.movies.map((movie) => `
          <tr>
            <td>${movie.id}</td>
            <td>${movie.name}</td>
            <td>${movie.genres.join(", ")}</td>
            <td>${movie.duration} dk</td>
            <td>
              <div class="admin-actions">
                <button data-edit-movie="${movie.id}">Düzenle</button>
                <button class="delete" data-delete-movie="${movie.id}">Sil</button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function render() {
  const routes = { home, detail, seats, booking, otp, success, "admin-login": adminLogin, admin, movies: home };
  app.innerHTML = (routes[currentRoute()] || home)();
}

// === TÜM VERİLERİ (API'DEN) AYNI ANDA ÇEKME ===
async function fetchAllDataFromAPI() {
  try {
    const [moviesRes, hallsRes, customersRes, sessionsRes, ticketsRes] = await Promise.all([
      fetch(`${API_BASE}/filmler`),
      fetch(`${API_BASE}/salonlar`),
      fetch(`${API_BASE}/musteriler`),
      fetch(`${API_BASE}/seanslar`),
      fetch(`${API_BASE}/biletler`)
    ]);

    const moviesData = await moviesRes.json();
    mock.movies = moviesData.map((film) => normalizeMovie(film));
    if(!state.selectedMovieId && mock.movies.length > 0) state.selectedMovieId = mock.movies[0].id;

    mock.halls = await hallsRes.json();
    mock.customers = await customersRes.json();
    mock.sessions = await sessionsRes.json();
    mock.tickets = await ticketsRes.json();

    render();
  } catch (error) {
    console.error("Veriler çekilemedi:", error);
    showToast("Veritabanı bağlantısı kurulamadı! Sunucuyu kontrol et.", "warning");
  }
}

// === TIKLAMA OLAYLARI (UI) ===
document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-open-add-movie]")) {
    state.isAddMovieModalOpen = true; state.isEditMovieModalOpen = false; state.selectedMovie = null; render(); return;
  }
  if (event.target.closest("[data-edit-movie]")) {
    const btn = event.target.closest("[data-edit-movie]");
    const movie = mock.movies.find((m) => m.id === Number(btn.dataset.editMovie));
    if (movie) { state.selectedMovie = { ...movie }; state.isEditMovieModalOpen = true; render(); }
    return;
  }
  if (event.target.closest("[data-delete-movie]")) {
    const btn = event.target.closest("[data-delete-movie]");
    state.selectedMovie = mock.movies.find((m) => m.id === Number(btn.dataset.deleteMovie));
    state.isDeleteDialogOpen = true; render(); return;
  }
  if (event.target.closest("[data-cancel-delete-movie]") || (event.target.closest("[data-close-movie-modal]") && !event.target.closest('.movie-modal'))) {
    state.isDeleteDialogOpen = false; state.isAddMovieModalOpen = false; state.isEditMovieModalOpen = false; render(); return;
  }

  // FİLM SİL (DELETE)
  if (event.target.closest("[data-confirm-delete-movie]")) {
    if (state.selectedMovie) {
      try {
        await fetch(`${API_BASE}/filmler/${state.selectedMovie.id}`, { method: 'DELETE' });
        showToast("Film başarıyla silindi.", "success");
        await fetchAllDataFromAPI(); // Tabloları komple yenile
      } catch (err) {
        showToast("Silme işlemi başarısız oldu!", "warning");
      }
    }
    state.isDeleteDialogOpen = false; render(); return;
  }

  const genreTag = event.target.closest("[data-genre]");
  if (genreTag) { genreTag.classList.toggle("selected"); return; }
  
  const movieButton = event.target.closest("[data-movie]");
  if (movieButton) { state.selectedMovieId = Number(movieButton.dataset.movie); state.selectedSeats = []; }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton && !routeButton.disabled) {
    const targetRoute = routeButton.dataset.route;

    // === BİLET SATIN ALMA (POST) İŞLEMİ ===
    // Eğer kullanıcı OTP ekranında 'Onayla' butonuna (success rotasına) basarsa:
    if (targetRoute === "success" && state.selectedSeats.length > 0) {
      
      routeButton.disabled = true; 
      routeButton.textContent = "Biletler Kesiliyor...";

      try {
        // Seçilen HER BİR koltuk için veritabanına ayrı bir bilet kayıt isteği gönderiyoruz
        for (const seat of state.selectedSeats) {
          await fetch(`${API_BASE}/biletler`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              SeansID: 1,     // Şimdilik demo olarak 1 nolu seansı kullanıyoruz
              MusteriID: 1,   // Şimdilik demo olarak 1 nolu müşteriyi (Sistemde olan) kullanıyoruz
              KoltukNo: seat
            })
          });
        }
        
        // Biletler veritabanına kaydedildikten sonra tabloları yenile
        await fetchAllDataFromAPI();
        
        // Seçilen koltukları dolu olarak işaretle ve seçimi sıfırla
        state.selectedSeats.forEach(s => takenSeats.add(s));
        state.selectedSeats = []; 

        showToast("Biletiniz başarıyla oluşturuldu!", "success");
        setRoute("success"); // İşlem bitince başarılı ekranına geç
      } catch (err) {
        showToast("Ödeme alınırken hata oluştu!", "warning");
        routeButton.disabled = false;
        routeButton.textContent = "Onayla";
      }
      return; // İşlem bitti, kodun aşağı inmesini engelle
    }

    // Normal sayfa geçişleri için
    setRoute(targetRoute);
  }

  const dateButton = event.target.closest("[data-date]");
  if (dateButton) { state.selectedDate = dateButton.dataset.date; state.selectedTime = availableTimesForDate(state.selectedDate)[0] || ""; render(); }
  const timeButton = event.target.closest("[data-time]");
  if (timeButton) { state.selectedTime = timeButton.dataset.time; render(); }
  const seatButton = event.target.closest("[data-seat]");
  if (seatButton && !seatButton.disabled) {
    const seat = seatButton.dataset.seat;
    state.selectedSeats = state.selectedSeats.includes(seat) ? state.selectedSeats.filter((s) => s !== seat) : [...state.selectedSeats, seat];
    render();
  }
  const adminTab = event.target.closest("[data-admin-tab]");
  if (adminTab) { state.adminTab = adminTab.dataset.adminTab; render(); }
});

document.addEventListener("input", (event) => {
  const adminLoginField = event.target.closest("[data-admin-login-field]");
  if (adminLoginField) { state.adminLogin[adminLoginField.dataset.adminLoginField] = adminLoginField.value; return; }
});

// === FİLM EKLE/GÜNCELLE (POST / PUT) ===
document.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  if (event.target.closest("[data-admin-login-form]")) {
    if (state.adminLogin.username === "admin" && state.adminLogin.password === "admin123") {
      state.adminLogin = { username: "", password: "", error: "" }; setRoute("admin");
    } else {
      state.adminLogin.error = "Hatalı giriş!"; render();
    }
    return;
  }

  const form = event.target.closest("[data-movie-form]");
  if (!form) return;

  const isEdit = form.dataset.mode === "edit";
  const formData = new FormData(form);
  
  const movieData = {
    FilmAd: String(formData.get("name") || "").trim(),
    Tur: [...form.querySelectorAll("[data-genre].selected")].map((t) => t.dataset.genre).join(", "),
    Sure: Number(formData.get("duration"))
  };

  try {
    if (isEdit) {
      await fetch(`${API_BASE}/filmler/${state.selectedMovie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
      });
      showToast("Film güncellendi.", "success");
    } else {
      await fetch(`${API_BASE}/filmler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
      });
      showToast("Film başarıyla eklendi.", "success");
    }

    state.isAddMovieModalOpen = false;
    state.isEditMovieModalOpen = false;
    await fetchAllDataFromAPI(); 

  } catch (err) {
    showToast("Kaydetme işlemi başarısız!", "warning");
  }
});

window.addEventListener("hashchange", render);

// Uygulamayı Başlat (Tüm Tabloları Çek)
fetchAllDataFromAPI();