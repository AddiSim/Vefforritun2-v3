import pg from 'pg';
import dotenv from 'dotenv';
import slugify from 'slugify';
import { team, game } from '../types.js';
import { gameMapper, teamMapper } from './mappers.js';

let savedPool: pg.Pool | undefined;

dotenv.config();

export function getPool(): pg.Pool {
  if (savedPool) {
    return savedPool;
  }

  const { DATABASE_URL: connectionString } = process.env;
  if (!connectionString) {
    console.error('Missing DATABASE_URL in .env');
    throw new Error('Missing DATABASE_URL');
  }

  console.log(`Connecting to database with connection string: ${connectionString}`);
  savedPool = new pg.Pool({ connectionString });

  savedPool.on('error', (err) => {
    console.error('Database connection error, application will exit', err);
    throw new Error('Error in DB connection');
  });

  return savedPool;
}

export async function query(
  q: string,
  values: Array<unknown> = [],
  silent = false,
): Promise<pg.QueryResult<any> | null> {
  const pool = getPool();

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(q, values);
    return result; 
  } catch (e) {
    if (!silent) {
      console.error('Unable to query', e);
      console.info(q, values);
    }
    return null;
  } finally {
    client?.release();
  }
}

export async function testConnection(): Promise<void> {
  try {
    const result = await query('SELECT 1 as number');
    if (result && result.rows.length > 0 && result.rows[0].number === 1) {
      console.log('Database connection test successful.');
    } else {
      console.error('Database connection test failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Database connection test error:', error);
    process.exit(1);
  }
}

export async function updateTeamSlugs() {
  const teams = await query('SELECT id, name FROM teams');
  if (teams && teams.rows) {
    teams.rows.forEach(async (team: any) => {
      const slug = slugify(team.name);
      await query('UPDATE teams SET slug = $1 WHERE id = $2', [slug, team.id]);
    });
  } 
}

export async function insertTeam(team: Omit<team, 'id'>, silent = false): Promise<team | null> {
  const { name, slug, description } = team;
  const result = await query(
    'INSERT INTO teams (name, slug, description) VALUES ($1, $2, $3) RETURNING id, name, slug, description',
    [name, slug, description],
    silent,
  );

  if (!result || result.rows.length === 0) return null;

  return teamMapper(result.rows[0]);
}

export async function insertGame(
  gameData: Omit<game, 'id' | 'home' | 'away'> & { homename: number; awayname: number },
  silent = false,
): Promise<game | null> {
  const { date, homename, awayname, homescore, awayscore } = gameData;
  const result = await query(
    'INSERT INTO games (id, date, home, away, homescore, awayscore) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [date, homename, awayname, homescore, awayscore],
    silent,
  );

  if (!result || result.rows.length === 0) return null;

  return gameMapper(result.rows[0]);
}

export async function getTeams(): Promise<Array<team> | null> {
  try {
    const result = await query('SELECT * FROM teams');
    console.log(result);
    if (!result || result.rows.length === 0) return null;
    return result.rows.map(teamMapper).filter((t): t is team => t !== null);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return null;
  }
}

export async function getTeamBySlug(slug: string): Promise<team | null> {
  const queryText = 'SELECT * FROM teams WHERE slug = $1';
  const values = [slug]; // Ensure this matches the case and format of the slug in the database
  const result = await query(queryText, values);
  if (result && result.rows.length === 0) return null;
  return result ? teamMapper(result.rows[0]) : null;
}

export async function deleteTeamBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM teams WHERE slug = $1 RETURNING *', [slug]);

  // Explicitly reassure TypeScript about rowCount being a number using a fallback to 0
  return (result?.rowCount ?? 0) > 0;
}

export async function getGamesByTeamId(id: number): Promise<Array<game>> {
  const result = await query('SELECT * FROM games WHERE home = $1 OR away = $1', [id]);

  if (!result || result.rows.length === 0) return [];

  return result.rows.map(gameMapper).filter((g): g is game => g !== null);
}

export async function updateTeamBySlug(slug: string, data: Partial<team>): Promise<team | null> {
  const { name, description } = data;
  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push('name');
    values.push(name);
  }

  if (description !== undefined) {
    fields.push('description');
    values.push(description);
  }

  // Ensure there's something to update
  if (fields.length === 0) {
    throw new Error('No update fields provided');
  }

  const setClause = fields
    .map((field, index) => `${field} = $${index + 2}`)
    .join(', ');

  const query = `
    UPDATE teams
    SET ${setClause}
    WHERE slug = $1
    RETURNING id, name, slug, description;
  `;

  values.unshift(slug); // Add slug as the first value

  try {
    const pool = getPool();
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return null; // No team found with the given slug
    }
    return result.rows[0]; // Return the updated team
  } catch (error) {
    console.error('Failed to update team by slug', error);
    throw error;
  }
}

export async function getGames(): Promise<Array<game> | null> {
  // Adjust the query to join with the teams table twice - once for the home team and once for the away team
  const queryText = `
    SELECT 
      g.id, 
      g.date, 
      g.homescore, 
      g.awayscore, 
      homeTeam.name AS homeTeamName, 
      awayTeam.name AS awayTeamName
    FROM 
      games g
    INNER JOIN 
      teams homeTeam ON g.homename = homeTeam.id
    INNER JOIN 
      teams awayTeam ON g.awayname = awayTeam.id;
  `;

  const result = await query(queryText);
  
  if (!result || result.rows.length === 0) return null;

  
  const mappedGames = result.rows.map(row => ({
    id: row.id,
    date: row.date,
    homescore: row.homescore,
    awayscore: row.awayscore,
    homename: row.hometeamname, 
    awayname: row.awayteamname,  
  }));
  
  return mappedGames;
}

export async function updateGameByGameId(gameId: number, data: Partial<game>): Promise<game | null> {
  const updates = Object.entries(data).reduce((acc, [key, value]) => {
    // Ensure that key is actually a key of game
    if (value !== undefined && ["date", "homename", "awayname", "homescore", "awayscore"].includes(key)) {
      acc.fields.push(`${key} = ?`);
      acc.values.push(value);
    }
    return acc;
  }, { fields: [] as string[], values: [] as (string | number)[] });

  if (updates.fields.length === 0) {
    throw new Error('No update fields provided');
  }

  const setClause = updates.fields.join(', ');
  const values = [...updates.values, gameId]; // Add gameId at the end for the WHERE clause
  const query = `
    UPDATE games
    SET ${setClause}
    WHERE id = $${values.length} // Assuming gameId is the last parameter
    RETURNING *;
  `;

  try {
    const pool = getPool();
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return null; // No game found with the given ID
    }
    return gameMapper(result.rows[0]);
  } catch (error) {
    console.error('Failed to update game by ID', error);
    throw error;
  }
}

export async function changeGameStatusByGameId(gameId: number, status: string): Promise<game | null> {
  const sqlQuery = `
    UPDATE games
    SET status = $2
    WHERE id = $1
    RETURNING *;
  `;

  const values = [gameId, status];

  const result = await query(sqlQuery, values);

  if (!result || result.rows.length === 0) return null;

  return gameMapper(result.rows[0]);
}