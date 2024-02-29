import { NextFunction, Request, Response } from 'express';
import slugify from 'slugify';
import { getTeams, getTeamBySlug, insertTeam, deleteTeamBySlug, updateTeamBySlug, updateTeamSlugs} from '../lib/db.js';
import { validationResult } from 'express-validator';

(async () => {
  await updateTeamSlugs();
})();

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await getTeams();
    res.json(teams);
  } catch (error) {
    next(error);
  }
}

export async function listTeam(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;
  console.log('Fetching team with slug:', slug); // Debug log
  try {
    const team = await getTeamBySlug(slug);
    console.log('Fetched team:', team); // Debug log
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error); // Debug log
    next(error);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const slug = slugify(name);

  try {
    const team = await insertTeam({ name, slug, description });
    res.status(201).json(team);
  } catch (error) {
    if (error === '23505') { // Unique violation
      return res.status(400).json({ message: 'A team with this name or slug already exists.' });
    }
    next(error);
  }
}

export async function deleteTeam(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;
  try {
    const success = await deleteTeamBySlug(slug);
    if (!success) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updateData = req.body;

  try {
    const updated = await updateTeamBySlug(slug, updateData);
    if (!updated) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
}



