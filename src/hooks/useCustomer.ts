import { useEffect, useState } from "react";
import {
  getCurrentCustomer,
  getCustomerSessionToken,
  type CustomerProfile,
} from "@/lib/customerSession";

type State =
  | { status: "loading"; customer: null }
  | { status: "anonymous"; customer: null }
  | { status: "authenticated"; customer: CustomerProfile };

export function useCustomer(): State & { refresh: () => Promise<void> } {
  const [state, setState] = useState<State>({ status: "loading", customer: null });

  const refresh = async () => {
    if (!getCustomerSessionToken()) {
      setState({ status: "anonymous", customer: null });
      return;
    }
    const res = await getCurrentCustomer();
    if (res.authenticated) setState({ status: "authenticated", customer: res.customer });
    else setState({ status: "anonymous", customer: null });
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { ...state, refresh };
}
