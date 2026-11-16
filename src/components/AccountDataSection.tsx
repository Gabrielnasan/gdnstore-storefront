import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  type AddressFormPayload,
  type CustomerAccountAddress,
  type CustomerAccountCustomer,
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAccountDetails,
  updateCustomerAddress,
  updateCustomerProfile,
} from "@/lib/customerAccount";

const BR_UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; customer: CustomerAccountCustomer; addresses: CustomerAccountAddress[] };

export default function AccountDataSection({
  fallbackEmail,
}: {
  fallbackEmail: string | null;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [editingAddress, setEditingAddress] = useState<CustomerAccountAddress | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setState({ status: "loading" });
    const res = await getCustomerAccountDetails();
    if (res.success) {
      setState({ status: "ready", customer: res.customer, addresses: res.addresses });
    } else {
      setState({ status: "error", message: res.error });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section id="dados" className="space-y-8 scroll-mt-24">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-lg sm:text-xl font-bold mb-1">Dados pessoais</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Atualize seu nome. O e-mail não pode ser alterado por aqui.
        </p>

        {state.status === "loading" && (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {state.status === "error" && (
          <ErrorBlock message="Não foi possível carregar seus dados." onRetry={() => void load()} />
        )}
        {state.status === "ready" && (
          <ProfileForm
            customer={state.customer}
            fallbackEmail={fallbackEmail}
            onSaved={(c) =>
              setState((prev) =>
                prev.status === "ready" ? { ...prev, customer: c } : prev,
              )
            }
          />
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold">Meus endereços</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Endereços salvos para entrega dos seus pedidos.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Adicionar endereço
          </button>
        </div>

        {state.status === "loading" && (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {state.status === "error" && (
          <ErrorBlock message="Não foi possível carregar seus endereços." onRetry={() => void load()} />
        )}
        {state.status === "ready" && state.addresses.length === 0 && (
          <div className="bg-surface-muted/40 border border-dashed border-border rounded-xl p-8 text-center">
            <MapPin className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Você ainda não possui endereços cadastrados.
            </p>
          </div>
        )}
        {state.status === "ready" && state.addresses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.addresses.map((a) => (
              <AddressCard
                key={a.id}
                address={a}
                onEdit={() => setEditingAddress(a)}
                onChanged={() => void load()}
              />
            ))}
          </div>
        )}
      </div>

      {(creating || editingAddress) && (
        <AddressModal
          initial={editingAddress}
          onClose={() => {
            setCreating(false);
            setEditingAddress(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditingAddress(null);
            void load();
          }}
        />
      )}
    </section>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-6 space-y-3">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-border text-sm font-semibold hover:bg-surface-muted transition"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function ProfileForm({
  customer,
  fallbackEmail,
  onSaved,
}: {
  customer: CustomerAccountCustomer;
  fallbackEmail: string | null;
  onSaved: (c: CustomerAccountCustomer) => void;
}) {
  const [firstName, setFirstName] = useState(customer.firstName ?? "");
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await updateCustomerProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    setSaving(false);
    if (res.success) {
      setFeedback({ type: "success", msg: "Dados atualizados com sucesso." });
      onSaved(res.customer);
    } else {
      setFeedback({
        type: "error",
        msg: res.userErrors?.[0]?.message ?? "Não foi possível atualizar seus dados.",
      });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nome" value={firstName} onChange={setFirstName} maxLength={80} />
        <Input label="Sobrenome" value={lastName} onChange={setLastName} maxLength={80} />
      </div>
      <Input
        label="E-mail"
        value={customer.email ?? fallbackEmail ?? ""}
        onChange={() => {}}
        disabled
      />
      {feedback && (
        <div
          className={`text-sm rounded-lg px-3 py-2 ${
            feedback.type === "success"
              ? "bg-highlight/15 text-foreground border border-highlight/30"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {feedback.msg}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar dados
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  onEdit,
  onChanged,
}: {
  address: CustomerAccountAddress;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<"delete" | "default" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const recipient = [address.firstName, address.lastName].filter(Boolean).join(" ") || "—";
  const cityState = [address.city, address.zoneCode].filter(Boolean).join(" / ");

  const remove = async () => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    setBusy("delete");
    setErr(null);
    const res = await deleteCustomerAddress(address.id);
    setBusy(null);
    if (res.success) onChanged();
    else setErr("Não foi possível excluir o endereço.");
  };

  const setDefault = async () => {
    setBusy("default");
    setErr(null);
    const res = await updateCustomerAddress(address.id, {
      firstName: address.firstName ?? "",
      lastName: address.lastName ?? "",
      company: address.company ?? "",
      address1: address.address1 ?? "",
      address2: address.address2 ?? "",
      city: address.city ?? "",
      zoneCode: address.zoneCode ?? "",
      territoryCode: address.territoryCode ?? "BR",
      zip: address.zip ?? "",
      phoneNumber: address.phoneNumber ?? "",
      defaultAddress: true,
    });
    setBusy(null);
    if (res.success) onChanged();
    else setErr("Não foi possível definir como padrão.");
  };

  return (
    <article className="border border-border rounded-xl p-4 bg-surface-muted/30 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-display font-semibold">{recipient}</div>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-highlight text-highlight-foreground text-[11px] font-semibold uppercase tracking-wide">
            <Star className="w-3 h-3" /> Padrão
          </span>
        )}
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5">
        {address.company && <div>{address.company}</div>}
        <div>
          {address.address1}
          {address.address2 ? `, ${address.address2}` : ""}
        </div>
        <div>{cityState}</div>
        {address.zip && <div>CEP {address.zip}</div>}
        {address.phoneNumber && <div>Tel: {address.phoneNumber}</div>}
      </div>
      {err && <div className="text-xs text-destructive">{err}</div>}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-semibold hover:bg-surface-muted transition"
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        {!address.isDefault && (
          <button
            onClick={setDefault}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-semibold hover:bg-surface-muted transition disabled:opacity-60"
          >
            {busy === "default" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
            Definir como padrão
          </button>
        )}
        <button
          onClick={remove}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition disabled:opacity-60"
        >
          {busy === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Excluir
        </button>
      </div>
    </article>
  );
}

function AddressModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: CustomerAccountAddress | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = initial !== null;
  const [form, setForm] = useState<AddressFormPayload>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    company: initial?.company ?? "",
    address1: initial?.address1 ?? "",
    address2: initial?.address2 ?? "",
    city: initial?.city ?? "",
    zoneCode: initial?.zoneCode ?? "",
    territoryCode: initial?.territoryCode ?? "BR",
    zip: initial?.zip ?? "",
    phoneNumber: initial?.phoneNumber ?? "",
    defaultAddress: initial?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof AddressFormPayload>(k: K, v: AddressFormPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = editing
      ? await updateCustomerAddress(initial!.id, form)
      : await createCustomerAddress(form);
    setSaving(false);
    if (res.success) onSaved();
    else
      setErr(
        res.userErrors?.[0]?.message ??
          "Não foi possível salvar o endereço. Verifique os campos e tente novamente.",
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-elegant max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-display text-lg font-bold">
            {editing ? "Editar endereço" : "Adicionar endereço"}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-muted flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome" value={form.firstName} onChange={(v) => set("firstName", v)} required />
            <Input label="Sobrenome" value={form.lastName} onChange={(v) => set("lastName", v)} required />
          </div>
          <Input label="Empresa (opcional)" value={form.company ?? ""} onChange={(v) => set("company", v)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="CEP" value={form.zip} onChange={(v) => set("zip", v)} required />
            <Input label="Telefone" value={form.phoneNumber} onChange={(v) => set("phoneNumber", v)} required />
            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Estado (UF) <span className="text-destructive">*</span>
              </label>
              <select
                value={form.zoneCode}
                onChange={(e) => set("zoneCode", e.target.value)}
                required
                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-highlight"
              >
                <option value="">UF</option>
                {BR_UF.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Endereço" value={form.address1} onChange={(v) => set("address1", v)} required />
          <Input
            label="Número, complemento e bairro"
            value={form.address2 ?? ""}
            onChange={(v) => set("address2", v)}
            hint="Ex.: 123 — Apto 45 — Centro"
          />
          <Input label="Cidade" value={form.city} onChange={(v) => set("city", v)} required />
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">
              País
            </label>
            <input
              value="Brasil"
              disabled
              className="w-full h-11 px-3 rounded-lg border border-border bg-surface-muted text-sm text-muted-foreground"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.defaultAddress === true}
              onChange={(e) => set("defaultAddress", e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            Definir como endereço padrão
          </label>
          {err && (
            <div className="text-sm rounded-lg px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20">
              {err}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-full border border-border text-sm font-semibold hover:bg-surface-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-ink-foreground text-sm font-semibold hover:bg-highlight hover:text-highlight-foreground transition disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Adicionar endereço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
  required,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className={`w-full h-11 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-highlight ${
          disabled ? "bg-surface-muted text-muted-foreground" : "bg-background"
        }`}
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
