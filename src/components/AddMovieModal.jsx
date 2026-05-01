import { useState } from "react";

const genreOptions = ["Animation", "Action", "Sci-Fi", "Adventure", "Drama", "Comedy", "Horror", "Romance"];

export default function AddMovieModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    FilmAdi: "",
    Turler: [],
    Sure: "",
    VizyonTarihi: "",
    Poster: null,
    posterPreview: "",
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const resetAndClose = () => {
    setForm({ FilmAdi: "", Turler: [], Sure: "", VizyonTarihi: "", Poster: null, posterPreview: "" });
    setErrors({});
    onClose();
  };

  const toggleGenre = (genre) => {
    setForm((current) => ({
      ...current,
      Turler: current.Turler.includes(genre)
        ? current.Turler.filter((item) => item !== genre)
        : [...current.Turler, genre],
    }));
    setErrors((current) => ({ ...current, Turler: "" }));
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setForm((current) => ({
        ...current,
        Poster: file,
        posterPreview: String(reader.result),
      }));
    });
    reader.readAsDataURL(file);
    setErrors((current) => ({ ...current, Poster: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.FilmAdi.trim()) nextErrors.FilmAdi = "FilmAdi zorunludur.";
    if (!form.Turler.length) nextErrors.Turler = "En az bir tur secin.";
    if (!form.Sure) nextErrors.Sure = "Sure zorunludur.";
    if (!form.VizyonTarihi) nextErrors.VizyonTarihi = "VizyonTarihi zorunludur.";
    if (!form.Poster) nextErrors.Poster = "Poster zorunludur.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onAdd({
      FilmAdi: form.FilmAdi.trim(),
      Turler: form.Turler,
      Sure: Number(form.Sure),
      VizyonTarihi: form.VizyonTarihi,
      Poster: form.posterPreview,
    });
    resetAndClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}>
      <section className="movie-modal" role="dialog" aria-modal="true" aria-labelledby="add-movie-title">
        <div className="modal-head">
          <h2 id="add-movie-title">Add Movie</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={resetAndClose}>
            &times;
          </button>
        </div>

        <form className="movie-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="movie-name">FilmAdi</label>
            <input
              id="movie-name"
              type="text"
              value={form.FilmAdi}
              onChange={(event) => setForm({ ...form, FilmAdi: event.target.value })}
            />
            {errors.FilmAdi && <p className="field-error">{errors.FilmAdi}</p>}
          </div>

          <div className="form-field">
            <span className="field-label">Turler</span>
            <div className="genre-tags">
              {genreOptions.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={`genre-tag ${form.Turler.includes(genre) ? "selected" : ""}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            {errors.Turler && <p className="field-error">{errors.Turler}</p>}
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="movie-duration">Sure</label>
              <input
                id="movie-duration"
                type="number"
                min="1"
                value={form.Sure}
                onChange={(event) => setForm({ ...form, Sure: event.target.value })}
              />
              {errors.Sure && <p className="field-error">{errors.Sure}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="movie-release-date">VizyonTarihi</label>
              <input
                id="movie-release-date"
                type="date"
                value={form.VizyonTarihi}
                onChange={(event) => setForm({ ...form, VizyonTarihi: event.target.value })}
              />
              {errors.VizyonTarihi && <p className="field-error">{errors.VizyonTarihi}</p>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="movie-poster">Poster</label>
            <input id="movie-poster" type="file" accept="image/*" onChange={handlePosterChange} />
            <div className={`poster-preview ${form.posterPreview ? "has-image" : ""}`}>
              {form.posterPreview ? <img src={form.posterPreview} alt="Poster preview" /> : <span>Poster preview</span>}
            </div>
            {errors.Poster && <p className="field-error">{errors.Poster}</p>}
          </div>

          <div className="modal-actions">
            <button className="btn secondary modal-cancel" type="button" onClick={resetAndClose}>
              Iptal
            </button>
            <button className="btn modal-save" type="submit">
              Kaydet
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
