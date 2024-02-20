import {
   Links,
   team,
   game,
   getTeamById
} from '../types.js';

export async function gameMapper(potentialGame : any): Promise<game | null> {
    if(!potentialGame || typeof potentialGame !== 'object') {
        return null;
    }

    const homeTeam = await getTeamById(potentialGame.homeId);
    const awayTeam = await getTeamById(potentialGame.awayId);

    if (!homeTeam || !awayTeam) {
        return null;
    }

    const mapped:game = {
        id: potentialGame.id,
        date: potentialGame.date,
        homeId: potentialGame.homeId,
        awayId: potentialGame.awayId,
        home_score: potentialGame.home_score,
        away_score: potentialGame.away_score,
        home: homeTeam.name,
        away: awayTeam.name,
    }

    return mapped;
};