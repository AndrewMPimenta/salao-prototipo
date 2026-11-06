import { AMBIENTES, resumoDoAmbiente } from "@/lib/data";
import { LIMIARES_PADRAO } from "@/lib/state";
import { SalaoClient } from "@/components/salao-client";

export default function Page() {
  // Só os resumos viajam no payload; as mesas de cada salão são geradas no cliente, a pedido, de forma determinística.
  const ambientes = AMBIENTES.map((a) => ({ ...a, resumo: resumoDoAmbiente(a.id) }));
  return (
    <main className="h-dvh w-full overflow-hidden">
      <SalaoClient ambientes={ambientes} limiares={LIMIARES_PADRAO} />
    </main>
  );
}
