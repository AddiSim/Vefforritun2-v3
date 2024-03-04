import { NextFunction, Request, Response } from 'express';
import { getGames, insertGame, updateGameByGameId, deleteGameByGameId} from '../lib/db.js'; 

export async function listGames(req: Request, res: Response, next: NextFunction) {
  try {
    const games = await getGames();
    res.json(games);
  } catch (error) {
    next(error);
  }
}

export async function createGame(req: Request, res: Response, next: NextFunction) {
  try {
    const newGame = await insertGame(req.body); 
    res.status(201).json(newGame);
  } catch (error) {
    next(error);
  }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction) {
  const gameId = Number(req.params.gameId); 
  if (isNaN(gameId)) {
    return res.status(400).json({ message: 'Invalid game ID' });
  }
  try {
    const deleted = await deleteGameByGameId(gameId);
    if (!deleted) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
export async function updateGame(req: Request, res: Response, next: NextFunction) {
    const gameId = Number(req.params.gameId); // Convert string to number
    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID' });
    }

    const updateData = req.body;

    try {
        const updated = await updateGameByGameId(gameId, updateData);
        if (!updated) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(updated);
    } catch (error) {
        next(error);
    }
}

