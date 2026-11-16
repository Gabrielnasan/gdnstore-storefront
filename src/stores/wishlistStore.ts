import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WishlistItem {
  handle: string;
  title: string;
  image: string | null;
  vendor: string | null;
  price: { amount: string; currencyCode: string };
  addedAt: number;
}

interface WishlistStore {
  items: WishlistItem[];
  has: (handle: string) => boolean;
  toggle: (item: Omit<WishlistItem, "addedAt">) => void;
  add: (item: Omit<WishlistItem, "addedAt">) => void;
  remove: (handle: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      has: (handle) => get().items.some((i) => i.handle === handle),
      toggle: (item) => {
        const exists = get().items.some((i) => i.handle === item.handle);
        if (exists) get().remove(item.handle);
        else get().add(item);
      },
      add: (item) => {
        if (get().items.some((i) => i.handle === item.handle)) return;
        set({ items: [{ ...item, addedAt: Date.now() }, ...get().items] });
      },
      remove: (handle) => set({ items: get().items.filter((i) => i.handle !== handle) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "gdn-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);
