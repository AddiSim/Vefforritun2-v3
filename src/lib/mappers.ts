import {
   team,
   game,
} from '../types.js';

export function gameMapper(potentialGame: unknown): game | null {
    const game = potentialGame as {
        id: number,
        date: string,
        homescore: number,
        awayscore: number,
        homename: string,  
        awayname: string,  
    } | null;

    if (!game || typeof game.id !== 'number' || typeof game.date !== 'string' ||
        typeof game.homescore !== 'number' || typeof game.awayscore !== 'number' ||
        typeof game.homename !== 'string' || typeof game.awayname !== 'string') {
        console.log("Mapping failed due to type mismatch or missing fields", game);
        return null;
    }

    const mapped: game = {
        id: game.id,
        date: game.date,
        homescore: game.homescore,
        awayscore: game.awayscore,
        homename: game.homename,
        awayname: game.awayname,
    };

    console.log("Mapped game object:", mapped);
    return mapped;
}



export function gamesMapper(potentialGames: unknown): Array<game> {
    const games = potentialGames as Array<unknown> | null;

    if(!games || !Array.isArray(games)) {
        return [];
    }
    const mapped = games.map((item) => gameMapper(item)).filter((result): result is game => result !== null);

    return mapped;
}

export function teamMapper(potentialTeam: unknown): team | null {
    const team = potentialTeam as {
        id?: number,
        name: string,
        slug: string,
        description?: string | null
    } | null;
    console.log(team);
    if (!team || typeof team.id !== 'number' || typeof team.name !== 'string' ||
        typeof team.slug !== 'string'){
        return null;
    }

    const mapped: team = {
        id: team.id ?? undefined,
        name: team.name,
        slug: team.slug,
        description: team.description ?? undefined
    };
    console.log(mapped);
    return mapped;
}

export function teamsMapper(potentialTeams: unknown): Array<team> {
    const teams = potentialTeams as Array<unknown> | null;

    if(!teams || !Array.isArray(teams)) {
        return [];
    }
    const mapped = teams.map((item) => teamMapper(item)).filter((result): result is team => result !== null);

    return mapped;
}
    
