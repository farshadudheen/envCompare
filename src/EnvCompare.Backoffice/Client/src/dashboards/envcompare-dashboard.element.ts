import {
  css,
  html,
  customElement,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  fetchEnvironments,
  type EnvironmentInfo,
} from "../api/environments-api.js";
import {
  runComparison,
  statusLabel,
  type ComparisonItem,
  type ComparisonResult,
} from "../api/compare-api.js";

type ResultTab = "content" | "media" | "settings" | "dictionary";

/**
 * EnvCompare dashboard: environments + comparison engine results.
 */
@customElement("envcompare-dashboard")
export class EnvCompareDashboardElement extends UmbLitElement {
  @state()
  private _environments: EnvironmentInfo[] = [];

  @state()
  private _environmentA = "Local";

  @state()
  private _environmentB = "";

  @state()
  private _isComparing = false;

  @state()
  private _isLoadingEnvironments = true;

  @state()
  private _progress = 0;

  @state()
  private _statusMessage = "Loading environments…";

  @state()
  private _activeTab: ResultTab = "content";

  @state()
  private _search = "";

  @state()
  private _statusFilter = "";

  @state()
  private _result: ComparisonResult | null = null;

  @state()
  private _selectedItem: ComparisonItem | null = null;

  #compareAbort: AbortController | null = null;

  override connectedCallback() {
    super.connectedCallback();
    void this.#loadEnvironments();
  }

