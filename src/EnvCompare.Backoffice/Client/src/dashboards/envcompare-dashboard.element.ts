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
import "../components/envcompare-diff-panel.element.js";
import {
  buildComparisonTree,
  collectFilterOptions,
  flattenTree,
  type TreeNode,
} from "../utils/comparison-tree.js";
import { getVirtualScrollRange } from "../utils/virtual-scroll.js";

type ResultTab = "content" | "media" | "settings" | "dictionary";
type ViewMode = "list" | "tree";

const ROW_HEIGHT = 52;
const TAB_MODULES: Record<ResultTab, string> = {
  content: "content",
  media: "media",
  settings: "settings",
  dictionary: "dictionary",
};

const STATUS_ICON: Record<string, string> = {
  Identical: "✔",
  Added: "＋",
  Missing: "−",
  Modified: "△",
  Ignored: "○",
};

/**
 * EnvCompare dashboard with virtual scrolling, tree view, git-style diffs, and rich filters.
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
  private _viewMode: ViewMode = "tree";

  @state()
  private _search = "";

  @state()
  private _statusFilter = "";

  @state()
  private _cultureFilter = "";

  @state()
  private _contentTypeFilter = "";

  @state()
  private _showIgnored = false;

  @state()
  private _result: ComparisonResult | null = null;

  @state()
  private _selectedItem: ComparisonItem | null = null;

  @state()
  private _expandedPaths = new Set<string>();

  @state()
  private _listScrollTop = 0;

  @state()
  private _listViewportHeight = 420;

  @state()
  private _diffPanelWidth = 22;

  @state()
  private _diffFullscreen = false;

  #compareAbort: AbortController | null = null;
  #resizeStartX = 0;
  #resizeStartWidth = 22;

  override connectedCallback() {
    super.connectedCallback();
    void this.#loadEnvironments();
    window.addEventListener("keydown", this.#onWindowKeydown);
  }

  override disconnectedCallback() {
    window.removeEventListener("keydown", this.#onWindowKeydown);
    super.disconnectedCallback();
  }

  #onWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this._diffFullscreen) {
      event.preventDefault();
      this._diffFullscreen = false;
    }
  };

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
    this._environmentA = (event.target as HTMLSelectElement).value;
  }

  #onEnvironmentB(event: Event) {
    this._environmentB = (event.target as HTMLSelectElement).value;
  }

  #onSearch(event: Event) {
    this._search = (event.target as HTMLInputElement).value;
    this._listScrollTop = 0;
  }

  #onStatusFilter(event: Event) {
    this._statusFilter = (event.target as HTMLSelectElement).value;
    this._listScrollTop = 0;
  }

  #onCultureFilter(event: Event) {
    this._cultureFilter = (event.target as HTMLSelectElement).value;
    this._listScrollTop = 0;
  }

  #onContentTypeFilter(event: Event) {
    this._contentTypeFilter = (event.target as HTMLSelectElement).value;
    this._listScrollTop = 0;
  }

  #onShowIgnored(event: Event) {
    this._showIgnored = (event.target as HTMLInputElement).checked;
    this._listScrollTop = 0;
  }

  #swapEnvironments() {
    const previousA = this._environmentA;
    this._environmentA = this._environmentB;
    this._environmentB = previousA;
  }

  #matchesFilters(item: ComparisonItem): boolean {
    const status = statusLabel(item.status);

    if (!this._showIgnored && status === "Ignored") {
      return false;
    }

    if (this._statusFilter && status.toLowerCase() !== this._statusFilter.toLowerCase()) {
      return false;
    }

    if (this._cultureFilter && item.culture?.toLowerCase() !== this._cultureFilter.toLowerCase()) {
      return false;
    }

    if (
      this._contentTypeFilter &&
      item.contentType?.toLowerCase() !== this._contentTypeFilter.toLowerCase()
    ) {
      return false;
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
  }

  #visibleItems(): ComparisonItem[] {
    const items = this._result?.items ?? [];
    return items.filter((item) => {
      const module = (item.moduleAlias ?? "content").toLowerCase();
      return module === TAB_MODULES[this._activeTab] && this.#matchesFilters(item);
    });
  }

  #tabCount(tab: ResultTab): number {
    const items = this._result?.items ?? [];
    return items.filter((item) => {
      const module = (item.moduleAlias ?? "content").toLowerCase();
      return module === TAB_MODULES[tab] && this.#matchesFilters(item);
    }).length;
  }

  #filterOptions() {
    const tabItems = (this._result?.items ?? []).filter(
      (item) => (item.moduleAlias ?? "content").toLowerCase() === TAB_MODULES[this._activeTab],
    );
    return collectFilterOptions(tabItems);
  }

  #expandAll() {
    const items = this.#visibleItems();
    const tree = buildComparisonTree(items);
    const paths = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          paths.add(node.path);
          walk(node.children);
        }
      }
    };
    walk(tree);
    this._expandedPaths = paths;
  }

  #collapseAll() {
    this._expandedPaths = new Set();
  }

  #toggleExpand(path: string, event: Event) {
    event.stopPropagation();
    const next = new Set(this._expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    this._expandedPaths = next;
  }

  #selectItem(item: ComparisonItem) {
    this._selectedItem = item;
  }

  #onListScroll(event: Event) {
    const target = event.target as HTMLElement;
    this._listScrollTop = target.scrollTop;
    this._listViewportHeight = target.clientHeight;
  }

  #onResizeStart(event: PointerEvent) {
    event.preventDefault();
    this.#resizeStartX = event.clientX;
    this.#resizeStartWidth = this._diffPanelWidth;

    const onMove = (moveEvent: PointerEvent) => {
      const delta = this.#resizeStartX - moveEvent.clientX;
      const next = Math.min(40, Math.max(14, this.#resizeStartWidth + delta / 16));
      this._diffPanelWidth = next;
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
    this._progress = 15;
    this._selectedItem = null;
    this._diffFullscreen = false;
    this._listScrollTop = 0;
    this._statusMessage = `Comparing ${this._environmentA} → ${this._environmentB}…`;

    const progressTimer = window.setInterval(() => {
      if (this._progress < 85) {
        this._progress += 5;
      }
    }, 200);

    try {
      const result = await runComparison({
        environmentA: this._environmentA,
        environmentB: this._environmentB,
      });

      this._result = result;
      this._progress = 100;
      this._statusMessage = `Compared ${result.totalCompared} item(s).`;
      this.#expandAll();
    } catch (error) {
      this._progress = 0;
      this._statusMessage =
        error instanceof Error ? error.message : "Comparison failed.";
    } finally {
      window.clearInterval(progressTimer);
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
    const count = this._result ? this.#tabCount(id) : null;
    return html`
      <button
        type="button"
        class="tab ${this._activeTab === id ? "is-active" : ""}"
        @click=${() => {
          this._activeTab = id;
          this._selectedItem = null;
          this._listScrollTop = 0;
        }}
      >
        ${label}${count !== null ? html` <span class="tab-count">${count}</span>` : ""}
      </button>
    `;
  }

  #renderResultRow(item: ComparisonItem, indent = 0) {
    const status = statusLabel(item.status);
    const icon = STATUS_ICON[status] ?? "•";

    return html`
      <button
        type="button"
        class="result-row status-${status.toLowerCase()} ${this._selectedItem?.id === item.id
          ? "is-selected"
          : ""}"
        style=${`--indent:${indent}`}
        @click=${() => this.#selectItem(item)}
      >
        <span class="result-icon" aria-hidden="true">${icon}</span>
        <span class="result-status">${status}</span>
        <span class="result-name">${item.name}</span>
        <span class="result-meta"
          >${item.contentType ?? "—"} · ${item.path ?? item.id}</span
        >
      </button>
    `;
  }

  #renderTreeNode(node: TreeNode, depth: number) {
    const expanded = this._expandedPaths.has(node.path);
    const item = node.item;

    if (item) {
      return this.#renderResultRow(item, depth);
    }

    return html`
      <button
        type="button"
        class="tree-folder"
        style=${`--indent:${depth}`}
        @click=${(e: Event) => this.#toggleExpand(node.path, e)}
      >
        <span class="tree-chevron ${expanded ? "is-open" : ""}" aria-hidden="true">›</span>
        <span class="tree-folder-label">${node.label}</span>
        <span class="tree-folder-meta">${node.children.length} children</span>
      </button>
    `;
  }

  #renderVirtualList(items: ComparisonItem[]) {
    const range = getVirtualScrollRange(
      this._listScrollTop,
      this._listViewportHeight,
      items.length,
      ROW_HEIGHT,
    );

    const slice = items.slice(range.start, range.end);

    return html`
      <div
        class="virtual-scroll"
        @scroll=${this.#onListScroll}
        role="list"
      >
        <div class="virtual-spacer" style="height:${range.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${range.offsetTop}px)">
            ${slice.map((item) => this.#renderResultRow(item))}
          </div>
        </div>
      </div>
    `;
  }

  #renderTreeList(items: ComparisonItem[]) {
    const tree = buildComparisonTree(items);
    const flat = flattenTree(tree, this._expandedPaths);

    if (flat.length === 0) {
      return html`<div class="empty"><p>No items to display.</p></div>`;
    }

    const range = getVirtualScrollRange(
      this._listScrollTop,
      this._listViewportHeight,
      flat.length,
      ROW_HEIGHT,
    );

    const slice = flat.slice(range.start, range.end);

    return html`
      <div class="virtual-scroll" @scroll=${this.#onListScroll} role="tree">
        <div class="virtual-spacer" style="height:${range.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${range.offsetTop}px)">
            ${slice.map(({ node, depth }) => this.#renderTreeNode(node, depth))}
          </div>
        </div>
      </div>
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

    return this._viewMode === "tree"
      ? this.#renderTreeList(items)
      : this.#renderVirtualList(items);
  }

  #renderFilters() {
    const options = this.#filterOptions();

    return html`
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

        <label>
          <span>Culture</span>
          <select .value=${this._cultureFilter} @change=${this.#onCultureFilter}>
            <option value="">All cultures</option>
            ${options.cultures.map(
              (c) => html`<option value=${c}>${c}</option>`,
            )}
          </select>
        </label>

        <label>
          <span>Content type</span>
          <select .value=${this._contentTypeFilter} @change=${this.#onContentTypeFilter}>
            <option value="">All types</option>
            ${options.contentTypes.map(
              (t) => html`<option value=${t}>${t}</option>`,
            )}
          </select>
        </label>

        <label class="checkbox-row">
          <input
            type="checkbox"
            .checked=${this._showIgnored}
            @change=${this.#onShowIgnored}
          />
          <span>Show ignored items</span>
        </label>

        <p class="hint">
          Filters apply instantly on the result grid. New document types appear
          under <strong>Settings</strong> with status <strong>Missing</strong>
          when they exist only in Environment A (e.g. Local).
        </p>
      </aside>
    `;
  }

  #openDiffFullscreen() {
    if (!this._selectedItem) {
      return;
    }
    this._diffFullscreen = true;
  }

  #closeDiffFullscreen() {
    this._diffFullscreen = false;
  }

  #renderDiffPanel(fullscreen = false) {
    return html`
      <envcompare-diff-panel
        .item=${this._selectedItem}
        .environmentA=${this._environmentA}
        .environmentB=${this._environmentB}
        ?fullscreen=${fullscreen}
      ></envcompare-diff-panel>
    `;
  }

  override render() {
    const visibleCount = this.#visibleItems().length;

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
              ${this._isComparing ? "Comparing…" : "Compare"}
            </uui-button>
          </div>

          <div class="progress-block">
            <div class="progress-track" aria-hidden="true">
              <div
                class="progress-fill ${this._isComparing ? "is-active" : ""}"
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

        <div
          class="workspace"
          style="--diff-width:${this._diffPanelWidth}rem"
        >
          ${this.#renderFilters()}

          <main class="results">
            <nav class="tabs" aria-label="Result categories">
              ${this.#renderTab("content", "Content")}
              ${this.#renderTab("media", "Media")}
              ${this.#renderTab("settings", "Settings")}
              ${this.#renderTab("dictionary", "Dictionary")}
            </nav>

            <div class="tree-panel ${this._isComparing ? "is-loading" : ""}">
              <div class="tree-toolbar">
                <h2>${this._activeTab}</h2>
                <span class="result-count">${visibleCount} visible</span>
                <div class="view-toggle" role="group" aria-label="View mode">
                  <button
                    type="button"
                    class="view-btn ${this._viewMode === "tree" ? "is-active" : ""}"
                    @click=${() => {
                      this._viewMode = "tree";
                      this._listScrollTop = 0;
                    }}
                  >
                    Tree
                  </button>
                  <button
                    type="button"
                    class="view-btn ${this._viewMode === "list" ? "is-active" : ""}"
                    @click=${() => {
                      this._viewMode = "list";
                      this._listScrollTop = 0;
                    }}
                  >
                    List
                  </button>
                </div>
                ${this._viewMode === "tree"
                  ? html`
                      <button type="button" class="link-btn" @click=${this.#expandAll}>
                        Expand all
                      </button>
                      <button type="button" class="link-btn" @click=${this.#collapseAll}>
                        Collapse all
                      </button>
                    `
                  : ""}
              </div>

              ${this._isComparing
                ? html`
                    <div class="loading-overlay" aria-live="polite">
                      <div class="spinner" aria-hidden="true"></div>
                      <p>Running comparison…</p>
                    </div>
                  `
                : ""}

              ${this.#renderResults()}
            </div>
          </main>

          <div
            class="splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize diff panel"
            @pointerdown=${this.#onResizeStart}
          ></div>

          <aside class="diff-panel" aria-label="Property differences">
            <div class="diff-panel-header">
              <h2>Differences</h2>
              <button
                type="button"
                class="icon-btn"
                title="Open fullscreen"
                aria-label="Open differences in fullscreen"
                ?disabled=${!this._selectedItem}
                @click=${this.#openDiffFullscreen}
              >
                ⛶
              </button>
            </div>
            ${this.#renderDiffPanel()}
          </aside>
        </div>

        ${this._diffFullscreen
          ? html`
              <div
                class="diff-fullscreen"
                role="dialog"
                aria-modal="true"
                aria-label="Differences fullscreen"
              >
                <header class="diff-fullscreen-header">
                  <div>
                    <h2>Differences</h2>
                    <p class="hint">${this._selectedItem?.name ?? ""}</p>
                  </div>
                  <button
                    type="button"
                    class="close-btn"
                    aria-label="Close fullscreen"
                    @click=${this.#closeDiffFullscreen}
                  >
                    Close
                  </button>
                </header>
                <div class="diff-fullscreen-body">
                  ${this.#renderDiffPanel(true)}
                </div>
              </div>
            `
          : ""}
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
        z-index: 3;
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

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .checkbox-row input {
        width: auto;
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

      .progress-fill.is-active {
        background: linear-gradient(
          90deg,
          #1b264f,
          #3d7ea6,
          #1b264f
        );
        background-size: 200% 100%;
        animation: shimmer 1.2s linear infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
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
        grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr) 4px var(--diff-width, 22rem);
        gap: 0 var(--gap);
        align-items: stretch;
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
        max-height: calc(100vh - 9rem);
        overflow: auto;
      }

      .filters h2,
      .diff-panel h2,
      .diff-fullscreen-header h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
      }

      .diff-panel-header,
      .diff-fullscreen-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .diff-panel-header h2,
      .diff-fullscreen-header h2 {
        margin: 0;
      }

      .icon-btn,
      .close-btn {
        border: 1px solid var(--panel-border);
        background: var(--panel-bg);
        color: inherit;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.35rem 0.65rem;
        line-height: 1;
        flex-shrink: 0;
      }

      .icon-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .icon-btn:not(:disabled):hover,
      .close-btn:hover {
        border-color: var(--accent);
        background: rgba(27, 38, 79, 0.05);
      }

      .diff-fullscreen {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: grid;
        grid-template-rows: auto 1fr;
        background: var(--uui-color-surface-alt, #f6f6f8);
        padding: 1rem 1.25rem 1.25rem;
        box-sizing: border-box;
      }

      .diff-fullscreen-header {
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--panel-border);
        margin-bottom: 0.75rem;
      }

      .diff-fullscreen-header .hint {
        margin: 0.15rem 0 0;
      }

      .diff-fullscreen-body {
        min-height: 0;
        overflow: auto;
        background: var(--panel-bg);
        border: 1px solid var(--panel-border);
        border-radius: var(--uui-border-radius, 8px);
        padding: 1rem;
      }

      .splitter {
        cursor: col-resize;
        background: transparent;
        border-radius: 4px;
        align-self: stretch;
        touch-action: none;
      }

      .splitter:hover,
      .splitter:active {
        background: rgba(27, 38, 79, 0.12);
      }

      .results {
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 0.75rem;
        min-width: 0;
        align-content: start;
      }

      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        align-items: center;
        align-self: start;
        flex-shrink: 0;
      }

      .tab {
        border: 1px solid var(--panel-border);
        background: var(--panel-bg);
        border-radius: 999px;
        padding: 0.3rem 0.7rem;
        cursor: pointer;
        color: inherit;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        flex: 0 0 auto;
        width: auto;
        height: auto;
        min-height: 0;
        font-size: 0.8125rem;
        line-height: 1.25;
        font-family: inherit;
      }

      .tab.is-active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
      }

      .tab-count {
        font-size: 0.72rem;
        opacity: 0.85;
        padding: 0.05rem 0.35rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
      }

      .tab:not(.is-active) .tab-count {
        background: var(--uui-color-surface-alt, #ececec);
        color: var(--muted);
      }

      .tree-panel {
        position: relative;
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 0.65rem;
        min-height: 26rem;
        align-self: stretch;
      }

      .tree-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 0.75rem;
        flex-shrink: 0;
      }

      .tree-toolbar h2 {
        margin: 0;
        font-size: 1rem;
      }

      .result-count {
        font-size: 0.8rem;
        color: var(--muted);
      }

      .view-toggle {
        display: inline-flex;
        border: 1px solid var(--panel-border);
        border-radius: 6px;
        overflow: hidden;
        margin-left: auto;
      }

      .view-btn,
      .link-btn {
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.3rem 0.6rem;
        line-height: 1.25;
        height: auto;
        min-height: 0;
        font-family: inherit;
      }

      .view-btn.is-active {
        background: var(--accent);
        color: #fff;
      }

      .link-btn {
        color: var(--accent);
        text-decoration: underline;
        padding: 0.2rem 0.35rem;
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

      .virtual-scroll {
        overflow: auto;
        max-height: 28rem;
        min-height: 16rem;
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        background: var(--uui-color-surface-alt, #fafafa);
      }

      .virtual-spacer {
        position: relative;
        width: 100%;
      }

      .virtual-window {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        display: grid;
        gap: 0.35rem;
        padding: 0.35rem;
      }

      .result-row,
      .tree-folder {
        display: grid;
        grid-template-columns: 1.5rem 5.5rem 1fr;
        grid-template-rows: auto auto;
        gap: 0.15rem 0.5rem;
        text-align: left;
        border: 1px solid var(--panel-border);
        border-radius: 6px;
        background: var(--panel-bg);
        color: inherit;
        padding: 0.5rem 0.65rem 0.5rem calc(0.65rem + var(--indent, 0) * 1rem);
        cursor: pointer;
        min-height: 44px;
        box-sizing: border-box;
      }

      .result-row.is-selected,
      .tree-folder:hover,
      .result-row:hover {
        border-color: var(--accent);
        background: rgba(27, 38, 79, 0.05);
      }

      .result-icon {
        grid-row: 1 / span 2;
        align-self: center;
        font-size: 0.9rem;
      }

      .result-status {
        font-size: 0.72rem;
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
        grid-column: 3;
      }

      .result-meta,
      .tree-folder-meta {
        color: var(--muted);
        font-size: 0.78rem;
        grid-column: 3;
      }

      .tree-folder {
        grid-template-columns: 1rem 1fr auto;
        grid-template-rows: auto;
        align-items: center;
      }

      .tree-chevron {
        display: inline-block;
        transition: transform 120ms ease;
        color: var(--muted);
      }

      .tree-chevron.is-open {
        transform: rotate(90deg);
      }

      .tree-folder-label {
        font-weight: 600;
      }

      .loading-overlay {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: grid;
        place-content: center;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.72);
        border-radius: inherit;
        text-align: center;
        color: var(--muted);
      }

      .spinner {
        width: 2rem;
        height: 2rem;
        margin: 0 auto;
        border: 3px solid var(--panel-border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1100px) {
        .summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .workspace {
          grid-template-columns: 1fr;
        }

        .splitter {
          display: none;
        }

        .filters {
          position: static;
          max-height: none;
        }

        .view-toggle {
          margin-left: 0;
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

        .loading-overlay {
          background: rgba(20, 20, 24, 0.78);
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
