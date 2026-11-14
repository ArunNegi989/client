"use client";

import { getAddToCartProductsAPI } from "@/apis/addToCartAPIs";
import { getWishListAPI } from "@/apis/wishlistAPIs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type CountContextType = {
  cartCount: number;
  wishlistCount: number;
  refreshCounts: () => Promise<void>;
};

const CountContext = createContext<CountContextType>({
  cartCount: 0,
  wishlistCount: 0,
  refreshCounts: async () => {},
});

export const useCounts = () => useContext(CountContext);

export const CountBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-semibold text-white bg-red-500 rounded-full border-2 border-white">
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

export const CountProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const refreshCounts = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    const [cartRes, wishRes] = await Promise.allSettled([
      getAddToCartProductsAPI(),
      getWishListAPI(),
    ]);

    setCartCount(
      cartRes.status === "fulfilled"
        ? cartRes.value.data?.data?.products?.length ?? 0
        : 0
    );
    setWishlistCount(
      wishRes.status === "fulfilled"
        ? wishRes.value.data?.data?.product_id?.length ?? 0
        : 0
    );
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const handler = () => {
      refreshCounts();
    };
    window.addEventListener("counts:refresh", handler);
    return () => window.removeEventListener("counts:refresh", handler);
  }, [refreshCounts]);

  return (
    <CountContext.Provider value={{ cartCount, wishlistCount, refreshCounts }}>
      {children}
    </CountContext.Provider>
  );
};