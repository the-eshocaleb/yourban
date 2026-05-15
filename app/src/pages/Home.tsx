import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Header from "./global/Header";
import Footer from "./global/Footer";
import toast from "react-hot-toast";
import API from "../services/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";

const sectionLabel =
  "text-xs font-medium uppercase tracking-wide text-zinc-500";

const chipBase =
  "rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition";

const inputClass =
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950/10";

const fieldClass = "space-y-1";



const emptyCreateForm = () => ({
  titre: "",
  date_sortie: "",
  genre: "",
  pays_origine: "",
  distributeur: "",
  duree_minutes: "",
  nombre_entrees: "",
  recettes_totales: "",
  note_presse: "",
});

type GenreAgg = {
  nombreDeFilms: number;
  recettesTotales: number;
  notePresseMoyenne: number;
};

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<any[]>([]);
  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [dateIsAscending, setDateIsAscending] = useState(true);
  const [recettesIsAscending, setRecettesIsAscending] = useState(true);
  /** null = not sorted yet; true = last sort descending; false = ascending */
  const [dateSortDesc, setDateSortDesc] = useState<boolean | null>(null);
  const [recettesSortDesc, setRecettesSortDesc] = useState<boolean | null>(
    null
  );
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const createMovie = async (movie: {
    titre: string;
    date_sortie: string;
    genre: string;
    recettes_totales: number;
    nombre_entrees: number;
    pays_origine: string;
    distributeur: string;
    duree_minutes: number;
    note_presse: number;
  }) => {
    try {
      const res = await API.post("movie", movie);
      if (!res.ok) {
        const errs = (res as { errors?: string[] }).errors;
        const msg =
          Array.isArray(errs) && errs.length
            ? errs.join(" ")
            : res.message ?? "Failed to create movie";
        toast.error(msg);
        return;
      }
      toast.success("Movie created");
      setCreateForm(emptyCreateForm());
      setShowCreateForm(false);
      setSelectedGenre(null);
      await getMovies();
    } catch (error) {
      toast.error("An error occurred while creating the movie.");
      console.error(error);
    }
  };

  const getMovies = async () => {
    try {
      const response = await API.get("movies");
      if (!response.ok) {
        toast.error(
          response.message ?? response.error ?? "Failed to get movies"
        );
        return;
      }
      setMovies(response.data);
      setAllMovies(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to get movies");
    }
  };

  const filterGenres = (filterGenre: string) => {
    const filteredMovies = allMovies.filter(
      (movie: any) => filterGenre == "-" ? movie.genre === null : movie.genre == filterGenre
    );
    setMovies(filteredMovies);
    setSelectedGenre(filterGenre);
  };

  const sortByDate = () => {
    const descending = dateIsAscending;
    const sortedMovies = [...movies].sort((a: any, b: any) =>
      descending
        ? b.date_sortie.localeCompare(a.date_sortie)
        : a.date_sortie.localeCompare(b.date_sortie)
    );
    setMovies(sortedMovies);
    setDateSortDesc(descending);
    setDateIsAscending((prev) => !prev);
  };

  const sortByRecettes = () => {
    const descending = recettesIsAscending;
    const sortedMovies = [...movies].sort((a: any, b: any) =>
      descending
        ? b.recettes_totales - a.recettes_totales
        : a.recettes_totales - b.recettes_totales
    );
    setMovies(sortedMovies);
    setRecettesSortDesc(descending);
    setRecettesIsAscending((prev) => !prev);
  };

  const genres = Array.from(
    new Set(allMovies.map((movie: any) => movie.genre ?? "-"))
  );

  const totalRecettes = movies.reduce(
    (sum: number, movie: any) => sum + (movie.recettes_totales ?? 0),
    0
  );



  useEffect(() => {
    getMovies();
  }, []);


  const statsByGenre = allMovies.reduce<Record<string, GenreAgg>>((acc, movie) => {
    const genre = String(movie.genre);

    if (!acc[genre]) {
      acc[genre] = { nombreDeFilms: 0, recettesTotales: 0, notePresseMoyenne: 0 };
    }

    acc[genre].nombreDeFilms += 1;
    acc[genre].recettesTotales += movie.recettes_totales;
    acc[genre].notePresseMoyenne += movie.note_presse;

    return acc;
  }, {});

  Object.keys(statsByGenre).forEach(genre => {
    const stat = statsByGenre[genre]
    stat.notePresseMoyenne = stat.notePresseMoyenne / stat.nombreDeFilms
  });

  const chartData = Object.entries(statsByGenre).map(([genre, stats]) => ({
    genre: genre === "null" || genre === "" ? "—" : genre ?? "—",
    films: stats.nombreDeFilms,
    revenue: stats.recettesTotales,
    score: Number(stats.notePresseMoyenne.toFixed(1)),
  }));

  const handleCreateFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      titre: String(createForm.titre ?? "").trim(),
      date_sortie: String(createForm.date_sortie ?? "").trim(),
      genre: String(createForm.genre ?? "").trim(),
      pays_origine: String(createForm.pays_origine ?? "").trim(),
      distributeur: String(createForm.distributeur ?? "").trim(),
      duree_minutes: Number(createForm.duree_minutes),
      nombre_entrees: Number(createForm.nombre_entrees),
      recettes_totales: Number(createForm.recettes_totales),
      note_presse: Number(createForm.note_presse),
    };
    await createMovie(payload);
  };

  const toggleCreateForm = () => {
    setShowCreateForm((open) => {
      if (open) setCreateForm(emptyCreateForm());
      return !open;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Movies
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Browse and filter the catalogue.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCreateForm}
              className="shrink-0 self-start rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 sm:self-auto"
            >
              {showCreateForm ? "Close form" : "Create movie"}
            </button>
          </header>

          {showCreateForm && (
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                New movie
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Fill in the details below. Submit logs the payload to the
                console for now.
              </p>
              <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
                <div className={fieldClass}>
                  <label htmlFor="create-titre" className={sectionLabel}>
                    Titre
                  </label>
                  <input
                    id="create-titre"
                    name="titre"
                    value={createForm.titre}
                    onChange={handleCreateFieldChange}
                    className={inputClass}
                    required
                    minLength={3}
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="create-date" className={sectionLabel}>
                    Date de sortie
                  </label>
                  <input
                    id="create-date"
                    name="date_sortie"
                    type="date"
                    value={createForm.date_sortie}
                    onChange={handleCreateFieldChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="create-genre" className={sectionLabel}>
                    Genre
                  </label>
                  <input
                    id="create-genre"
                    name="genre"
                    value={createForm.genre}
                    onChange={handleCreateFieldChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="create-pays" className={sectionLabel}>
                    Pays d&apos;origine
                  </label>
                  <input
                    id="create-pays"
                    name="pays_origine"
                    value={createForm.pays_origine}
                    onChange={handleCreateFieldChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="create-dist" className={sectionLabel}>
                    Distributeur
                  </label>
                  <input
                    id="create-dist"
                    name="distributeur"
                    value={createForm.distributeur}
                    onChange={handleCreateFieldChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="create-duree" className={sectionLabel}>
                      Durée (min)
                    </label>
                    <input
                      id="create-duree"
                      name="duree_minutes"
                      type="number"
                      min={1}
                      step={1}
                      value={createForm.duree_minutes}
                      onChange={handleCreateFieldChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="create-entrees" className={sectionLabel}>
                      Nombre d&apos;entrées
                    </label>
                    <input
                      id="create-entrees"
                      name="nombre_entrees"
                      type="number"
                      min={0}
                      step={1}
                      value={createForm.nombre_entrees}
                      onChange={handleCreateFieldChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="create-recettes" className={sectionLabel}>
                      Recettes totales (€)
                    </label>
                    <input
                      id="create-recettes"
                      name="recettes_totales"
                      type="number"
                      min={0}
                      step={1}
                      value={createForm.recettes_totales}
                      onChange={handleCreateFieldChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="create-note" className={sectionLabel}>
                      Note presse (0–10)
                    </label>
                    <input
                      id="create-note"
                      name="note_presse"
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={createForm.note_presse}
                      onChange={handleCreateFieldChange}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className={sectionLabel}>Titles shown</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {movies.length}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className={sectionLabel}>Combined gross (filtered)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {totalRecettes.toLocaleString()} €
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <p className={sectionLabel}>Filter by genre</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const selected = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => filterGenres(genre)}
                    className={`${chipBase} ${selected
                      ? "border-zinc-800 bg-zinc-800 text-white shadow-md hover:bg-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                  >
                    {genre}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMovies(allMovies);
                  setSelectedGenre(null);
                }}
                className={`${chipBase} border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-800`}
              >
                Reset
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">By genre</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Film count, gross, and avg. press score per genre.
            </p>
            <div className="mt-4 h-[320px] w-full min-w-0">
              {chartData.length === 0 ? (
                <p className="text-sm text-zinc-500">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis
                      dataKey="genre"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                      width={36}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`
                      }
                      width={44}
                    />
                    <YAxis
                      yAxisId="score"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      domain={[0, 10]}
                      width={38}
                      axisLine={false}
                      tickLine={false}
                      style={{ color: "#f5c518" }}
                      tickFormatter={(v) => v.toFixed(1)}
                      label={{
                        value: "Score",
                        angle: -90,
                        offset: 10,
                        position: "insideRight",
                        style: { textAnchor: "middle", fill: "#f5c518", fontSize: 10 }
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        // Find the bar with each dataKey, in case order changes
                        const row = payload[0].payload as {
                          films: number;
                          revenue: number;
                          score: number;
                        };
                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md">
                            <p className="font-medium text-zinc-900">{label}</p>
                            <p className="mt-1 text-zinc-600">
                              Films:{" "}
                              <span className="font-medium text-zinc-900">
                                {row.films}
                              </span>
                            </p>
                            <p className="text-zinc-600">
                              Recettes:{" "}
                              <span className="font-medium text-zinc-900">
                                {row.revenue.toLocaleString()} €
                              </span>
                            </p>
                            <p className="text-zinc-600">
                              Note presse (moy.):{" "}
                              <span className="font-medium text-zinc-900">
                                {row.score}
                              </span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="films"
                      name="Films"
                      fill="#52525b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      name="Recettes (€)"
                      fill="#a1a1aa"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="score"
                      dataKey="score"
                      name="Note presse (moy.)"
                      fill="#f5c518"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              {movies.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-zinc-500">
                  No movies to display.
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80">
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        Titre
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        <span className="inline-flex items-center gap-2">
                          Date sortie
                          <button
                            type="button"
                            onClick={sortByDate}
                            title={
                              dateSortDesc === null
                                ? "Sort by release date"
                                : dateSortDesc
                                  ? "Sorted newest first"
                                  : "Sorted oldest first"
                            }
                            className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                          >
                            Sort
                            <span
                              className={
                                dateSortDesc === null
                                  ? "text-zinc-400"
                                  : "text-zinc-900"
                              }
                              aria-hidden
                            >
                              {dateSortDesc === null
                                ? "↕"
                                : dateSortDesc
                                  ? "↓"
                                  : "↑"}
                            </span>
                          </button>
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        Genre
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        <span className="inline-flex items-center gap-2">
                          Recettes
                          <button
                            type="button"
                            onClick={sortByRecettes}
                            title={
                              recettesSortDesc === null
                                ? "Sort by gross"
                                : recettesSortDesc
                                  ? "Sorted high to low"
                                  : "Sorted low to high"
                            }
                            className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 shadow-sm transition hover:bg-zinc-50"
                          >
                            Sort
                            <span
                              className={
                                recettesSortDesc === null
                                  ? "text-zinc-400"
                                  : "text-zinc-900"
                              }
                              aria-hidden
                            >
                              {recettesSortDesc === null
                                ? "↕"
                                : recettesSortDesc
                                  ? "↓"
                                  : "↑"}
                            </span>
                          </button>
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        Note presse
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {movies.map((movie: any) => (
                      <tr
                        key={movie.id}
                        className="transition hover:bg-zinc-50/80"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {movie.titre}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {movie.date_sortie}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{movie.genre ?? "-"}</td>
                        <td className="px-4 py-3 tabular-nums text-zinc-600">
                          {movie.recettes_totales != null
                            ? Number(movie.recettes_totales).toLocaleString()
                            : "—"}{" "}
                          €
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-600">
                          {movie.note_presse ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
