import { useEffect, useState } from "react";
import AddMovieModal from "../components/AddMovieModal";

const movieStorageKey = "movieList";

const defaultMovies = [
  {
    FilmID: 1,
    Poster: "assets/poster-kungfu.png",
    FilmAdi: "Kung Fu Panda 4",
    Turler: ["Animation", "Action"],
    Sure: 94,
    VizyonTarihi: "2024-03-08",
  },
  {
    FilmID: 2,
    Poster: "assets/poster-dune.png",
    FilmAdi: "Dune: Part Two",
    Turler: ["Sci-Fi", "Adventure"],
    Sure: 166,
    VizyonTarihi: "2024-03-01",
  },
  {
    FilmID: 3,
    Poster: "assets/poster-drive.png",
    FilmAdi: "Drive Away Dolls",
    Turler: ["Comedy", "Crime"],
    Sure: 84,
    VizyonTarihi: "2024-02-23",
  },
];

function normalizeMovie(movie, index) {
  const rawGenres = movie.Turler ?? movie.genres ?? [];
  const Turler = Array.isArray(rawGenres)
    ? rawGenres
    : String(rawGenres).split(",").map((genre) => genre.trim()).filter(Boolean);

  return {
    FilmID: Number(movie.FilmID ?? movie.id ?? index + 1),
    Poster: movie.Poster ?? movie.poster ?? "",
    FilmAdi: movie.FilmAdi ?? movie.name ?? "",
    Turler,
    Sure: Number(movie.Sure ?? movie.duration ?? 0),
    VizyonTarihi: movie.VizyonTarihi ?? movie.releaseDate ?? "",
  };
}

function loadMovies(initialMovies) {
  const fallback = initialMovies.length ? initialMovies : defaultMovies;

  try {
    const storedMovies = JSON.parse(localStorage.getItem(movieStorageKey) || "[]");
    return (Array.isArray(storedMovies) && storedMovies.length ? storedMovies : fallback).map(normalizeMovie);
  } catch {
    localStorage.removeItem(movieStorageKey);
    return fallback.map(normalizeMovie);
  }
}

export default function AdminMovies({ initialMovies = [] }) {
  const [movies, setMovies] = useState([]);
  const [movieSnapshot, setMovieSnapshot] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    const loadedMovies = loadMovies(initialMovies);
    setMovies(loadedMovies);
    setMovieSnapshot(JSON.parse(JSON.stringify(loadedMovies)));
  }, []);

  const showToast = (message, type = "success") => {
    setToast(message);
    setToastType(type);
    window.setTimeout(() => setToast(""), 3000);
  };

  const persistMovies = (nextMovies) => {
    localStorage.setItem(movieStorageKey, JSON.stringify(nextMovies));
    setMovieSnapshot(JSON.parse(JSON.stringify(nextMovies)));
  };

  const handleAddMovie = (movie) => {
    const nextId = movies.reduce((max, item) => Math.max(max, item.FilmID), 0) + 1;
    setMovies([...movies, { FilmID: nextId, ...movie }]);
    showToast("Film basariyla eklendi.");
  };

  const handleEditMovie = (movie) => {
    if (!selectedMovie) return;

    const nextMovies = movies.map((item) => (
      item.FilmID === selectedMovie.FilmID ? { ...movie, FilmID: selectedMovie.FilmID } : item
    ));
    setMovies(nextMovies);
    persistMovies(nextMovies);
    setIsEditOpen(false);
    setSelectedMovie(null);
    showToast("Film güncellendi.");
  };

  const openEditMovie = (movie) => {
    setSelectedMovie(movie);
    setIsEditOpen(true);
  };

  const openDeleteMovie = (movie) => {
    setSelectedMovie(movie);
    setIsDeleteOpen(true);
  };

  const cancelDeleteMovie = () => {
    setSelectedMovie(null);
    setIsDeleteOpen(false);
  };

  const confirmDeleteMovie = () => {
    if (!selectedMovie) return;

    const nextMovies = movies.filter((movie) => movie.FilmID !== selectedMovie.FilmID);
    setMovies(nextMovies);
    persistMovies(nextMovies);
    cancelDeleteMovie();
    showToast("Film gösterimden kaldırıldı.");
  };

  const handleSaveMovies = () => {
    if (JSON.stringify(movies) === JSON.stringify(movieSnapshot)) {
      showToast("Herhangi bir değişiklik yapılmamıştır.", "warning");
      return;
    }

    localStorage.setItem(movieStorageKey, JSON.stringify(movies));
    setMovieSnapshot(JSON.parse(JSON.stringify(movies)));
    showToast("Değişiklikler kaydedildi!");
  };

  return (
    <>
      <div className="admin-toolbar">
        <button className="btn small" type="button" onClick={() => setIsAddOpen(true)}>
          Add Movies
        </button>
        <button className="btn small save-movies-btn" type="button" onClick={handleSaveMovies}>
          Kaydet
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>FilmID</th>
            <th>Poster</th>
            <th>FilmAdi</th>
            <th>Turler</th>
            <th>Sure</th>
            <th>VizyonTarihi</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie.FilmID}>
              <td>{movie.FilmID}</td>
              <td><img src={movie.Poster} alt={movie.FilmAdi} /></td>
              <td>{movie.FilmAdi}</td>
              <td>{movie.Turler.join(", ")}</td>
              <td>{movie.Sure}</td>
              <td>{movie.VizyonTarihi}</td>
              <td>
                <div className="admin-actions">
                  <button type="button" onClick={() => openEditMovie(movie)}>Edit</button>
                  <button className="delete" type="button" onClick={() => openDeleteMovie(movie)}>x</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddMovieModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddMovie}
      />

      <AddMovieModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedMovie(null);
        }}
        onAdd={handleEditMovie}
        initialMovie={selectedMovie}
        title="Filmi Düzenle"
      />

      {isDeleteOpen && (
        <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && cancelDeleteMovie()}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-movie-title">
            <div className="modal-head">
              <h2 id="delete-movie-title">Filmi Kaldır</h2>
              <button className="modal-close" type="button" aria-label="Close" onClick={cancelDeleteMovie}>
                &times;
              </button>
            </div>
            <div className="confirm-body">
              <p>Bu filmi gösterimden kaldırmak istediğinize emin misiniz?</p>
              <div className="modal-actions">
                <button className="btn secondary modal-cancel" type="button" onClick={cancelDeleteMovie}>
                  Hayır, Vazgeç
                </button>
                <button className="btn danger confirm-delete" type="button" onClick={confirmDeleteMovie}>
                  Evet, Kaldır
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {toast && <div className={`toast ${toastType === "warning" ? "warning-toast" : "success-toast"}`}>{toast}</div>}
    </>
  );
}
