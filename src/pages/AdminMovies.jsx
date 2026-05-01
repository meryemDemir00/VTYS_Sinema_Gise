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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setMovies(loadMovies(initialMovies));
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const handleAddMovie = (movie) => {
    const nextId = movies.reduce((max, item) => Math.max(max, item.FilmID), 0) + 1;
    setMovies([...movies, { FilmID: nextId, ...movie }]);
    showToast("Film basariyla eklendi.");
  };

  const handleSaveMovies = () => {
    localStorage.setItem(movieStorageKey, JSON.stringify(movies));
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
                  <button type="button">Edit</button>
                  <button className="delete" type="button">x</button>
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

      {toast && <div className="toast success-toast">{toast}</div>}
    </>
  );
}
