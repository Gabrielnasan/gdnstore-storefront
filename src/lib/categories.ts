// Maps the URL-friendly category handle to label + Shopify Storefront product search query.
export interface Category {
  handle: string;
  label: string;
  query: string;
  description?: string;
}

export const CATEGORIES: Category[] = [
  { handle: "computadores", label: "Computadores", query: "product_type:Notebooks OR title:macbook OR title:notebook", description: "Notebooks e computadores para alta performance." },
  { handle: "smartphones", label: "Smartphones", query: "product_type:'Celulares e Smartphones' OR product_type:Smartphones OR title:iphone", description: "Smartphones de última geração das melhores marcas." },
  { handle: "tablets", label: "Tablets", query: "product_type:Tablets OR title:ipad", description: "Tablets para trabalho, estudo e entretenimento." },
  { handle: "smartwatch", label: "Smartwatch", query: "product_type:Smartwatches OR title:watch", description: "Relógios inteligentes para o seu dia a dia." },
  { handle: "games", label: "Games", query: "product_type:Consoles OR product_type:Games OR title:playstation OR title:xbox", description: "Consoles, jogos e acessórios gamer." },
  { handle: "audio", label: "Áudio", query: "product_type:'Fones de Ouvido' OR product_type:Áudio OR title:airpods OR title:fone", description: "Fones, caixas de som e equipamentos de áudio premium." },
  { handle: "drones", label: "Drones", query: "product_type:Drones OR title:drone", description: "Drones profissionais e para hobby." },
  { handle: "cameras", label: "Câmeras", query: "product_type:Câmeras OR product_type:Cameras OR title:camera OR title:câmera", description: "Câmeras e equipamentos para fotografia e vídeo." },
  { handle: "acessorios", label: "Acessórios", query: "product_type:'Localizadores de Objetos' OR product_type:Acessórios", description: "Acessórios essenciais para sua tecnologia." },
];

export function findCategory(handle: string): Category | undefined {
  return CATEGORIES.find((c) => c.handle === handle);
}
