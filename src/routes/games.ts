import { NextFunction, Request, Response } from 'express';
import { 
  getGames, 
  insertGame,  
  deleteGameByGameId,
  getTeamById } from '../lib/db.js';

export async function listGames(req: Request, res: Response, next: NextFunction) {
  try {
    const games = await getGames();
    return res.json(games);
  } catch (error) {
    next(error);
  }
}

export async function createGame(req: Request, res: Response, next: NextFunction) {
  try {
    const newGame = await insertGame(req.body);
    console.log(newGame);
    return res.status(200).json(newGame);
  } catch (error) {
    next(error);
  }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction) {
  const gameId = Number(req.params.gameId);
  if (!gameId) {
    return next();
  }
  const deleted = await deleteGameByGameId(gameId);
  if (!deleted) {
    return next(new Error('Unable to delete game'));
  }

  return res.status(204).json({});
  
}

export async function updateGame(req: Request, res: Response, next: NextFunction) {
  const gameId = Number(req.params.gameId); 
  if (!gameId) {
      
      return res.status(400).send('Invalid game ID.');
  }

  try {
      
      const updatedGame = await updateGameWithTeamNames(gameId, req.body);
      
      
      if (updatedGame) {
          return res.status(200).json(updatedGame);
      } else {
          
          return res.status(404).send('Game not found or unable to update.');
      }
  } catch (error) {
      console.error('Error updating game:', error);
      next(error); 
  }
}

export async function updateGameWithTeamNames(gameId: number, updateData: any): Promise<any> {
  const homeTeamId = updateData.homename;
  const awayTeamId = updateData.awayname;

  const homeTeam = await getTeamById(homeTeamId);
  const awayTeam = await getTeamById(awayTeamId);

  
  if (!homeTeam || !awayTeam) {
      throw new Error('One or both teams not found');
  }
 
  return {
      id: gameId,
      homename: homeTeam.name, 
      awayname: awayTeam.name, 
      ...updateData
  };
}
