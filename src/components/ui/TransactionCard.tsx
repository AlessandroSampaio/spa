import { LastTransaction } from "../../types/product";
import { Card } from "./Card";

interface TransactionCardProps {
  type: "purchase" | "sale";
  data: LastTransaction;
}

const config = {
  purchase: {
    label: "Última Compra",
    priceLabel: "Custo",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    badgeText: "Compra",
  },
  sale: {
    label: "Última Venda",
    priceLabel: "Preço",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    badgeText: "Venda",
  },
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function TransactionCard(props: TransactionCardProps) {
  const cfg = () => config[props.type];

  return (
    <Card class="flex flex-col gap-4 p-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
          {cfg().label}
        </span>
        <span class={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg().badge}`}>
          {cfg().badgeText}
        </span>
      </div>

      <div class="flex flex-col gap-2">
        <Row label="Data" value={props.data.date} />
        <Row label={cfg().priceLabel} value={fmtCurrency(props.data.price)} />
        <Row label="Quantidade" value={`${props.data.quantity} un`} />
      </div>
    </Card>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-xs text-gray-400 dark:text-gray-500">{props.label}</span>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-200">{props.value}</span>
    </div>
  );
}
