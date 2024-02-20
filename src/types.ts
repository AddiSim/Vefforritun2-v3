export type Link = {
    href: string;
  };
  
  export type Links = {
    self?: Link;
    next?: Link;
    prev?: Link;
    first?: Link;
    last?: Link;
  };

export type team = {
    id: number;
    name: string;
    slug: string;
    description: string;
}

export type game = {
    id: number;
    date: string;
    homeId: number;
    awayId: number;
    home?: string;
    away?: string;
    home_score: number;
    away_score: number;
}

export async function getTeamById(id: number): Promise<team | null>{
    return null;
};