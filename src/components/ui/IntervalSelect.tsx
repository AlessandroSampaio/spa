import { Select } from "@kobalte/core";
import {
  interval,
  setInterval,
  INTERVAL_LABELS,
  type Interval,
} from "../../stores/interval";

type IntervalOption = { value: Interval; label: string };

const INTERVAL_OPTIONS: IntervalOption[] = (
  Object.entries(INTERVAL_LABELS) as [Interval, string][]
).map(([value, label]) => ({ value, label }));

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function IntervalSelect() {
  const selected = () =>
    INTERVAL_OPTIONS.find((o) => o.value === interval())!;

  return (
    <Select.Root<IntervalOption>
      options={INTERVAL_OPTIONS}
      optionValue="value"
      optionTextValue="label"
      value={selected()}
      onChange={(opt) => opt && setInterval(opt.value)}
      itemComponent={(props) => (
        <Select.Item
          item={props.item}
          class="
            flex cursor-pointer items-center px-3 py-2 text-sm
            text-gray-700 outline-none transition-colors
            hover:bg-gray-50
            data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700
            dark:text-gray-300 dark:hover:bg-white/5
            dark:data-[highlighted]:bg-primary-900/20 dark:data-[highlighted]:text-primary-300
          "
        >
          <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
        </Select.Item>
      )}
    >
      <Select.Trigger
        class="
          flex h-[38px] w-[140px] shrink-0 items-center gap-1.5 rounded-md
          border border-gray-200 bg-white px-3 text-sm
          text-gray-700 outline-none transition-colors
          hover:border-gray-300
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          dark:border-white/10 dark:bg-surface-dark dark:text-gray-300
          dark:hover:border-white/20
          dark:focus:border-primary-400 dark:focus:ring-primary-400/20
        "
      >
        <Select.Value<IntervalOption> class="flex-1 text-left">
          {(state) => state.selectedOption().label}
        </Select.Value>
        <Select.Icon class="ml-auto text-gray-400 dark:text-gray-500">
          <ChevronIcon />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          class="
            z-50 min-w-[140px] overflow-hidden rounded-md
            border border-gray-200 bg-white shadow-lg
            dark:border-white/10 dark:bg-surface-dark
          "
        >
          <Select.Listbox class="py-1" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
