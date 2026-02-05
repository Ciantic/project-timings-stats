import { For, createSignal } from "solid-js";
import { getDailySummariesWithTotals } from "../server/api.ts";
import { useSearchParams } from "@solidjs/router";
import { onMount } from "solid-js";
import "./StatsTable.css";

interface TableRow {
    day: string;
    project: string;
    client: string;
    summary: string;
    total: number;
}

function makeId(row: TableRow) {
  return `${row.day}-${row.project}-${row.client}`;
}

function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function getParamAsString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function StatsTable() {

  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = createSignal<TableRow[]>([]);
  const [clientFilter, setClientFilter] = createSignal(getParamAsString(searchParams.client));
  const [projectFilter, setProjectFilter] = createSignal(getParamAsString(searchParams.project));

  async function updateData() {
    const data = await getDailySummariesWithTotals({
      from: "2026-01-01",
      to: "2026-01-31",
      client: clientFilter() || undefined,
      project: projectFilter() || undefined
    });
    setData(data);
  }

  const debouncedUpdateData = debounceAsync(updateData, 300);

  onMount(() => {
    updateData();
  });

  const [selectedRows, setSelectedRows] = createSignal<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows());
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows().size === data().length) {
      setSelectedRows(new Set<string>());
    } else {
      setSelectedRows(new Set(data().map(makeId)));
    }
  };

  const updateSummary = (id: string, summary: string) => {
    setData((rows) =>
      rows.map((row) => (makeId(row) === id ? { ...row, summary } : row))
    );
  };

  return (
      <table class="table table-sm my-stats-table">
        <thead>
          <tr>
            <th class="w-[40px]">
              <input
                type="checkbox"
                ref={(el) => {
                  el.indeterminate = selectedRows().size > 0 && selectedRows().size < data().length;
                }}
                checked={selectedRows().size === data().length && data().length > 0}
                onChange={toggleAll}
                class="checkbox checkbox-primary checkbox-sm"
              />
            </th>
            <th class="w-[100px]">Day</th>
            <th class="w-[20%]">
              <input
                type="text"
                value={clientFilter()}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setClientFilter(value);
                  setSearchParams({ client: value || undefined });
                  debouncedUpdateData();
                }}
                class="input input-ghost input-xs w-full mt-1 p-0"
                placeholder="Client"
              />
            </th>
            <th class="w-[20%]">
              <input
                type="text"
                value={projectFilter()}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setProjectFilter(value);
                  setSearchParams({ project: value || undefined });
                  debouncedUpdateData();
                }}
                class="input input-ghost input-xs w-full mt-1 p-0"
                placeholder="Project"
              />
            </th>
            <th class="w-[80px]">Total</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          <For each={data()}>
            {(row) => (
              <tr class="hover">
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows().has(makeId(row))}
                    onChange={() => toggleRow(makeId(row))}
                    class="checkbox checkbox-primary checkbox-sm"
                  />
                </td>
                <td>{row.day}</td>
                <td>{row.client}</td>
                <td>{row.project}</td>
                <td>{row.total.toFixed(2)}</td>
                <td>
                  <input
                    type="text"
                    value={row.summary}
                    onInput={(e) => updateSummary(makeId(row), e.currentTarget.value)}
                    class="input input-ghost input-sm w-full"
                    // placeholder="Enter summary"
                  />
                </td>
              </tr>
            )}
          </For>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}></td>
            <td class="">
              {data().reduce((acc, row) => acc + row.total, 0).toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
  );
}
