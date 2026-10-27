import { MESAS } from "./lib/data";
const k = 0.013;
function box(m: any) {
  const cx = m.x, cy = m.y;
  return m;
}
for (const [amb, L, P] of [["terraco", 26.8, 11.5], ["hotbeach", 33, 24]] as const) {
  const ms = MESAS.filter((m) => m.ambienteId === amb);
  const f = ms.map((m) => {
    const hw = (m.forma === "redonda" ? m.largura / 2 + 15 : m.largura / 2 + 3) * k;
    const hh = (m.forma === "redonda" ? m.altura / 2 + 15 : m.altura / 2 + 13) * k;
    return { id: m.id, x: (m.x / 100) * L, z: (m.y / 100) * P, hw, hh };
  });
  let min = 99, par = "";
  for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
    const gx = Math.abs(f[i].x - f[j].x) - f[i].hw - f[j].hw;
    const gz = Math.abs(f[i].z - f[j].z) - f[i].hh - f[j].hh;
    const g = Math.max(gx, gz);
    if (g < min) { min = g; par = f[i].id + "-" + f[j].id; }
  }
  const oc = ms.filter((m) => m.pessoas > 0).length;
  const al = ms.filter((m) => m.pessoas > 0 && ((m.semPedido ?? 0) > 20 || m.contaImpressa)).length;
  console.log(amb, ms.length, "minGap", min.toFixed(2), par, "ocup", oc, "alert", al, "reserv", ms.filter((m) => m.reserva).length, "ids", ms[0].id, ms.at(-1)!.id);
}
