import { html as c, css as I, state as l, customElement as z } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as F } from "@umbraco-cms/backoffice/lit-element";
import { c as y } from "./client.gen-Cq1iPozM.js";
async function T() {
  const { data: e, error: t, response: r } = await y.get({
    url: "/umbraco/envcompare/api/v1/environments"
  });
  if (t || !r.ok)
    throw new Error(
      `Failed to load environments (${r?.status ?? "unknown"}).`
    );
  const i = e;
  return Array.isArray(i) ? i : [];
}
async function D(e) {
  const { data: t, error: r, response: i } = await y.post({
    url: "/umbraco/envcompare/api/v1/compare",
    body: e,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (r || !i.ok) {
    const d = typeof r == "string" ? r : `Comparison failed (${i?.status ?? "unknown"}).`;
    throw new Error(d);
  }
  return t;
}
function u(e) {
  return typeof e == "number" ? ["Identical", "Added", "Missing", "Modified", "Ignored"][e] ?? String(e) : e;
}
var O = Object.defineProperty, P = Object.getOwnPropertyDescriptor, $ = (e) => {
  throw TypeError(e);
}, o = (e, t, r, i) => {
  for (var d = i > 1 ? void 0 : i ? P(t, r) : t, v = e.length - 1, f; v >= 0; v--)
    (f = e[v]) && (d = (i ? f(t, r, d) : f(d)) || d);
  return i && d && O(t, r, d), d;
}, _ = (e, t, r) => t.has(e) || $("Cannot " + r), N = (e, t, r) => (_(e, t, "read from private field"), t.get(e)), b = (e, t, r) => t.has(e) ? $("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), R = (e, t, r, i) => (_(e, t, "write to private field"), t.set(e, r), r), a = (e, t, r) => (_(e, t, "access private method"), r), h, s, w, C, k, x, A, E, L, S, g, p, m, M, B;
let n = class extends F {
  constructor() {
    super(...arguments), b(this, s), this._environments = [], this._environmentA = "Local", this._environmentB = "", this._isComparing = !1, this._isLoadingEnvironments = !0, this._progress = 0, this._statusMessage = "Loading environments…", this._activeTab = "content", this._search = "", this._statusFilter = "", this._result = null, this._selectedItem = null, b(this, h, null);
  }
  connectedCallback() {
    super.connectedCallback(), a(this, s, w).call(this);
  }
  render() {
    return c`
      <div class="layout">
        <header class="toolbar">
          <div class="brand">
            <h1>EnvCompare</h1>
            <p>Compare content between Umbraco Cloud environments (read-only).</p>
          </div>

          <div class="controls">
            <label>
              <span>Environment A</span>
              <select
                .value=${this._environmentA}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${a(this, s, C)}
              >
                ${a(this, s, g).call(this, this._environmentA)}
              </select>
            </label>

            <uui-button
              look="secondary"
              label="Swap environments"
              compact
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${a(this, s, E)}
            >
              ⇄
            </uui-button>

            <label>
              <span>Environment B</span>
              <select
                .value=${this._environmentB}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${a(this, s, k)}
              >
                ${a(this, s, g).call(this, this._environmentB)}
              </select>
            </label>

            <uui-button
              look="primary"
              color="positive"
              label="Compare"
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${a(this, s, S)}
            >
              Compare
            </uui-button>
          </div>

          <div class="progress-block">
            <div class="progress-track" aria-hidden="true">
              <div
                class="progress-fill"
                style="width: ${this._progress}%"
              ></div>
            </div>
            <p class="status">${this._statusMessage}</p>
          </div>
        </header>

        <section class="summary" aria-label="Comparison summary">
          ${a(this, s, p).call(this, "Total Compared", this._result ? String(this._result.totalCompared) : "—", "neutral")}
          ${a(this, s, p).call(this, "Modified", this._result ? String(this._result.modifiedCount) : "—", "modified")}
          ${a(this, s, p).call(this, "Missing", this._result ? String(this._result.missingCount) : "—", "missing")}
          ${a(this, s, p).call(this, "Added", this._result ? String(this._result.addedCount) : "—", "added")}
          ${a(this, s, p).call(this, "Identical", this._result ? String(this._result.identicalCount) : "—", "identical")}
        </section>

        <div class="workspace">
          <aside class="filters" aria-label="Filters">
            <h2>Filters</h2>
            <label>
              <span>Search</span>
              <input
                type="search"
                placeholder="Instant search…"
                .value=${this._search}
                @input=${a(this, s, x)}
              />
            </label>
            <label>
              <span>Status</span>
              <select .value=${this._statusFilter} @change=${a(this, s, A)}>
                <option value="">All statuses</option>
                <option value="Identical">Identical</option>
                <option value="Added">Added</option>
                <option value="Missing">Missing</option>
                <option value="Modified">Modified</option>
                <option value="Ignored">Ignored</option>
              </select>
            </label>
            <p class="hint">
              Filters apply to the current result set. Re-run Compare to push
              filters to the engine.
            </p>
          </aside>

          <main class="results">
            <nav class="tabs" aria-label="Result categories">
              ${a(this, s, m).call(this, "content", "Content")}
              ${a(this, s, m).call(this, "media", "Media")}
              ${a(this, s, m).call(this, "settings", "Settings")}
              ${a(this, s, m).call(this, "dictionary", "Dictionary")}
            </nav>

            <div class="tree-panel">
              <h2>${this._activeTab}</h2>
              ${a(this, s, M).call(this)}
            </div>
          </main>

          <aside class="diff-panel" aria-label="Property differences">
            <h2>Differences</h2>
            ${a(this, s, B).call(this)}
          </aside>
        </div>
      </div>
    `;
  }
};
h = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
w = async function() {
  this._isLoadingEnvironments = !0;
  try {
    const e = await T();
    this._environments = e;
    const t = e.find((i) => i.isLocal)?.name ?? "Local", r = e.find((i) => !i.isLocal)?.name ?? e.find((i) => i.name !== t)?.name ?? "";
    this._environmentA = t, this._environmentB = r, this._statusMessage = e.length > 1 ? "Select two environments, then compare." : "Only Local is available. Configure remote ApiUrl values in appsettings.";
  } catch (e) {
    this._environments = [
      {
        name: "Local",
        displayName: "Local",
        isLocal: !0,
        isAvailable: !0
      }
    ], this._environmentA = "Local", this._environmentB = "", this._statusMessage = e instanceof Error ? e.message : "Could not load environments.";
  } finally {
    this._isLoadingEnvironments = !1;
  }
};
C = function(e) {
  const t = e.target;
  this._environmentA = t.value;
};
k = function(e) {
  const t = e.target;
  this._environmentB = t.value;
};
x = function(e) {
  const t = e.target;
  this._search = t.value;
};
A = function(e) {
  const t = e.target;
  this._statusFilter = t.value;
};
E = function() {
  const e = this._environmentA;
  this._environmentA = this._environmentB, this._environmentB = e;
};
L = function() {
  return (this._result?.items ?? []).filter((t) => {
    if ((t.moduleAlias ?? "content").toLowerCase() !== this._activeTab || this._statusFilter && u(t.status).toLowerCase() !== this._statusFilter.toLowerCase())
      return !1;
    if (this._search.trim()) {
      const i = this._search.trim().toLowerCase();
      if (![
        t.name,
        t.id,
        t.path ?? "",
        t.contentType ?? "",
        t.differenceSummary ?? ""
      ].join(" ").toLowerCase().includes(i))
        return !1;
    }
    return !0;
  });
};
S = async function() {
  if (!this._environmentA || !this._environmentB) {
    this._statusMessage = "Select both Environment A and Environment B.";
    return;
  }
  if (this._environmentA === this._environmentB) {
    this._statusMessage = "Environment A and B must be different.";
    return;
  }
  N(this, h)?.abort(), R(this, h, new AbortController()), this._isComparing = !0, this._progress = 20, this._selectedItem = null, this._statusMessage = `Comparing ${this._environmentA} → ${this._environmentB}…`;
  try {
    const e = await D({
      environmentA: this._environmentA,
      environmentB: this._environmentB,
      search: this._search || void 0,
      status: this._statusFilter || void 0
    });
    this._result = e, this._progress = 100, this._statusMessage = `Compared ${e.totalCompared} item(s).`;
  } catch (e) {
    this._progress = 0, this._statusMessage = e instanceof Error ? e.message : "Comparison failed.";
  } finally {
    this._isComparing = !1;
  }
};
g = function(e) {
  return (this._environments.length > 0 ? this._environments : [
    {
      name: "Local",
      displayName: "Local",
      isLocal: !0,
      isAvailable: !0
    }
  ]).map(
    (r) => c`
        <option value=${r.name} ?selected=${r.name === e}>
          ${r.displayName}${r.isAvailable ? "" : " (unavailable)"}
        </option>
      `
  );
};
p = function(e, t, r) {
  return c`
      <div class="summary-card" data-tone=${r}>
        <span class="summary-label">${e}</span>
        <span class="summary-value">${t}</span>
      </div>
    `;
};
m = function(e, t) {
  return c`
      <button
        type="button"
        class="tab ${this._activeTab === e ? "is-active" : ""}"
        @click=${() => {
    this._activeTab = e, this._selectedItem = null;
  }}
      >
        ${t}
      </button>
    `;
};
M = function() {
  const e = a(this, s, L).call(this);
  return this._result ? e.length === 0 ? c`
        <div class="empty">
          <p>No items match the current tab/filters.</p>
        </div>
      ` : c`
      <div class="result-list" role="list">
        ${e.map(
    (t) => c`
            <button
              type="button"
              class="result-row status-${u(t.status).toLowerCase()} ${this._selectedItem?.id === t.id ? "is-selected" : ""}"
              role="listitem"
              @click=${() => {
      this._selectedItem = t;
    }}
            >
              <span class="result-status">${u(t.status)}</span>
              <span class="result-name">${t.name}</span>
              <span class="result-meta"
                >${t.contentType ?? "—"} · ${t.path ?? t.id}</span
              >
            </button>
          `
  )}
      </div>
    ` : c`
        <div class="empty">
          <p>No comparison results yet.</p>
          <p class="hint">Select environments and click Compare.</p>
        </div>
      `;
};
B = function() {
  if (!this._selectedItem)
    return c`
        <div class="empty">
          <p>Select a result row to inspect differences.</p>
          <p class="hint">Git-style property highlighting arrives in Step 6.</p>
        </div>
      `;
  const e = this._selectedItem;
  return c`
      <div class="diff-details">
        <p><strong>${e.name}</strong></p>
        <p class="hint">${e.id}</p>
        <p><span class="badge">${u(e.status)}</span></p>
        <p>${e.differenceSummary ?? "—"}</p>
        <div class="diff-columns">
          <div>
            <h3>Environment A</h3>
            <pre>${e.environmentAValue ?? "(missing)"}</pre>
          </div>
          <div>
            <h3>Environment B</h3>
            <pre>${e.environmentBValue ?? "(missing)"}</pre>
          </div>
        </div>
      </div>
    `;
};
n.styles = [
  I`
      :host {
        display: block;
        color: var(--umb-color-text);
        --panel-bg: var(--uui-color-surface, #fff);
        --panel-border: var(--uui-color-border, #d8d7d9);
        --accent: var(--uui-color-interactive, #1b264f);
        --muted: var(--uui-color-text-alt, #6e6d70);
        --gap: 1rem;
        font-family: inherit;
      }

      .layout {
        display: flex;
        flex-direction: column;
        gap: var(--gap);
        padding: var(--uui-size-space-5, 1.25rem);
        min-height: 100%;
        box-sizing: border-box;
        background:
          radial-gradient(circle at top right, rgba(27, 38, 79, 0.06), transparent 40%),
          var(--uui-color-surface-alt, #f6f6f8);
      }

      .toolbar,
      .filters,
      .tree-panel,
      .diff-panel,
      .summary-card {
        background: var(--panel-bg);
        border: 1px solid var(--panel-border);
        border-radius: var(--uui-border-radius, 8px);
      }

      .toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 1.1rem 1.25rem;
        display: grid;
        gap: 1rem;
      }

      .brand h1 {
        margin: 0;
        font-size: 1.5rem;
        letter-spacing: -0.02em;
      }

      .brand p,
      .status,
      .hint {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.875rem;
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: end;
      }

      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.8rem;
        color: var(--muted);
      }

      select,
      input[type="search"] {
        min-width: 10rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--panel-border);
        border-radius: 6px;
        background: var(--uui-color-surface, #fff);
        color: inherit;
      }

      .progress-track {
        height: 0.45rem;
        border-radius: 999px;
        background: var(--uui-color-surface-alt, #ececec);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #1b264f, #3d7ea6);
        transition: width 240ms ease;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--gap);
      }

      .summary-card {
        padding: 0.9rem 1rem;
        display: grid;
        gap: 0.35rem;
        border-top: 3px solid transparent;
      }

      .summary-card[data-tone="modified"] {
        border-top-color: #c9892b;
      }
      .summary-card[data-tone="missing"] {
        border-top-color: #d64545;
      }
      .summary-card[data-tone="added"] {
        border-top-color: #2f9e44;
      }
      .summary-card[data-tone="identical"] {
        border-top-color: #3d7ea6;
      }
      .summary-card[data-tone="neutral"] {
        border-top-color: var(--accent);
      }

      .summary-label {
        color: var(--muted);
        font-size: 0.8rem;
      }

      .summary-value {
        font-size: 1.4rem;
        font-weight: 650;
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr) minmax(14rem, 20rem);
        gap: var(--gap);
        align-items: start;
        min-height: 28rem;
      }

      .filters,
      .diff-panel,
      .tree-panel {
        padding: 1rem;
        min-height: 24rem;
      }

      .filters {
        position: sticky;
        top: 7.5rem;
        display: grid;
        gap: 0.85rem;
        align-content: start;
      }

      .filters h2,
      .tree-panel h2,
      .diff-panel h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }

      .results {
        display: grid;
        gap: 0.75rem;
      }

      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .tab {
        border: 1px solid var(--panel-border);
        background: var(--panel-bg);
        border-radius: 999px;
        padding: 0.4rem 0.85rem;
        cursor: pointer;
        color: inherit;
      }

      .tab.is-active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
      }

      .empty {
        display: grid;
        place-content: center;
        text-align: center;
        min-height: 16rem;
        gap: 0.35rem;
        border: 1px dashed var(--panel-border);
        border-radius: 8px;
        padding: 1.5rem;
        color: var(--muted);
      }

      .result-list {
        display: grid;
        gap: 0.4rem;
        max-height: 28rem;
        overflow: auto;
      }

      .result-row {
        display: grid;
        grid-template-columns: 6.5rem 1fr;
        grid-template-rows: auto auto;
        gap: 0.15rem 0.75rem;
        text-align: left;
        border: 1px solid var(--panel-border);
        border-radius: 6px;
        background: transparent;
        color: inherit;
        padding: 0.55rem 0.7rem;
        cursor: pointer;
      }

      .result-row.is-selected {
        border-color: var(--accent);
        background: rgba(27, 38, 79, 0.06);
      }

      .result-status {
        grid-row: 1 / span 2;
        align-self: center;
        font-size: 0.75rem;
        font-weight: 650;
      }

      .result-row.status-added .result-status {
        color: #2f9e44;
      }
      .result-row.status-missing .result-status {
        color: #d64545;
      }
      .result-row.status-modified .result-status {
        color: #c9892b;
      }
      .result-row.status-identical .result-status {
        color: #3d7ea6;
      }
      .result-row.status-ignored .result-status {
        color: var(--muted);
      }

      .result-name {
        font-weight: 600;
      }

      .result-meta,
      .diff-details .hint {
        color: var(--muted);
        font-size: 0.8rem;
      }

      .diff-details {
        display: grid;
        gap: 0.65rem;
      }

      .diff-columns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .diff-columns h3 {
        margin: 0 0 0.35rem;
        font-size: 0.85rem;
      }

      .diff-columns pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 0.65rem;
        border-radius: 6px;
        border: 1px solid var(--panel-border);
        background: var(--uui-color-surface-alt, #f6f6f8);
        font-size: 0.8rem;
      }

      .badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: var(--accent);
        color: #fff;
        font-size: 0.75rem;
      }

      @media (max-width: 1100px) {
        .summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .workspace {
          grid-template-columns: 1fr;
        }

        .filters {
          position: static;
        }
      }

      @media (prefers-color-scheme: dark) {
        :host {
          --panel-bg: var(--uui-color-surface, #1f1f23);
          --panel-border: var(--uui-color-border, #3a3a40);
          --muted: var(--uui-color-text-alt, #b0afb3);
        }

        .layout {
          background:
            radial-gradient(circle at top right, rgba(61, 126, 166, 0.12), transparent 42%),
            var(--uui-color-surface-alt, #141418);
        }
      }
    `
];
o([
  l()
], n.prototype, "_environments", 2);
o([
  l()
], n.prototype, "_environmentA", 2);
o([
  l()
], n.prototype, "_environmentB", 2);
o([
  l()
], n.prototype, "_isComparing", 2);
o([
  l()
], n.prototype, "_isLoadingEnvironments", 2);
o([
  l()
], n.prototype, "_progress", 2);
o([
  l()
], n.prototype, "_statusMessage", 2);
o([
  l()
], n.prototype, "_activeTab", 2);
o([
  l()
], n.prototype, "_search", 2);
o([
  l()
], n.prototype, "_statusFilter", 2);
o([
  l()
], n.prototype, "_result", 2);
o([
  l()
], n.prototype, "_selectedItem", 2);
n = o([
  z("envcompare-dashboard")
], n);
const V = n;
export {
  n as EnvCompareDashboardElement,
  V as default
};
//# sourceMappingURL=envcompare-dashboard.element-BQ4BcX7T.js.map
