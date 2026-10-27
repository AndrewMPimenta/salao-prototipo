import type { Limiares, Mesa } from "@/lib/types";
import { derivarAlertas, derivarEstado, minutosAteLiberar, ROTULO_ALERTA, ROTULO_ESTADO } from "@/lib/state";
import { formatarDuracao, formatarMoeda } from "@/lib/utils";
import { AmostraEstado } from "../amostra-estado";
import { FichaAlerta } from "../selo-alerta";

interface AbaResumoProps {
  mesa: Mesa;
  limiares: Limiares;
}

/** O que o popup mostrava antes das abas: estado, alertas e os dados da mesa. */
export function AbaResumo({ mesa, limiares }: AbaResumoProps) {
  const estado = derivarEstado(mesa, limiares);
  const alertas = derivarAlertas(mesa, limiares);
  const ocupada = mesa.pessoas > 0;
  const pendentes = mesa.pedidosPendentes ?? 0;
  const restam = minutosAteLiberar(mesa, limiares);

  return (
    <div>
      {/* O estado em TEXTO aqui é o que dispensa legenda fixa no celular. */}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        <li className="flex items-center gap-2.5 text-[15px] font-semibold leading-6 text-(--color-ink)">
          <span className="grid size-6 flex-none place-items-center">
            <AmostraEstado estado={estado} className="size-5" />
          </span>
          {ROTULO_ESTADO[estado]}
        </li>
        {alertas.map((a) => (
          <li key={a.tipo} className="flex items-center gap-2.5 text-[15px] leading-6 text-(--color-ink)">
            <FichaAlerta tipo={a.tipo} />
            <span className="min-w-0 flex-1">
              <b className="font-semibold">{ROTULO_ALERTA[a.tipo]}</b>{" "}
              <span className="tnum text-(--color-ink-2)">há {formatarDuracao(a.minutos)}</span>
            </span>
          </li>
        ))}
      </ul>

      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-(--color-line) pt-3 text-[13px] leading-5">
        {ocupada ? (
          <>
            <Item rotulo="Pessoas" valor={`${mesa.pessoas} de ${mesa.lugares} lugares`} />
            <Item
              rotulo="Permanência"
              valor={`${formatarDuracao(mesa.abertaHa ?? 0)} de ${formatarDuracao(limiares.permanenciaMedia)}`}
            />
            <Item rotulo="Último pedido há" valor={formatarDuracao(mesa.semPedido ?? 0)} />
            <Item
              rotulo="Pedidos pendentes"
              valor={pendentes > 0 ? `${pendentes} · mais antigo ${formatarDuracao(mesa.pendenteHa ?? 0)}` : "Nenhum"}
            />
            {mesa.contaImpressa && <Item rotulo="Conta impressa há" valor={formatarDuracao(mesa.contaImpressaHa ?? 0)} />}
            {mesa.total != null && <Item rotulo="Consumo" valor={formatarMoeda(mesa.total)} />}
            {mesa.total != null && <Item rotulo="Por pessoa" valor={formatarMoeda(mesa.total / mesa.pessoas)} />}
            <Item rotulo="Previsão de liberação" valor={restam > 0 ? `em ${formatarDuracao(restam)}` : "Passou da média"} />
          </>
        ) : (
          <>
            <Item rotulo="Lugares" valor={String(mesa.lugares)} />
            {mesa.livreHa != null && <Item rotulo="Livre há" valor={formatarDuracao(mesa.livreHa)} />}
            <Item
              rotulo="Próxima reserva"
              valor={
                mesa.reserva
                  ? `${mesa.reserva.hora} · ${mesa.reserva.nome} · ${mesa.reserva.pessoas} pessoas`
                  : "Sem reservas"
              }
            />
          </>
        )}
      </dl>
    </div>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt className="text-(--color-ink-2)">{rotulo}</dt>
      <dd className="tnum m-0 text-right text-[15px] font-medium leading-5">{valor}</dd>
    </>
  );
}
