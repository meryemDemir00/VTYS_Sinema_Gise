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
};

const app = document.querySelector("#app");
const seatRows = ["A", "B", "C", "D", "E", "F", "G"];
const takenSeats = new Set(["A3", "A4", "B8", "C2", "D5", "D6", "E7", "F1", "G9"]);
const showTimes = ["11:30", "13:30", "16:30", "20:30"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  return layout(`
    <h1 class="center-title">Now Showing</h1>
    <div class="movie-grid">
      ${mock.movies.map((movie) => `
        <button class="movie-card" data-movie="${movie.id}" data-route="detail">
          <span class="poster" style="background-image:url('${movie.poster}')"></span>
          <span class="movie-title">${movie.name}</span>
          <span class="movie-meta">${movie.genres.join(", ")} | ${movie.duration} min</span>
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
    </section>
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
    <button class="btn small">Add Movies</button>
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
            <td><div class="admin-actions"><button>Edit</button><button class="delete">x</button></div></td>
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
  };
  app.innerHTML = (routes[currentRoute()] || home)();
}

document.addEventListener("click", (event) => {
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
  const otp = event.target.closest("[data-otp]");
  if (!otp) return;
  otp.value = otp.value.replace(/\D/g, "").slice(0, 1);
  const next = document.querySelector(`[data-otp="${Number(otp.dataset.otp) + 1}"]`);
  if (otp.value && next) next.focus();
});

window.addEventListener("hashchange", render);
render();
