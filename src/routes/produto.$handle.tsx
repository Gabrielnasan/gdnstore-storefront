import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy PT-BR product URL. Redirects to the canonical /product/$handle
 * route so the same product is never served (and previewed) on two URLs.
 */
export const Route = createFileRoute("/produto/$handle")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/product/$handle", params: { handle: params.handle }, replace: true });
  },
});
