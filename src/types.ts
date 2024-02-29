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
    description?: string;
}

export type game = {
    id: number;
    date: string;
    homescore: number;
    awayscore: number;
    homename?: string;
    awayname?: string;
}
