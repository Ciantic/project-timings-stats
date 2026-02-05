import { For, createSignal, createMemo } from "solid-js";
import { getDailySummariesWithTotals } from "../server/api.ts";
import { onMount } from "solid-js";
import { createUrlSignal } from "../utils/createUrlSignal.ts";
import "./StatsTable.css";

interface TableRow {
  day: string;
  project: string;
  client: string;
  summary: string;
  total: number;
  fx?: number | string;
}

function makeId(row: TableRow) {
  return `${row.day}-${row.project}-${row.client}`;
}

function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number,
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

export default function StatsTable() {
  const [data, setData] = createSignal<TableRow[]>([]);
  const [clientFilter, setClientFilter] = createUrlSignal("", "client");
  const [projectFilter, setProjectFilter] = createUrlSignal("", "project");
  const [fxExpr, setFxExpr] = createUrlSignal("r(x*1.25*2,0)/2", "fx");
  const [hoursFilter, setHoursFilter] = createUrlSignal(
    "x>0.01",
    "hoursFilter",
  );

  async function updateData() {
    const data = await getDailySummariesWithTotals({
      from: "2026-01-01",
      to: "2026-01-31",
      client: clientFilter() || undefined,
      project: projectFilter() || undefined,
    });
    setData(data);
  }

  const debouncedUpdateData = debounceAsync(updateData, 150);

  const fxFunc = createMemo(() => (x: number) => {
    const r = (x: number, n = 1) => {
      const factor = Math.pow(10, n);
      return Math.round(x * factor) / factor;
    };
    const c = (x: number) => Math.ceil(x);
    const f = (x: number) => Math.floor(x);

    try {
      return (
        Math.round(
          new Function("x", "r", "c", "f", "return " + fxExpr())(x, r, c, f) *
            100,
        ) / 100
      );
    } catch (e) {
      return "Error";
    }
  });

  const hoursFilterFunc = createMemo(() => (x: number): boolean | string => {
    if (hoursFilter() === "") {
      return true;
    }
    try {
      return new Function("x", "return " + hoursFilter())(x);
    } catch (e) {
      return "Error";
    }
  });

  const dataProcessed = createMemo(() => {
    const rows = data()
      .map((row) => ({
        ...row,
        fx: fxFunc()(row.total),
      }))
      .filter((row) => {
        const hoursFilterResult = hoursFilterFunc()(row.total);
        if (typeof hoursFilterResult === "boolean" && !hoursFilterResult) {
          return false;
        }

        const clientFilterVal = clientFilter().toLowerCase();
        if (
          clientFilterVal &&
          !row.client.toLowerCase().includes(clientFilterVal)
        ) {
          return false;
        }

        const projectFilterVal = projectFilter().toLowerCase();
        if (
          projectFilterVal &&
          !row.project.toLowerCase().includes(projectFilterVal)
        ) {
          return false;
        }

        return typeof hoursFilterResult === "boolean"
          ? hoursFilterResult
          : false;
      });

    return {
      rows,
      totalHours: rows.reduce((acc, row) => acc + row.total, 0),
      totalFx: rows.reduce(
        (acc, row) => acc + (typeof row.fx === "number" ? row.fx : 0),
        0,
      ),
    };
  });

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
    if (selectedRows().size === dataProcessed().rows.length) {
      setSelectedRows(new Set<string>());
    } else {
      setSelectedRows(new Set(dataProcessed().rows.map(makeId)));
    }
  };

  const updateSummary = (id: string, summary: string) => {
    setData((rows) =>
      rows.map((row) => (makeId(row) === id ? { ...row, summary } : row)),
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
                el.indeterminate =
                  selectedRows().size > 0 &&
                  selectedRows().size < dataProcessed().rows.length;
              }}
              checked={
                selectedRows().size === dataProcessed().rows.length &&
                dataProcessed().rows.length > 0
              }
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
                setClientFilter(e.currentTarget.value);
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
                setProjectFilter(e.currentTarget.value);
                debouncedUpdateData();
              }}
              class="input input-ghost input-xs w-full mt-1 p-0"
              placeholder="Project"
            />
          </th>
          <th class="w-[80px]">
            <input
              type="text"
              value={hoursFilter()}
              onInput={(e) => {
                setHoursFilter(e.currentTarget.value);
              }}
              class="input input-ghost input-xs w-full mt-1 p-0"
              placeholder="Hours"
            />
          </th>
          <th class="w-[80px]">
            <input
              type="text"
              value={fxExpr()}
              onInput={(e) => {
                setFxExpr(e.currentTarget.value);
              }}
              class="input input-ghost input-xs w-full mt-1 p-0"
              placeholder="Σ"
            />
          </th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        <For each={dataProcessed().rows}>
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
              <td>{typeof row.fx === "number" ? row.fx.toFixed(2) : row.fx}</td>
              <td>
                <input
                  type="text"
                  value={row.summary}
                  onInput={(e) =>
                    updateSummary(makeId(row), e.currentTarget.value)
                  }
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
          <td class="">{dataProcessed().totalHours.toFixed(2)}</td>
          <td class="">{dataProcessed().totalFx.toFixed(2)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  );
}
