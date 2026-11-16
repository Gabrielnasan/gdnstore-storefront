export interface Brand {
  handle: string;
  label: string;
  query: string;
  description?: string;
}

export const BRANDS: Brand[] = [
  { handle: "apple", label: "Apple", query: "vendor:Apple OR title:iphone OR title:macbook OR title:ipad OR title:airpods OR title:'apple watch' OR title:airtag", description: "Produtos Apple selecionados para quem busca desempenho, design e tecnologia premium." },
  { handle: "sony", label: "Sony", query: "vendor:Sony OR title:playstation OR title:sony", description: "PlayStation, fones, câmeras e acessórios oficiais Sony." },
  { handle: "microsoft", label: "Microsoft", query: "vendor:Microsoft OR title:xbox OR title:surface", description: "Xbox, Surface, controles e dispositivos Microsoft." },
  { handle: "dji", label: "DJI", query: "vendor:DJI OR title:dji", description: "Drones, câmeras de ação, estabilizadores e acessórios DJI." },
  { handle: "dell", label: "Dell", query: "vendor:Dell OR title:dell OR title:alienware", description: "Notebooks, monitores e desktops Dell." },
  { handle: "xiaomi", label: "Xiaomi", query: "vendor:Xiaomi OR title:xiaomi OR title:redmi OR title:poco", description: "Smartphones, smartwatches e dispositivos Xiaomi." },
  { handle: "asus-rog", label: "ASUS ROG", query: "vendor:ASUS OR title:rog OR title:asus", description: "Notebooks gamers, periféricos e monitores ASUS ROG." },
  { handle: "garmin", label: "Garmin", query: "vendor:Garmin OR title:garmin", description: "Smartwatches, relógios esportivos e acessórios Garmin." },
];

export function findBrand(handle: string): Brand | undefined {
  return BRANDS.find((b) => b.handle === handle);
}
