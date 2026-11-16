// Estrutura do mega menu da navbar.
// Cada item pode navegar para uma categoria (/collections/$handle),
// uma marca (/marca/$handle) ou uma busca livre (/buscar?q=...).

export type MegaLinkTarget =
  | { kind: "collection"; handle: string }
  | { kind: "brand"; handle: string }
  | { kind: "search"; q: string }
  | { kind: "route"; to: string };

export interface MegaLink {
  label: string;
  target: MegaLinkTarget;
}

export interface MegaGroup {
  title: string;
  links: MegaLink[];
}

export interface MegaItem {
  label: string;
  // Link direto ao clicar no rótulo do topo (opcional).
  target?: MegaLinkTarget;
  groups?: MegaGroup[];
}

export const MEGA_MENU: MegaItem[] = [
  {
    label: "Smartphones",
    target: { kind: "collection", handle: "smartphones" },
    groups: [
      {
        title: "Por marca",
        links: [
          { label: "iPhone (Apple)", target: { kind: "search", q: "iphone" } },
          { label: "Samsung Galaxy", target: { kind: "search", q: "galaxy" } },
          { label: "Xiaomi / Redmi", target: { kind: "search", q: "xiaomi" } },
          { label: "Motorola", target: { kind: "search", q: "motorola" } },
        ],
      },
      {
        title: "Destaques",
        links: [
          { label: "Lançamentos", target: { kind: "collection", handle: "smartphones" } },
          { label: "Ofertas em smartphones", target: { kind: "route", to: "/ofertas" } },
        ],
      },
    ],
  },
  {
    label: "Computadores",
    target: { kind: "collection", handle: "computadores" },
    groups: [
      {
        title: "Notebooks",
        links: [
          { label: "MacBook (Apple)", target: { kind: "search", q: "macbook" } },
          { label: "Dell / Alienware", target: { kind: "search", q: "dell" } },
          { label: "ASUS ROG", target: { kind: "brand", handle: "asus-rog" } },
        ],
      },
      {
        title: "Ver mais",
        links: [
          { label: "Todos os notebooks", target: { kind: "collection", handle: "computadores" } },
          { label: "Ofertas", target: { kind: "route", to: "/ofertas" } },
        ],
      },
    ],
  },
  {
    label: "Tablets",
    target: { kind: "collection", handle: "tablets" },
    groups: [
      {
        title: "Por marca",
        links: [
          { label: "iPad (Apple)", target: { kind: "search", q: "ipad" } },
          { label: "Galaxy Tab (Samsung)", target: { kind: "search", q: "galaxy tab" } },
          { label: "Xiaomi Pad", target: { kind: "search", q: "xiaomi pad" } },
        ],
      },
    ],
  },
  {
    label: "Áudio",
    target: { kind: "collection", handle: "audio" },
    groups: [
      {
        title: "Fones",
        links: [
          { label: "AirPods (Apple)", target: { kind: "search", q: "airpods" } },
          { label: "Sony", target: { kind: "brand", handle: "sony" } },
          { label: "JBL", target: { kind: "search", q: "jbl" } },
        ],
      },
    ],
  },
  {
    label: "Smartwatch",
    target: { kind: "collection", handle: "smartwatch" },
    groups: [
      {
        title: "Por marca",
        links: [
          { label: "Apple Watch", target: { kind: "search", q: "apple watch" } },
          { label: "Garmin", target: { kind: "brand", handle: "garmin" } },
          { label: "Xiaomi", target: { kind: "search", q: "xiaomi watch" } },
        ],
      },
    ],
  },
  {
    label: "Games",
    target: { kind: "collection", handle: "games" },
    groups: [
      {
        title: "Consoles",
        links: [
          { label: "PlayStation (Sony)", target: { kind: "search", q: "playstation" } },
          { label: "Xbox (Microsoft)", target: { kind: "search", q: "xbox" } },
          { label: "Nintendo Switch", target: { kind: "search", q: "nintendo" } },
        ],
      },
      {
        title: "Acessórios",
        links: [
          { label: "Controles", target: { kind: "search", q: "controle" } },
          { label: "Jogos", target: { kind: "search", q: "jogo" } },
        ],
      },
    ],
  },
  {
    label: "Drones & Câmeras",
    groups: [
      {
        title: "Drones",
        links: [
          { label: "DJI Drones", target: { kind: "search", q: "dji drone" } },
          { label: "Todos os drones", target: { kind: "collection", handle: "drones" } },
        ],
      },
      {
        title: "Câmeras",
        links: [
          { label: "DJI Câmeras", target: { kind: "search", q: "dji camera" } },
          { label: "GoPro", target: { kind: "search", q: "gopro" } },
          { label: "Todas as câmeras", target: { kind: "collection", handle: "cameras" } },
        ],
      },
    ],
  },
  {
    label: "Acessórios",
    target: { kind: "collection", handle: "acessorios" },
    groups: [
      {
        title: "Populares",
        links: [
          { label: "AirTag (Apple)", target: { kind: "search", q: "airtag" } },
          { label: "Carregadores", target: { kind: "search", q: "carregador" } },
          { label: "Cabos", target: { kind: "search", q: "cabo" } },
        ],
      },
    ],
  },
  {
    label: "Marcas",
    groups: [
      {
        title: "Principais marcas",
        links: [
          { label: "Apple", target: { kind: "brand", handle: "apple" } },
          { label: "Sony", target: { kind: "brand", handle: "sony" } },
          { label: "Microsoft", target: { kind: "brand", handle: "microsoft" } },
          { label: "Dell", target: { kind: "brand", handle: "dell" } },
        ],
      },
      {
        title: "Também vendemos",
        links: [
          { label: "DJI", target: { kind: "brand", handle: "dji" } },
          { label: "Xiaomi", target: { kind: "brand", handle: "xiaomi" } },
          { label: "ASUS ROG", target: { kind: "brand", handle: "asus-rog" } },
          { label: "Garmin", target: { kind: "brand", handle: "garmin" } },
        ],
      },
    ],
  },
  {
    label: "Ofertas",
    target: { kind: "route", to: "/ofertas" },
  },
];
