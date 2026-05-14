import { Router, Request, Response } from "express";
import { Movie, readAll, findOne, update, remove, create } from "../services/db";

const router = Router();

router.get("/movies", (req: Request, res: Response) => {
  try {
    const movies = readAll();
    if (!movies || movies.length === 0) {
      return res.status(404).json({ ok: false, message: "No movies found" });
    }
    return res.status(200).json({ ok: true, data: movies });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "Internal server error", error: error });
  }
});

router.get("/movie/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const movie = findOne(id);
    if (!movie) {
      return res.status(404).json({ ok: false, message: "No movie found" });
    }
    return res.status(200).json({ ok: true, data: movie });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "Internal server error", error: error });
  }
});

router.post("/movie", (req: Request, res: Response) => {
  const {
    titre,
    date_sortie,
    genre,
    recettes_totales,
    nombre_entrees,
    pays_origine,
    distributeur,
    duree_minutes,
    note_presse,
  } = req.body;

  // Type and reasonable value checks
  const errors: string[] = [];

  if (typeof titre !== "string" || titre.trim().length < 3)
    errors.push("Invalid titre: must be a non-empty string.");

  if (typeof date_sortie !== "string" || isNaN(Date.parse(date_sortie)))
    errors.push("Invalid date_sortie: must be a valid date string.");

  if (typeof genre !== "string" || genre.trim().length < 1)
    errors.push("Invalid genre: must be a non-empty string.");

  if (
    typeof recettes_totales !== "number" ||
    recettes_totales < 0 ||
    !Number.isFinite(recettes_totales)
  )
    errors.push("Invalid recettes_totales: must be a non-negative number.");

  if (
    typeof nombre_entrees !== "number" ||
    nombre_entrees < 0 ||
    !Number.isInteger(nombre_entrees)
  )
    errors.push("Invalid nombre_entrees: must be a non-negative integer.");

  if (typeof pays_origine !== "string" || pays_origine.trim().length < 1)
    errors.push("Invalid pays_origine: must be a non-empty string.");

  if (typeof distributeur !== "string" || distributeur.trim().length < 1)
    errors.push("Invalid distributeur: must be a non-empty string.");

  if (
    typeof duree_minutes !== "number" ||
    duree_minutes <= 0 ||
    !Number.isInteger(duree_minutes)
  )
    errors.push("Invalid duree_minutes: must be a positive integer.");

  if (
    typeof note_presse !== "number" ||
    note_presse < 0 ||
    note_presse > 10
  )
    errors.push("Invalid note_presse: must be a number between 0 and 10.");

  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const movie: Omit<Movie, "id"> = {
      titre,
      date_sortie,
      genre,
      recettes_totales,
      nombre_entrees,
      pays_origine,
      distributeur,
      duree_minutes,
      note_presse
    };
   
    const newMovie = create(movie);
    if (!newMovie){
        return res.status(500).json({ok: false, message: "Failed to create new movie"})
    }
    return res.status(201).json({ok: true, data: newMovie})

  } catch(error) {
    return res.status(500).json({ok: false, message: "Internal server error"})
  }
});

function parseMovieUpdateBody(
  body: Record<string, unknown>
): { patch: Partial<Omit<Movie, "id">>; errors: string[] } {
  const errors: string[] = [];
  const raw = { ...body };
  delete raw.id;

  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };

  const patch: Partial<Omit<Movie, "id">> = {};

  if (raw.titre !== undefined) {
    if (typeof raw.titre !== "string" || raw.titre.trim().length < 3)
      errors.push("Invalid titre: must be a string with length at least 3.");
    else patch.titre = raw.titre.trim();
  }
  if (raw.date_sortie !== undefined) {
    if (typeof raw.date_sortie !== "string" || isNaN(Date.parse(raw.date_sortie)))
      errors.push("Invalid date_sortie: must be a valid date string.");
    else patch.date_sortie = raw.date_sortie;
  }
  if (raw.genre !== undefined) {
    if (typeof raw.genre !== "string" || raw.genre.trim().length < 1)
      errors.push("Invalid genre: must be a non-empty string.");
    else patch.genre = raw.genre.trim();
  }
  if (raw.pays_origine !== undefined) {
    if (typeof raw.pays_origine !== "string" || raw.pays_origine.trim().length < 1)
      errors.push("Invalid pays_origine: must be a non-empty string.");
    else patch.pays_origine = raw.pays_origine.trim();
  }
  if (raw.distributeur !== undefined) {
    if (typeof raw.distributeur !== "string" || raw.distributeur.trim().length < 1)
      errors.push("Invalid distributeur: must be a non-empty string.");
    else patch.distributeur = raw.distributeur.trim();
  }
  if (raw.recettes_totales !== undefined) {
    const n = toNum(raw.recettes_totales);
    if (n === undefined || n < 0)
      errors.push("Invalid recettes_totales: must be a non-negative number.");
    else patch.recettes_totales = n;
  }
  if (raw.nombre_entrees !== undefined) {
    const n = toNum(raw.nombre_entrees);
    if (n === undefined || n < 0 || !Number.isInteger(n))
      errors.push("Invalid nombre_entrees: must be a non-negative integer.");
    else patch.nombre_entrees = n;
  }
  if (raw.duree_minutes !== undefined) {
    const n = toNum(raw.duree_minutes);
    if (n === undefined || n <= 0 || !Number.isInteger(n))
      errors.push("Invalid duree_minutes: must be a positive integer.");
    else patch.duree_minutes = n;
  }
  if (raw.note_presse !== undefined) {
    const n = toNum(raw.note_presse);
    if (n === undefined || n < 0 || n > 10)
      errors.push("Invalid note_presse: must be a number between 0 and 10.");
    else patch.note_presse = n;
  }

  return { patch, errors };
}

router.put("/movie/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, message: "Invalid movie id" });
  }

  const { patch, errors } = parseMovieUpdateBody(
    req.body as Record<string, unknown>
  );
  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({
      ok: false,
      message: "No valid fields to update",
    });
  }

  try {
    const movie = update(id, patch);
    if (!movie) {
      return res
        .status(404)
        .json({ ok: false, message: "Movie not found" });
    }
    return res
      .status(200)
      .json({ ok: true, data: movie, message: "Movie updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
});

router.delete("/movie/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const deleted = remove(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ ok: false, message: "Movie not found" });
    }
    return res
      .status(204)
      .json({ ok: true, message: "Movie deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
});

export default router;
