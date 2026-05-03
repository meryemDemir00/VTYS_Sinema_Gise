import { useEffect, useState } from "react";

const movieStorageKey = "movieList";

const defaultMovies = [
  {
    FilmID: 1,
    Poster: "assets/poster-kungfu.png",
    FilmAdi: "Kung Fu Panda 4",
    Turler: ["Animasyon", "Aksiyon"],
    Sure: 94,
    VizyonTarihi: "2024-03-08",
  },
  {
    FilmID: 2,
    Poster: "assets/poster-dune.png",
    FilmAdi: "Dune: Part Two",
    Turler: ["Bilim Kurgu", "Macera"],
    Sure: 166,
    VizyonTarihi: "2024-03-01",
  },
  {
    FilmID: 3,
    Poster: "assets/poster-drive.png",
    FilmAdi: "Drive Away Dolls",
    Turler: ["Komedi", "Suç"],
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

function loadMovies() {
  try {
    const storedMovies = JSON.parse(localStorage.getItem(movieStorageKey) || "[]");
    return (Array.isArray(storedMovies) && storedMovies.length ? storedMovies : defaultMovies).map(normalizeMovie);
  } catch {
    localStorage.removeItem(movieStorageKey);
    return defaultMovies.map(normalizeMovie);
  }
}

export default function UserMovies() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    setMovies(loadMovies());

    const syncMovies = (event) => {
      if (event.key === movieStorageKey) {
        setMovies(loadMovies());
      }
    };

    window.addEventListener("storage", syncMovies);
    return () => window.removeEventListener("storage", syncMovies);
  }, []);

  return (
    <section>
      <h1 className="center-title">Vizyondakiler</h1>
      <div className="movie-grid">
        {movies.map((movie) => (
          <article className="movie-card" key={movie.FilmID}>
            <span className="poster" style={{ backgroundImage: `url('${movie.Poster}')` }} />
            <span className="movie-title">{movie.FilmAdi}</span>
            <span className="movie-meta">{movie.Turler.join(", ")}</span>
            <span className="movie-meta">{movie.Sure} dk | {movie.VizyonTarihi}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
