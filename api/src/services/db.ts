import fs from "fs";
import path from "path";

const JSON_PATH = path.join(__dirname, "box-office-200.json");

export interface Movie {
  id: number;
  titre: string;
  date_sortie: string;
  genre: string;
  recettes_totales: number;
  nombre_entrees: number;
  pays_origine: string;
  distributeur: string;
  duree_minutes: number;
  note_presse: number;
}

export function readAll(): Movie[] {
  const raw = fs.readFileSync(JSON_PATH, "utf-8");
  return JSON.parse(raw) as Movie[];
}

export function writeAll(movies: Movie[]): void {
  fs.writeFileSync(JSON_PATH, JSON.stringify(movies, null, 2), "utf-8");
}

export function findOne(id: number): Movie | undefined {
  return readAll().find((movie) => movie.id === id);
}

export function create(movie: Omit<Movie, "id">): Movie {
  const movies = readAll();
  const newMovie: Movie = { id: movies.length + 1, ...movie };
  movies.push(newMovie);
  writeAll(movies);
  return newMovie;
}

export function update(
  id: number,
  patch: Partial<Omit<Movie, "id">>,
): Movie | null {
  const movies = readAll();
  const index = movies.findIndex((movie) => movie.id === id);
  if (index === -1) return null;

  movies[index] = { ...movies[index], ...patch };
  writeAll(movies);
  return movies[index];
}

export function remove(id: number): Boolean {
  const movies = readAll();
  const filteredMovies = movies.filter((movie) => movie.id !== id);
  if (filteredMovies.length === movies.length) {
    return false;
  }
  writeAll(filteredMovies);
  return true;
}
