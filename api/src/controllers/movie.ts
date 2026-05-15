import { Router, Request, Response } from "express";
import {
  Movie,
  readAll,
  findOne,
  update,
  remove,
  create,
} from "../services/db";
import { getRecommendedMovies } from "../services/recommendations";

const router = Router();

router.get("/movies", (req: Request, res: Response) => {
  try {
    const movies = readAll();
    if (!movies || movies.length === 0) {
      return res.status(404).json({ ok: false, message: "No movies found" });
    }
    return res.status(200).json({ ok: true, data: movies });
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
});

router.get("/movie/:id/recommendations", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, message: "Invalid movie id" });
  }

  try {
    const current = findOne(id);
    if (!current) {
      return res.status(404).json({ ok: false, message: "No movie found" });
    }

    const recommendations = getRecommendedMovies(current, readAll());
    return res.status(200).json({ ok: true, data: recommendations });
  } catch (error){
    console.log(error)
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
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
    console.log(error)
    res
      .status(500)
      .json({ ok: false, message: "Internal server error"});
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

  if (typeof note_presse !== "number" || note_presse < 0 || note_presse > 10)
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
      note_presse,
    };

    const newMovie = create(movie);
    if (!newMovie) {
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create new movie" });
    }
    return res.status(201).json({ ok: true, data: newMovie });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Internal server error" });
  }
});

router.put("/movie/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, message: "Invalid movie id" });
  }

  // Only validate fields that are present, using the same rules as POST
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

  const errors: string[] = [];
  const patch: Partial<Omit<Movie, "id">> = {};

  if (titre !== undefined) {
    if (typeof titre !== "string" || titre.trim().length < 3)
      errors.push("Invalid titre: must be a non-empty string.");
    else patch.titre = titre.trim();
  }
  if (date_sortie !== undefined) {
    if (typeof date_sortie !== "string" || isNaN(Date.parse(date_sortie)))
      errors.push("Invalid date_sortie: must be a valid date string.");
    else patch.date_sortie = date_sortie;
  }
  if (genre !== undefined) {
    if (typeof genre !== "string" || genre.trim().length < 1)
      errors.push("Invalid genre: must be a non-empty string.");
    else patch.genre = genre.trim();
  }
  if (recettes_totales !== undefined) {
    if (
      typeof recettes_totales !== "number" ||
      recettes_totales < 0 ||
      !Number.isFinite(recettes_totales)
    )
      errors.push("Invalid recettes_totales: must be a non-negative number.");
    else patch.recettes_totales = recettes_totales;
  }
  if (nombre_entrees !== undefined) {
    if (
      typeof nombre_entrees !== "number" ||
      nombre_entrees < 0 ||
      !Number.isInteger(nombre_entrees)
    )
      errors.push("Invalid nombre_entrees: must be a non-negative integer.");
    else patch.nombre_entrees = nombre_entrees;
  }
  if (pays_origine !== undefined) {
    if (typeof pays_origine !== "string" || pays_origine.trim().length < 1)
      errors.push("Invalid pays_origine: must be a non-empty string.");
    else patch.pays_origine = pays_origine.trim();
  }
  if (distributeur !== undefined) {
    if (typeof distributeur !== "string" || distributeur.trim().length < 1)
      errors.push("Invalid distributeur: must be a non-empty string.");
    else patch.distributeur = distributeur.trim();
  }
  if (duree_minutes !== undefined) {
    if (
      typeof duree_minutes !== "number" ||
      duree_minutes <= 0 ||
      !Number.isInteger(duree_minutes)
    )
      errors.push("Invalid duree_minutes: must be a positive integer.");
    else patch.duree_minutes = duree_minutes;
  }
  if (note_presse !== undefined) {
    if (typeof note_presse !== "number" || note_presse < 0 || note_presse > 10)
      errors.push("Invalid note_presse: must be a number between 0 and 10.");
    else patch.note_presse = note_presse;
  }

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
      return res.status(404).json({ ok: false, message: "Movie not found" });
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
      return res.status(404).json({ ok: false, message: "Movie not found" });
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
