const mock = {
  movies: [
    {
      id: 1,
      name: "Kung Fu Panda 4",
      genres: ["Animation", "Action"],
      director: "Mike Mitchell",
      duration: 94,
      releaseDate: "2024-03-08",
      poster: "assets/poster-kungfu.png",
      price: 150,
      rating: "7.1",
    },
    {
      id: 2,
      name: "Dune: Part Two",
      genres: ["Sci-Fi", "Adventure"],
      director: "Denis Villeneuve",
      duration: 166,
      releaseDate: "2024-03-01",
      poster: "assets/poster-dune.png",
      price: 180,
      rating: "8.5",
    },
    {
      id: 3,
      name: "Drive Away Dolls",
      genres: ["Comedy", "Crime"],
      director: "Ethan Coen",
      duration: 84,
      releaseDate: "2024-02-23",
      poster: "assets/poster-drive.png",
      price: 130,
      rating: "6.0",
    },
    {
      id: 4,
      name: "Godzilla x Kong",
      genres: ["Action", "Fantasy"],
      director: "Adam Wingard",
      duration: 115,
      releaseDate: "2024-03-29",
      poster: "assets/poster-godzilla.png",
      price: 170,
      rating: "6.6",
    },
    {
      id: 5,
      name: "Movie Title",
      genres: ["Drama"],
      director: "A. Kaya",
      duration: 112,
      releaseDate: "2024-04-12",
      poster: "assets/poster-fire.png",
      price: 120,
      rating: "7.4",
    },
    {
      id: 6,
      name: "Shadow Empire",
      genres: ["Thriller"],
      director: "S. Demir",
      duration: 101,
      releaseDate: "2024-04-19",
      poster: "assets/poster-shadow.png",
      price: 140,
      rating: "7.0",
    },
  ],
  halls: [
    { id: 1, name: "Salon 1", capacity: 70, feature: "IMAX" },
    { id: 2, name: "Salon 2", capacity: 70, feature: "Dolby Atmos" },
  ],
  sessions: [
    { id: 1, movieId: 1, hallId: 1, date: "Mon, 15 Apr 2024", times: ["13:30", "16:30", "20:30"] },
    { id: 2, movieId: 2, hallId: 2, date: "Tue, 16 Apr 2024", times: ["12:30", "15:00", "21:00"] },
    { id: 3, movieId: 4, hallId: 1, date: "Mon, 22 Apr 2024", times: ["11:30", "18:30", "20:00"] },
  ],
  customers: [
    { id: 1, name: "Ayse Yilmaz", email: "ayse@example.com", phone: "0555 120 18 18" },
    { id: 2, name: "Mert Kaya", email: "mert@example.com", phone: "0555 882 44 10" },
  ],
  tickets: [
    { id: 1, sessionId: 1, customerId: 1, seatNo: "C4", price: 150, saleDate: "2024-04-15" },
    { id: 2, sessionId: 2, customerId: 2, seatNo: "E6", price: 180, saleDate: "2024-04-16" },
  ],
};

const state = {
  selectedMovieId: 1,
  selectedDate: "",
  selectedTime: "",
  selectedSeats: [],
  adminTab: "Movies",
  isAddMovieModalOpen: false,
  isEditMovieModalOpen: false,
  isDeleteDialogOpen: false,
  selectedMovie: null,
  addMoviePoster: "",
  toast: "",
  toastType: "success",
  movieSnapshot: [],
};

