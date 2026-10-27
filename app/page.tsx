import { AMBIENTES, MESAS } from "@/lib/data";
import { LIMIARES_PADRAO } from "@/lib/state";
import { SalaoClient } from "@/components/salao-client";

export default function Page() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <SalaoClient mesas={MESAS} ambientes={AMBIENTES} limiares={LIMIARES_PADRAO} />
    </main>
  );
}
