// How to add types to this component:
// 1. Convert the file to TypeScript by renaming it to Movie.tsx.
// 2. Define interfaces for the Movie object and MovieForm.
// 3. Type the useState hooks and function parameters.

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "./global/Header";
import Footer from "./global/Footer";
import toast from "react-hot-toast";
import API from "../services/api";

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 disabled:bg-zinc-50 disabled:text-zinc-500";

const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500";
const fieldClass = "space-y-1";

interface MovieType {
  id?: number;
  titre?: string;
  date_sortie?: string;
  genre?: string;
  pays_origine?: string;
  distributeur?: string;
  duree_minutes?: number | string;
  nombre_entrees?: number | string;
  recettes_totales?: number | string;
  note_presse?: number | string;
}

interface MovieFormType {
  titre: string;
  date_sortie: string;
  genre: string;
  pays_origine: string;
  distributeur: string;
  duree_minutes: number | string;
  nombre_entrees: number | string;
  recettes_totales: number | string;
  note_presse: number | string;
}


const Movie = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieType>({});
  const [similarMovies, setSimilarMovies] = useState<MovieType[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [form, setForm] = useState<MovieFormType | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const navigate = useNavigate();

  const getMovie = async () => {
    try {
      const response = await API.get(`movie/${id}`);
      if (!response.ok) {
        toast(response.message || "Failed to get movie");
        return;
      }
      setMovie(response.data);
    } catch (error: any) {
      toast(error.message || "An error occured");
      return;
    }
  };

  const getRecommendations = async () => {
    if (!id) return;
    try {
      const response = await API.get(`movie/${id}/recommendations`);
      if (!response.ok) {
        return;
      }
      setSimilarMovies(response.data ?? []);
    } catch (error) {
      console.log(error);
    }
  };

  const edit = () => {
    setIsEditing(true);
    setForm({
      titre: movie.titre || "",
      date_sortie: movie.date_sortie || "",
      genre: movie.genre || "",
      pays_origine: movie.pays_origine || "",
      distributeur: movie.distributeur || "",
      duree_minutes: movie.duree_minutes || "",
      nombre_entrees: movie.nombre_entrees || "",
      recettes_totales: movie.recettes_totales || "",
      note_presse: movie.note_presse || "",
    });
  };

  const deleteMovie = async () => {
    if (!id || !movie?.id) return;
    const title = movie.titre ? `“${movie.titre}”` : "this movie";
    const confirmed = window.confirm(
      `Delete ${title} permanently? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await API.delete(`movie/${id}`);
      if (!response.ok) {
        toast.error(response.message || "Failed to delete movie");
        return;
      }
      toast.success("Movie deleted");
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(error?.message || "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const save = async (e: FormEvent) => {
    e?.preventDefault?.();
    if (!form || !id) return;
    setSaving(true);
    try {
      const payload = {
        titre: String(form.titre ?? "").trim(),
        date_sortie: String(form.date_sortie ?? "").trim(),
        genre: String(form.genre ?? "").trim(),
        pays_origine: String(form.pays_origine ?? "").trim(),
        distributeur: String(form.distributeur ?? "").trim(),
        duree_minutes: Number(form.duree_minutes),
        nombre_entrees: Number(form.nombre_entrees),
        recettes_totales: Number(form.recettes_totales),
        note_presse: Number(form.note_presse),
      };

      const response = await API.put(`movie/${id}`, payload);
      if (!response.ok) {
        const msg =
          Array.isArray(response.errors) && response.errors.length
            ? response.errors.join(" ")
            : response.message || "Failed to update movie";
        toast.error(msg);
        return;
      }
      setMovie(response.data);
      setIsEditing(false);
      setForm(null);
      await getRecommendations();
      toast.success("Movie updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "An error occured");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm(null);
    setIsEditing(false);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev!,
      [name]: value,
    }));
  };

  useEffect(() => {
    getMovie();
    getRecommendations();
    // eslint-disable-next-line
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              <span aria-hidden className="text-zinc-400">
                ←
              </span>
              Back to movies
            </Link>
            {movie.id && !isEditing && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={edit}
                  disabled={deleting}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={deleteMovie}
                  disabled={deleting}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>

          {isEditing && form && (
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                Edit details
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Update fields and save to apply changes.
              </p>
              <form onSubmit={save} className="mt-6 space-y-4">
                <div className={fieldClass}>
                  <label htmlFor="titre" className={labelClass}>
                    Titre
                  </label>
                  <input
                    id="titre"
                    type="text"
                    name="titre"
                    value={form.titre}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="date_sortie" className={labelClass}>
                    Date de sortie
                  </label>
                  <input
                    id="date_sortie"
                    type="text"
                    name="date_sortie"
                    value={form.date_sortie}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="genre" className={labelClass}>
                    Genre
                  </label>
                  <input
                    id="genre"
                    type="text"
                    name="genre"
                    value={form.genre}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="pays_origine" className={labelClass}>
                    Pays d&apos;origine
                  </label>
                  <input
                    id="pays_origine"
                    type="text"
                    name="pays_origine"
                    value={form.pays_origine}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="distributeur" className={labelClass}>
                    Distributeur
                  </label>
                  <input
                    id="distributeur"
                    type="text"
                    name="distributeur"
                    value={form.distributeur}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="duree_minutes" className={labelClass}>
                      Durée (min)
                    </label>
                    <input
                      id="duree_minutes"
                      type="number"
                      name="duree_minutes"
                      value={form.duree_minutes}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="nombre_entrees" className={labelClass}>
                      Entrées
                    </label>
                    <input
                      id="nombre_entrees"
                      type="number"
                      name="nombre_entrees"
                      value={form.nombre_entrees}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="recettes_totales" className={labelClass}>
                      Recettes (€)
                    </label>
                    <input
                      id="recettes_totales"
                      type="number"
                      name="recettes_totales"
                      value={form.recettes_totales}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="note_presse" className={labelClass}>
                      Note presse
                    </label>
                    <input
                      id="note_presse"
                      type="number"
                      step="0.1"
                      name="note_presse"
                      value={form.note_presse}
                      onChange={handleFormChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {!isEditing && (
            <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {movie.titre || "Loading…"}
                </h1>
                {movie.genre && (
                  <p className="mt-1 text-sm text-zinc-500">{movie.genre}</p>
                )}
              </div>
              <div className="px-6 py-2">
                {movie.id ? (
                  <dl className="divide-y divide-zinc-100">
                    {([
                      ["Date de sortie", movie.date_sortie],
                      ["Pays d'origine", movie.pays_origine],
                      ["Distributeur", movie.distributeur],
                      [
                        "Durée",
                        movie.duree_minutes != null
                          ? `${movie.duree_minutes} min`
                          : "—",
                      ],
                      [
                        "Entrées",
                        movie.nombre_entrees != null
                          ? Number(movie.nombre_entrees).toLocaleString()
                          : "—",
                      ],
                      [
                        "Recettes",
                        movie.recettes_totales != null
                          ? `${Number(movie.recettes_totales).toLocaleString()} €`
                          : "—",
                      ],
                      [
                        "Note presse",
                        movie.note_presse != null
                          ? `${movie.note_presse} / 10`
                          : "—",
                      ],
                    ] as [string, string | number | undefined][]).map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4 sm:py-3"
                      >
                        <dt className="text-sm font-medium text-zinc-500">
                          {label}
                        </dt>
                        <dd className="text-sm text-zinc-900 sm:col-span-2">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    Chargement…
                  </p>
                )}
              </div>
            </article>
          )}

          {!isEditing && (
            <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                  You may also like
                </h2>
              </div>
              <div className="px-6 py-2">
                {similarMovies.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">
                    No similar movies to show.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {similarMovies.map((m) => (
                      <li key={m.id}>
                        <Link
                          to={`/movie/${m.id}`}
                          className="-mx-2 block rounded-lg px-2 py-4 transition hover:bg-zinc-50"
                        >
                          <span className="font-medium text-zinc-900">
                            {m.titre}
                          </span>
                          {m.genre ? (
                            <span className="mt-0.5 block text-sm text-zinc-500">
                              {m.genre}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Movie;