const app = document.querySelector("#app");
const seatRows = ["A", "B", "C", "D", "E", "F", "G"];
const takenSeats = new Set(["A3", "A4", "B8", "C2", "D5", "D6", "E7", "F1", "G9"]);
const showTimes = ["11:30", "13:30", "16:30", "20:30"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const movieGenreOptions = ["Animation", "Action", "Sci-Fi", "Adventure", "Drama", "Comedy", "Horror", "Romance"];
const movieStorageKey = "movieList";

function normalizeMovie(movie, index = 0) {
  const rawGenres = movie.genres ?? movie.Turler ?? [];
  const genres = Array.isArray(rawGenres)
    ? rawGenres
    : String(rawGenres).split(",").map((genre) => genre.trim()).filter(Boolean);

  return {
    id: Number(movie.id ?? movie.FilmID ?? index + 1),
    name: movie.name ?? movie.FilmAdi ?? "",
    genres,
    director: movie.director ?? "",
    duration: Number(movie.duration ?? movie.Sure ?? 0),
    releaseDate: movie.releaseDate ?? movie.VizyonTarihi ?? "",
    poster: movie.poster ?? movie.Poster ?? "",
    price: Number(movie.price ?? 150),
    rating: movie.rating ?? "-",
  };
}

function loadMoviesFromStorage() {
  try {
    const storedMovies = JSON.parse(localStorage.getItem(movieStorageKey) || "[]");
    if (Array.isArray(storedMovies) && storedMovies.length) {
      mock.movies = storedMovies.map(normalizeMovie);
    }
  } catch {
    localStorage.removeItem(movieStorageKey);
  }
}

function snapshotMovies() {
  return JSON.parse(JSON.stringify(mock.movies));
}

function saveMoviesToStorage() {
  localStorage.setItem(movieStorageKey, JSON.stringify(mock.movies));
}

function persistMovies() {
  saveMoviesToStorage();
  state.movieSnapshot = snapshotMovies();
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

loadMoviesFromStorage();
state.movieSnapshot = snapshotMovies();

function money(value) {
  return `RM ${value.toFixed(2)}`;
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
    if (availableTimesForDate(key).length > 0) {
      dates.push(key);
    }
  }

  return dates;
}

function ensureScheduleSelection() {
  const dates = upcomingDates();
  if (!dates.length) return false;

  if (!dates.includes(state.selectedDate)) {
    state.selectedDate = dates[0];
  }

  const times = availableTimesForDate(state.selectedDate);
  if (!times.includes(state.selectedTime)) {
    state.selectedTime = times[0] || "";
  }

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

function layout(content, options = {}) {
  const nav = options.hideAdmin
    ? ""
    : `
          <button class="btn secondary small" data-route="home">Now Showing</button>
          <button class="btn small" data-route="admin-login">Admin</button>
        `;
  return `
    <section class="screen">
      <header class="topbar">
        <button class="brand" data-route="home" aria-label="Ana sayfa">
          <span class="brand-mark"></span><span>CineDesk</span>
        </button>
        <nav class="nav-actions">
          ${nav}
        </nav>
      </header>
      <main class="main-shell">${content}</main>
    </section>
  `;
}

function home() {
  loadMoviesFromStorage();

  return layout(`
    <h1 class="center-title">Now Showing</h1>
    <div class="movie-grid">
      ${mock.movies.map((movie) => `
        <button class="movie-card" data-movie="${movie.id}" data-route="detail">
          <span class="poster" style="background-image:url('${movie.poster}')"></span>
          <span class="movie-title">${movie.name}</span>
          <span class="movie-meta">${movie.genres.join(", ")}</span>
          <span class="movie-meta">${movie.duration} min | ${movie.releaseDate}</span>
        </button>
      `).join("")}
    </div>
  `);
}

function detail() {
  const hasSchedule = ensureScheduleSelection();
  const movie = getMovie();
  const dates = upcomingDates();
  const times = availableTimesForDate(state.selectedDate);

  return layout(`
    <div class="detail-layout">
      <section class="detail-panel">
        <h1>Theater</h1>
        <div class="field-group">
          <label>Select Date</label>
          <div class="chip-row">
            ${dates.map((date) => {
              const parts = formatDateParts(date);
              return `<button class="chip ${state.selectedDate === date ? "active" : ""}" data-date="${date}">${parts.day}<br>${parts.date}</button>`;
            }).join("")}
          </div>
        </div>
        <div class="field-group">
          <label>Time</label>
          <div class="chip-row">
            ${times.map((time) => `<button class="chip ${state.selectedTime === time ? "active" : ""}" data-time="${time}">${time}</button>`).join("")}
          </div>
        </div>
        ${hasSchedule ? "" : `<p class="empty-note">No future sessions are available right now.</p>`}
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Book Now</button>
      </section>
      <aside class="summary-card">
        <div class="poster" style="background-image:url('${movie.poster}')"></div>
        <h2>${movie.name}</h2>
        <p>${movie.genres.join(", ")} | ${movie.duration} min</p>
        <p>Director: ${movie.director}</p>
        <p>Release: ${movie.releaseDate}</p>
        <button class="btn" data-route="seats" ${hasSchedule ? "" : "disabled"}>Select Seat</button>
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
      <h1 class="seat-title">Seat</h1>
      <div class="seat-map-wrap">
        <div class="seat-map">
          ${seats.map((seat) => {
            const isTaken = takenSeats.has(seat);
            const isSelected = state.selectedSeats.includes(seat);
            return `<button class="seat ${isTaken ? "taken" : ""} ${isSelected ? "selected" : ""}" ${isTaken ? "disabled" : ""} data-seat="${seat}">${seat}</button>`;
          }).join("")}
        </div>
        <div class="screen-bar">SCREEN</div>
      </div>
      <div class="payment-strip">
        <div>
          <span class="tiny-label">Seat</span>
          <div>${state.selectedSeats.length ? state.selectedSeats.join(", ") : "Choose seat"}</div>
        </div>
        <div>
          <span class="tiny-label">Total Payment</span>
          <div class="pay-value">${money(total)}</div>
        </div>
        <button class="btn secondary" data-route="detail">Back</button>
        <button class="btn" data-route="booking" ${state.selectedSeats.length ? "" : "disabled"}>Proceed Payment</button>
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
      <h1>Booking Detail</h1>
      <div class="booking-lines">
        <p>Movie Title: <strong>${movie.name}</strong></p>
        <p>Cinema: <strong>XXI Cinema</strong></p>
        <p>Screen: <strong>IMAX</strong></p>
        <p>Date & Time: <strong>${formatBookingDate(state.selectedDate)} - ${state.selectedTime}</strong></p>
        <p>Seat: <strong>${state.selectedSeats.join(", ")}</strong></p>
        <p>Ticket Price: <strong>${money(movie.price)}</strong></p>
        <p>Admin Fee: <strong>RM 0.00</strong></p>
        <p>Total: <strong>${money(total)}</strong></p>
      </div>
      <button class="btn" data-route="otp">Checkout Ticket</button>
    </section>
  `);
}

function otp() {
  return layout(`
    <section class="form-screen">
      <div class="otp-card dark-card">
        <h1>Enter Otp</h1>
        <div class="otp-inputs">
          ${[0, 1, 2, 3].map((index) => `<input maxlength="1" inputmode="numeric" data-otp="${index}" value="${index === 0 ? "5" : ""}" />`).join("")}
        </div>
        <button class="btn" data-route="success">Submit</button>
      </div>
    </section>
  `, { hideAdmin: true });
}

function success() {
  return layout(`
    <section class="form-screen">
      <div class="success-card dark-card">
        <div class="success-mark">&check;</div>
        <h1>Payment Success</h1>
        <button class="btn" data-route="home">Order Ticket</button>
        <button class="btn secondary" data-route="home">Back to homepage</button>
      </div>
    </section>
  `, { hideAdmin: true });
}

function adminLogin() {
  return `
    <section class="form-screen admin-login">
      <div class="login-card">
        <h1>Admin Login</h1>
        <div class="input-stack">
          <input placeholder="Username" value="administrator" />
          <input placeholder="Password" type="password" value="123456" />
          <button class="btn" data-route="admin">Login</button>
          <button class="btn secondary" data-route="home">Back to cinema</button>
        </div>
      </div>
    </section>
  `;
}

function admin() {
  const tabs = ["Movies", "Theaters", "Users", "Orders", "Report"];
  return `
    <section class="admin-shell">
      <aside class="admin-sidebar">
        <h2>Movies</h2>
        ${tabs.map((tab) => `<button class="admin-tab ${state.adminTab === tab ? "active" : ""}" data-admin-tab="${tab}">${tab}</button>`).join("")}
      </aside>
      <main class="admin-main">
        <div class="admin-head">
          <h1>Admin Dashboard</h1>
          <div class="admin-profile"><span class="avatar"></span> administrator</div>
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
  const poster = state.addMoviePoster || movie?.poster || "";

  return `
    <div class="modal-overlay" data-close-movie-modal>
      <section class="movie-modal" role="dialog" aria-modal="true" aria-labelledby="add-movie-title">
        <div class="modal-head">
          <h2 id="add-movie-title">${isEdit ? "Filmi Düzenle" : "Add Movie"}</h2>
          <button class="modal-close" type="button" aria-label="Close" data-close-movie-modal>&times;</button>
        </div>
        <form class="movie-form" data-movie-form data-mode="${mode}" novalidate>
          <div class="form-field">
            <label for="movie-name">FilmAdi</label>
            <input id="movie-name" name="name" type="text" autocomplete="off" value="${movie?.name || ""}" />
            <p class="field-error" data-error-for="name"></p>
          </div>

          <div class="form-field">
            <span class="field-label">Turler</span>
            <div class="genre-tags" data-genre-tags>
              ${movieGenreOptions.map((genre) => `
                <button type="button" class="genre-tag ${selectedGenres.includes(genre) ? "selected" : ""}" data-genre="${genre}" aria-pressed="${selectedGenres.includes(genre) ? "true" : "false"}">${genre}</button>
              `).join("")}
            </div>
            <p class="field-error" data-error-for="genres"></p>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="movie-duration">Sure</label>
              <input id="movie-duration" name="duration" type="number" min="1" step="1" value="${movie?.duration || ""}" />
              <p class="field-error" data-error-for="duration"></p>
            </div>
            <div class="form-field">
              <label for="movie-release-date">VizyonTarihi</label>
              <input id="movie-release-date" name="releaseDate" type="date" value="${movie?.releaseDate || ""}" />
              <p class="field-error" data-error-for="releaseDate"></p>
            </div>
          </div>

          <div class="form-field">
            <label for="movie-poster">Poster</label>
            <input id="movie-poster" name="poster" type="file" accept="image/*" />
            <div class="poster-preview ${poster ? "has-image" : ""}" data-poster-preview>
              ${poster ? `<img src="${poster}" alt="Poster preview">` : `<span>Poster preview</span>`}
            </div>
            <p class="field-error" data-error-for="poster"></p>
          </div>

          <div class="modal-actions">
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
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-movie-title">
        <div class="modal-head">
          <h2 id="delete-movie-title">Filmi Kaldır</h2>
          <button class="modal-close" type="button" aria-label="Close" data-cancel-delete-movie>&times;</button>
        </div>
        <div class="confirm-body">
          <p>Bu filmi gösterimden kaldırmak istediğinize emin misiniz?</p>
          <div class="modal-actions">
            <button class="btn secondary modal-cancel" type="button" data-cancel-delete-movie>Hayır, Vazgeç</button>
            <button class="btn danger confirm-delete" type="button" data-confirm-delete-movie>Evet, Kaldır</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function adminContent() {
  if (state.adminTab === "Orders") {
    return table(["Ticket ID", "Movie", "Customer", "Seat", "Price", "Sale Date"], mock.tickets.map((ticket) => {
      const session = mock.sessions.find((item) => item.id === ticket.sessionId);
      const movie = getMovie(session.movieId);
      const customer = mock.customers.find((item) => item.id === ticket.customerId);
      return [ticket.id, movie.name, customer.name, ticket.seatNo, money(ticket.price), ticket.saleDate];
    }));
  }

  if (state.adminTab === "Report") {
    const revenue = mock.tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    return `
      <div class="report-grid">
        <div class="metric">Movies<strong>${mock.movies.length}</strong></div>
        <div class="metric">Tickets<strong>${mock.tickets.length}</strong></div>
        <div class="metric">Revenue<strong>${money(revenue)}</strong></div>
      </div>
      ${table(["Movie", "Tickets Sold", "Revenue"], mock.movies.slice(0, 4).map((movie) => {
        const sold = mock.tickets.filter((ticket) => mock.sessions.find((s) => s.id === ticket.sessionId)?.movieId === movie.id).length;
        return [movie.name, sold, money(sold * movie.price)];
      }))}
    `;
  }

  if (state.adminTab === "Theaters") {
    return table(["SalonID", "SalonAdi", "Kapasite", "Ozellik"], mock.halls.map((hall) => [hall.id, hall.name, hall.capacity, hall.feature]));
  }

  if (state.adminTab === "Users") {
    return table(["MusteriID", "AdSoyad", "e-posta", "telefon"], mock.customers.map((customer) => [customer.id, customer.name, customer.email, customer.phone]));
  }

  return `
    <div class="admin-toolbar">
      <button class="btn small" data-open-add-movie>Add Movies</button>
      <button class="btn small save-movies-btn" data-save-movies>Kaydet</button>
    </div>
    <br><br>
    <table class="admin-table">
      <thead><tr><th>FilmID</th><th>Poster</th><th>FilmAdi</th><th>Turler</th><th>Sure</th><th>VizyonTarihi</th><th></th></tr></thead>
      <tbody>
        ${mock.movies.map((movie) => `
          <tr>
            <td>${movie.id}</td>
            <td><img src="${movie.poster}" alt="${movie.name}"></td>
            <td>${movie.name}</td>
            <td>${movie.genres.join(", ")}</td>
            <td>${movie.duration}</td>
            <td>${movie.releaseDate}</td>
            <td><div class="admin-actions"><button data-edit-movie="${movie.id}">Edit</button><button class="delete" data-delete-movie="${movie.id}">x</button></div></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function table(headers, rows) {
  return `
    <table class="admin-table">
      <thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
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
  app.innerHTML = (routes[currentRoute()] || home)();
}

document.addEventListener("click", (event) => {
  const openAddMovie = event.target.closest("[data-open-add-movie]");
  if (openAddMovie) {
    state.isAddMovieModalOpen = true;
    state.isEditMovieModalOpen = false;
    state.selectedMovie = null;
    state.addMoviePoster = "";
    render();
    return;
  }

  const editMovie = event.target.closest("[data-edit-movie]");
  if (editMovie) {
    const movie = mock.movies.find((item) => item.id === Number(editMovie.dataset.editMovie));
    if (movie) {
      state.selectedMovie = { ...movie, genres: [...movie.genres] };
      state.addMoviePoster = movie.poster;
      state.isEditMovieModalOpen = true;
      render();
    }
    return;
  }

  const deleteMovie = event.target.closest("[data-delete-movie]");
  if (deleteMovie) {
    const movie = mock.movies.find((item) => item.id === Number(deleteMovie.dataset.deleteMovie));
    if (movie) {
      state.selectedMovie = movie;
      state.isDeleteDialogOpen = true;
      render();
    }
    return;
  }

  const cancelDeleteMovie = event.target.closest("[data-cancel-delete-movie]");
  if (cancelDeleteMovie && (event.target === cancelDeleteMovie || event.target.closest(".modal-close, .modal-cancel"))) {
    state.isDeleteDialogOpen = false;
    state.selectedMovie = null;
    render();
    return;
  }

  const confirmDeleteMovie = event.target.closest("[data-confirm-delete-movie]");
  if (confirmDeleteMovie && state.selectedMovie) {
    mock.movies = mock.movies.filter((movie) => movie.id !== state.selectedMovie.id);
    persistMovies();
    state.isDeleteDialogOpen = false;
    state.selectedMovie = null;
    showToast("Film gösterimden kaldırıldı.", "success");
    return;
  }

  const saveMovies = event.target.closest("[data-save-movies]");
  if (saveMovies) {
    if (JSON.stringify(mock.movies) === JSON.stringify(state.movieSnapshot)) {
      showToast("Herhangi bir değişiklik yapılmamıştır.", "warning");
      return;
    }

    saveMoviesToStorage();
    state.movieSnapshot = snapshotMovies();
    showToast("Değişiklikler kaydedildi!", "success");
    return;
  }

  const closeMovieModal = event.target.closest("[data-close-movie-modal]");
  if (closeMovieModal && (event.target === closeMovieModal || event.target.closest(".modal-close, .modal-cancel"))) {
    state.isAddMovieModalOpen = false;
    state.isEditMovieModalOpen = false;
    state.selectedMovie = null;
    state.addMoviePoster = "";
    render();
    return;
  }

  const genreTag = event.target.closest("[data-genre]");
  if (genreTag) {
    genreTag.classList.toggle("selected");
    genreTag.setAttribute("aria-pressed", genreTag.classList.contains("selected") ? "true" : "false");
    const error = document.querySelector('[data-error-for="genres"]');
    if (error) error.textContent = "";
    return;
  }

  const movieButton = event.target.closest("[data-movie]");
  if (movieButton) {
    state.selectedMovieId = Number(movieButton.dataset.movie);
    state.selectedSeats = [];
  }

  const routeButton = event.target.closest("[data-route]");
  if (routeButton && !routeButton.disabled) {
    setRoute(routeButton.dataset.route);
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
      ? state.selectedSeats.filter((item) => item !== seat)
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
  const moviePoster = event.target.closest('[name="poster"]');
  if (moviePoster) {
    const file = moviePoster.files?.[0];
    const error = document.querySelector('[data-error-for="poster"]');
    if (error) error.textContent = "";
    if (!file) {
      state.addMoviePoster = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.addMoviePoster = String(reader.result);
      const preview = document.querySelector("[data-poster-preview]");
      if (preview) {
        preview.classList.add("has-image");
        preview.innerHTML = `<img src="${state.addMoviePoster}" alt="Poster preview">`;
      }
    });
    reader.readAsDataURL(file);
    return;
  }

  const otp = event.target.closest("[data-otp]");
  if (!otp) return;
  otp.value = otp.value.replace(/\D/g, "").slice(0, 1);
  const next = document.querySelector(`[data-otp="${Number(otp.dataset.otp) + 1}"]`);
  if (otp.value && next) next.focus();
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-movie-form]");
  if (!form) return;
  event.preventDefault();

  const isEdit = form.dataset.mode === "edit";
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const duration = Number(formData.get("duration"));
  const releaseDate = String(formData.get("releaseDate") || "");
  const genres = [...form.querySelectorAll("[data-genre].selected")].map((tag) => tag.dataset.genre);

  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });

  const errors = {};
  if (!name) errors.name = "FilmAdi zorunludur.";
  if (!genres.length) errors.genres = "En az bir tur secin.";
  if (!duration || duration < 1) errors.duration = "Sure zorunludur.";
  if (!releaseDate) errors.releaseDate = "VizyonTarihi zorunludur.";
  if (!state.addMoviePoster) errors.poster = "Poster zorunludur.";

  Object.entries(errors).forEach(([field, message]) => {
    const error = form.querySelector(`[data-error-for="${field}"]`);
    if (error) error.textContent = message;
  });

  if (Object.keys(errors).length) return;

  const movieData = {
    id: isEdit ? state.selectedMovie.id : mock.movies.reduce((max, movie) => Math.max(max, movie.id), 0) + 1,
    name,
    genres,
    director: isEdit ? state.selectedMovie.director : "",
    duration,
    releaseDate,
    poster: state.addMoviePoster,
    price: isEdit ? state.selectedMovie.price : 150,
    rating: isEdit ? state.selectedMovie.rating : "-",
  };

  if (isEdit) {
    mock.movies = mock.movies.map((movie) => (movie.id === state.selectedMovie.id ? movieData : movie));
    persistMovies();
  } else {
    mock.movies.push(movieData);
  }

  state.isAddMovieModalOpen = false;
  state.isEditMovieModalOpen = false;
  state.selectedMovie = null;
  state.addMoviePoster = "";
  showToast(isEdit ? "Film güncellendi." : "Film basariyla eklendi.", "success");
});

window.addEventListener("hashchange", render);
window.addEventListener("storage", (event) => {
  if (event.key === movieStorageKey) {
    loadMoviesFromStorage();
    state.movieSnapshot = snapshotMovies();
    render();
  }
});
render();