  async #loadEnvironments() {
    this._isLoadingEnvironments = true;
    try {
      const environments = await fetchEnvironments();
      this._environments = environments;

      const local = environments.find((e) => e.isLocal)?.name ?? "Local";
      const remote =
        environments.find((e) => !e.isLocal)?.name ??
        environments.find((e) => e.name !== local)?.name ??
        "";

      this._environmentA = local;
      this._environmentB = remote;
      this._statusMessage =
        environments.length > 1
          ? "Select two environments, then compare."
          : "Only Local is available. Configure remote ApiUrl values in appsettings.";
    } catch (error) {
      this._environments = [
        {
          name: "Local",
          displayName: "Local",
          isLocal: true,
          isAvailable: true,
        },
      ];
      this._environmentA = "Local";
      this._environmentB = "";
      this._statusMessage =
        error instanceof Error
          ? error.message
          : "Could not load environments.";
    } finally {
      this._isLoadingEnvironments = false;
    }
  }

  #onEnvironmentA(event: Event) {
    const select = event.target as HTMLSelectElement;
    this._environmentA = select.value;
  }

  #onEnvironmentB(event: Event) {
    const select = event.target as HTMLSelectElement;
    this._environmentB = select.value;
  }

  #onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this._search = input.value;
  }

  #onStatusFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    this._statusFilter = select.value;
  }

  #swapEnvironments() {
    const previousA = this._environmentA;
    this._environmentA = this._environmentB;
    this._environmentB = previousA;
  }

  #visibleItems(): ComparisonItem[] {
    const items = this._result?.items ?? [];
    return items.filter((item) => {
      const module = (item.moduleAlias ?? "content").toLowerCase();
      if (module !== this._activeTab) {
        return false;
      }

      if (this._statusFilter) {
        const label = statusLabel(item.status);
        if (label.toLowerCase() !== this._statusFilter.toLowerCase()) {
          return false;
        }
      }

      if (this._search.trim()) {
        const term = this._search.trim().toLowerCase();
        const haystack = [
          item.name,
          item.id,
          item.path ?? "",
          item.contentType ?? "",
          item.differenceSummary ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }

  async #onCompare() {
    if (!this._environmentA || !this._environmentB) {
      this._statusMessage = "Select both Environment A and Environment B.";
      return;
    }

    if (this._environmentA === this._environmentB) {
      this._statusMessage = "Environment A and B must be different.";
      return;
    }

    this.#compareAbort?.abort();
    this.#compareAbort = new AbortController();

    this._isComparing = true;
    this._progress = 20;
    this._selectedItem = null;
    this._statusMessage = `Comparing ${this._environmentA} → ${this._environmentB}…`;

    try {
      const result = await runComparison({
        environmentA: this._environmentA,
        environmentB: this._environmentB,
        search: this._search || undefined,
        status: this._statusFilter || undefined,
      });

      this._result = result;
      this._progress = 100;
      this._statusMessage = `Compared ${result.totalCompared} item(s).`;
    } catch (error) {
      this._progress = 0;
      this._statusMessage =
        error instanceof Error ? error.message : "Comparison failed.";
    } finally {
      this._isComparing = false;
    }
  }

  #renderEnvironmentOptions(selected: string) {
    const source =
      this._environments.length > 0
        ? this._environments
        : [
            {
              name: "Local",
              displayName: "Local",
              isLocal: true,
              isAvailable: true,
            } satisfies EnvironmentInfo,
          ];

    return source.map(
      (env) => html`
        <option value=${env.name} ?selected=${env.name === selected}>
          ${env.displayName}${env.isAvailable ? "" : " (unavailable)"}
        </option>
      `,
    );
  }

  #renderSummaryCard(label: string, value: string, tone: string) {
    return html`
      <div class="summary-card" data-tone=${tone}>
        <span class="summary-label">${label}</span>
        <span class="summary-value">${value}</span>
      </div>
    `;
  }

  #renderTab(id: ResultTab, label: string) {
    return html`
      <button
        type="button"
        class="tab ${this._activeTab === id ? "is-active" : ""}"
        @click=${() => {
          this._activeTab = id;
          this._selectedItem = null;
        }}
      >
        ${label}
      </button>
    `;
  }

  #renderResults() {
    const items = this.#visibleItems();
    if (!this._result) {
      return html`
        <div class="empty">
          <p>No comparison results yet.</p>
          <p class="hint">Select environments and click Compare.</p>
        </div>
      `;
    }

    if (items.length === 0) {
      return html`
        <div class="empty">
          <p>No items match the current tab/filters.</p>
        </div>
      `;
    }

    return html`
      <div class="result-list" role="list">
        ${items.map(
          (item) => html`
            <button
              type="button"
              class="result-row status-${statusLabel(item.status).toLowerCase()} ${this
                ._selectedItem?.id === item.id
                ? "is-selected"
                : ""}"
              role="listitem"
              @click=${() => {
                this._selectedItem = item;
              }}
            >
              <span class="result-status">${statusLabel(item.status)}</span>
              <span class="result-name">${item.name}</span>
              <span class="result-meta"
                >${item.contentType ?? "—"} · ${item.path ?? item.id}</span
              >
            </button>
          `,
        )}
      </div>
    `;
  }

  #renderDiffPanel() {
    if (!this._selectedItem) {
      return html`
        <div class="empty">
          <p>Select a result row to inspect differences.</p>
          <p class="hint">Git-style property highlighting arrives in Step 6.</p>
        </div>
      `;
    }

    const item = this._selectedItem;
    return html`
      <div class="diff-details">
        <p><strong>${item.name}</strong></p>
        <p class="hint">${item.id}</p>
        <p><span class="badge">${statusLabel(item.status)}</span></p>
        <p>${item.differenceSummary ?? "—"}</p>
        <div class="diff-columns">
          <div>
            <h3>Environment A</h3>
            <pre>${item.environmentAValue ?? "(missing)"}</pre>
          </div>
          <div>
            <h3>Environment B</h3>
            <pre>${item.environmentBValue ?? "(missing)"}</pre>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
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
                @change=${this.#onEnvironmentA}
              >
                ${this.#renderEnvironmentOptions(this._environmentA)}
              </select>
            </label>

            <uui-button
              look="secondary"
              label="Swap environments"
              compact
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${this.#swapEnvironments}
            >
              ⇄
            </uui-button>

            <label>
              <span>Environment B</span>
              <select
                .value=${this._environmentB}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${this.#onEnvironmentB}
              >
                ${this.#renderEnvironmentOptions(this._environmentB)}
              </select>
            </label>

            <uui-button
              look="primary"
              color="positive"
              label="Compare"
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${this.#onCompare}
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
          ${this.#renderSummaryCard(
            "Total Compared",
            this._result ? String(this._result.totalCompared) : "—",
            "neutral",
          )}
          ${this.#renderSummaryCard(
            "Modified",
            this._result ? String(this._result.modifiedCount) : "—",
            "modified",
          )}
          ${this.#renderSummaryCard(
            "Missing",
            this._result ? String(this._result.missingCount) : "—",
            "missing",
          )}
          ${this.#renderSummaryCard(
            "Added",
            this._result ? String(this._result.addedCount) : "—",
            "added",
          )}
          ${this.#renderSummaryCard(
            "Identical",
            this._result ? String(this._result.identicalCount) : "—",
            "identical",
          )}
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
                @input=${this.#onSearch}
              />
            </label>
            <label>
              <span>Status</span>
              <select .value=${this._statusFilter} @change=${this.#onStatusFilter}>
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
              ${this.#renderTab("content", "Content")}
              ${this.#renderTab("media", "Media")}
              ${this.#renderTab("settings", "Settings")}
              ${this.#renderTab("dictionary", "Dictionary")}
            </nav>

            <div class="tree-panel">
              <h2>${this._activeTab}</h2>
              ${this.#renderResults()}
            </div>
          </main>

          <aside class="diff-panel" aria-label="Property differences">
            <h2>Differences</h2>
            ${this.#renderDiffPanel()}
          </aside>
        </div>
      </div>
    `;
  }

  static override readonly styles = [
    css`
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
    `,
  ];
}

export default EnvCompareDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "envcompare-dashboard": EnvCompareDashboardElement;
  }
}
