import { For, createSignal, createMemo } from "solid-js";
import { getDailySummariesWithTotals, keepAlive, updateSummary } from "../server/api.ts";
import { createUrlSignal } from "../utils/createUrlSignal.ts";
import { parseDateRange } from "../utils/formatDate.ts";
import { createDebouncedAsync } from "../utils/createDebouncedAsync.ts";
import { debounce } from "../utils/debounce.ts";

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

const updateSummaryDebounced = debounce(updateSummary, 150);

export default function StatsTable() {
  const [dayFilter, setDayFilter] = createUrlSignal("1 months", "day");
  const [clientFilter, setClientFilter] = createUrlSignal("", "client");
  const [projectFilter, setProjectFilter] = createUrlSignal("", "project");
  const [fxExpr, setFxExpr] = createUrlSignal("r(x*1.25*2,0)/2", "fx");
  const [hoursFilter, setHoursFilter] = createUrlSignal(
    "x>0.01",
    "hoursFilter",
  );
  const parsedDateRange = createMemo(() => parseDateRange(dayFilter()));

  const [getData] = createDebouncedAsync(
    [],
    getDailySummariesWithTotals,
    () => ({
      ...parsedDateRange(),
      client: clientFilter(),
      project: projectFilter(),
    }),
  );

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
    console.log("Processing data with filters...");
    const rows = getData()
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
          <th class="w-[100px]">
            <input
              type="text"
              value={dayFilter()}
              onInput={(e) => {
                setDayFilter(e.currentTarget.value);
              }}
              class="input input-ghost input-xs w-full mt-1 p-0"
              placeholder="Days"
            />
          </th>
          <th class="w-[20%]">
            <input
              type="text"
              value={clientFilter()}
              onInput={(e) => {
                setClientFilter(e.currentTarget.value);
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
                  onInput={(e) => {
                    e.preventDefault();
                    const value = e.currentTarget.value;
                    // keepAlive(); // Keep the server alive on user input
                    updateSummaryDebounced({
                      day: new Date(row.day + "T00:00:00"),
                      client: row.client,
                      project: row.project,
                      summary: value,
                    });
                  }}
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
