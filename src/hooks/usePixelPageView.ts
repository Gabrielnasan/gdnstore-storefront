import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView } from "@/lib/pixel";

export const usePixelPageView = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    trackPageView();
  }, [pathname]);
};
