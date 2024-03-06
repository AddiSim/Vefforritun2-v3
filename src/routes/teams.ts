import { NextFunction, Request, Response } from 'express';
import slugify from 'slugify';
import { 
  getTeams, 
  getTeamBySlug, 
  insertTeam, 
  deleteTeamBySlug, 
  updateTeamBySlug, 
  updateTeamSlugs} from '../lib/db.js';

(async () => {
  await updateTeamSlugs();
})();

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await getTeams();
    return res.json(teams);
  } catch (error) {
    next(error);
  }
}

export async function listTeam(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;
  try {
    const team = await getTeamBySlug(slug);
    if (!team) {
      return next();
    }
    return res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error); 
    next(error);
  }
}

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);

    const team = await insertTeam({ name, slug, description });
    if (!team) {
      console.log('Failed to create team');
      return next(new Error('Failed to create team')); // Pass error to Express error handler
    }

    console.log('Team created successfully', team);
    return res.status(200).json(team);
  } catch (error) {
    console.error('Error in createTeam', error);
    return next(error); // Pass any caught error to the next error handler
  }
}


export async function deleteTeam(req: Request, res: Response, next: NextFunction) {
  const { slug } = req.params;
  try {
    const success = await deleteTeamBySlug(slug);
    if (!success) {
      return res.status(404).json({ message: 'Team not found' });
    }
    return res.status(200).json({ message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const updated = await updateTeamBySlug(slug, req.body);
    
    if (!updated) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}
