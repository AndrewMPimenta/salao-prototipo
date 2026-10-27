import { AMBIENTES, MESAS } from "@/lib/data";
import { LIMIARES_PADRAO } from "@/lib/state";
import { SalaoClient } from "@/components/salao-client";

export default async function Page() {
  return (
    <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 sm:py-12">
      <SalaoClient mesas={MESAS} ambientes={AMBIENTES} limiares={LIMIARES_PADRAO} />
    </main>
  );
}
