import type { Movie } from "./db";

export function getRecommendedMovies(
  current: Movie,
  allMovies: Movie[],
  limit = 3,
): Movie[] {
  let pool = allMovies.filter(
    (m) => m.id !== current.id && m.genre === current.genre,
  );
  if (pool.length < limit) {
    pool = allMovies.filter((m) => m.id !== current.id);
  }
  if (pool.length === 0) return [];

  const maxRecettes = Math.max(...pool.map((m) => m.recettes_totales), 1);
  const maxRating = Math.max(...pool.map((m) => m.note_presse), 1);

  return pool
    .map((movie) => {
      const recettesDiff =
        Math.abs(movie.recettes_totales - current.recettes_totales) /
        maxRecettes;
      const ratingDiff =
        Math.abs(movie.note_presse - current.note_presse) / maxRating;
      const similarity = 1 - (recettesDiff * 0.5 + ratingDiff * 0.5);
      return { movie, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((s) => s.movie);
}
