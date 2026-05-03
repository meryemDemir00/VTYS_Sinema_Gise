import { useEffect, useState } from "react";

const genreOptions = ["Animasyon", "Aksiyon", "Bilim Kurgu", "Macera", "Dram", "Komedi", "Korku", "Romantik"];

const emptyForm = {
  FilmAdi: "",
  Turler: [],
  Sure: "",
  VizyonTarihi: "",
  Poster: null,
  posterPreview: "",
};

export default function AddMovieModal({ isOpen, onClose, onAdd, initialMovie = null, title = "Film Ekle" }) {
  const [form, setForm] = useState({
    FilmAdi: "",
    Turler: [],
    Sure: "",
    VizyonTarihi: "",
    Poster: null,
    posterPreview: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialMovie
      ? {
          FilmAdi: initialMovie.FilmAdi,
          Turler: initialMovie.Turler,
          Sure: String(initialMovie.Sure),
          VizyonTarihi: initialMovie.VizyonTarihi,
          Poster: initialMovie.Poster,
          posterPreview: initialMovie.Poster,
        }
      : emptyForm);
    setErrors({});
  }, [isOpen, initialMovie]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setForm(emptyForm);
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
    if (!form.FilmAdi.trim()) nextErrors.FilmAdi = "Film adı zorunludur.";
    if (!form.Turler.length) nextErrors.Turler = "En az bir tür seçin.";
    if (!form.Sure) nextErrors.Sure = "Süre zorunludur.";
    if (!form.VizyonTarihi) nextErrors.VizyonTarihi = "Vizyon tarihi zorunludur.";
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
          <h2 id="add-movie-title">{title}</h2>
          <button className="modal-close" type="button" aria-label="Kapat" onClick={resetAndClose}>
            &times;
          </button>
        </div>

        <form className="movie-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="movie-name">Film Adı</label>
            <input
              id="movie-name"
              type="text"
              value={form.FilmAdi}
              onChange={(event) => setForm({ ...form, FilmAdi: event.target.value })}
            />
            {errors.FilmAdi && <p className="field-error">{errors.FilmAdi}</p>}
          </div>

          <div className="form-field">
            <span className="field-label">Türler</span>
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
              <label htmlFor="movie-duration">Süre</label>
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
              <label htmlFor="movie-release-date">Vizyon Tarihi</label>
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
              {form.posterPreview ? <img src={form.posterPreview} alt="Poster önizlemesi" /> : <span>Poster önizlemesi</span>}
            </div>
            {errors.Poster && <p className="field-error">{errors.Poster}</p>}
          </div>

          <div className="modal-actions">
            <button className="btn secondary modal-cancel" type="button" onClick={resetAndClose}>
              İptal
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
