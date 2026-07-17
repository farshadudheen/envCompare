import { css as K, property as M, customElement as Y, html as u, state as f } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as J } from "@umbraco-cms/backoffice/lit-element";
import { umbHttpClient as Q } from "@umbraco-cms/backoffice/http-client";
const Z = [
  { type: "http", scheme: "bearer" }
];
async function Le() {
  const { data: e, error: t, response: r } = await Q.get({
    url: "/umbraco/management/api/v1/envcompare/environments",
    security: Z
  });
  if (t || !r.ok)
    throw new Error(
      `Failed to load environments (${r?.status ?? "unknown"}).`
    );
  const i = e;
  return Array.isArray(i) ? i : [];
}
async function Me(e) {
  const { data: t, error: r, response: i } = await Q.post({
    url: "/umbraco/management/api/v1/envcompare/compare",
    security: Z,
    body: e,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (r || !i.ok) {
    const n = typeof r == "string" ? r : `Comparison failed (${i?.status ?? "unknown"}).`;
    throw new Error(n);
  }
  return t;
}
function F(e) {
  return typeof e == "number" ? ["Identical", "Added", "Missing", "Modified", "Ignored"][e] ?? String(e) : e;
}
function j(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function Fe(e, t) {
  const r = G(e), i = G(t), n = ee(r, i);
  return Pe(r, i, n);
}
function ze(e, t) {
  const r = e ?? "", i = t ?? "";
  if (r === i)
    return {
      left: { parts: [{ text: r, type: "same" }] },
      right: { parts: [{ text: i, type: "same" }] }
    };
  if (!r && i)
    return {
      left: { parts: [] },
      right: { parts: [{ text: i, type: "added" }] }
    };
  if (r && !i)
    return {
      left: { parts: [{ text: r, type: "removed" }] },
      right: { parts: [] }
    };
  const n = r.split(`
`), a = i.split(`
`);
  if (n.length === 1 && a.length === 1)
    return Fe(r, i);
  const l = ee(n, a), d = [], p = [];
  let c = 0, g = 0;
  for (const b of l) {
    for (; c < n.length && n[c] !== b; )
      d.push({ text: `${n[c]}
`, type: "removed" }), c++;
    for (; g < a.length && a[g] !== b; )
      p.push({ text: `${a[g]}
`, type: "added" }), g++;
    c < n.length && g < a.length && (d.push({ text: `${b}
`, type: "same" }), p.push({ text: `${b}
`, type: "same" }), c++, g++);
  }
  for (; c < n.length; )
    d.push({ text: `${n[c]}
`, type: "removed" }), c++;
  for (; g < a.length; )
    p.push({ text: `${a[g]}
`, type: "added" }), g++;
  return {
    left: { parts: A(d) },
    right: { parts: A(p) }
  };
}
function G(e) {
  const t = [], r = /(\s+|[^\s]+)/g;
  let i;
  for (; (i = r.exec(e)) !== null; )
    t.push(i[0]);
  return t.length > 0 ? t : [e];
}
function ee(e, t) {
  const r = e.length + 1, i = t.length + 1, n = Array.from({ length: r }, () => Array(i).fill(0));
  for (let p = 1; p < r; p++)
    for (let c = 1; c < i; c++)
      e[p - 1] === t[c - 1] ? n[p][c] = n[p - 1][c - 1] + 1 : n[p][c] = Math.max(n[p - 1][c], n[p][c - 1]);
  const a = [];
  let l = e.length, d = t.length;
  for (; l > 0 && d > 0; )
    e[l - 1] === t[d - 1] ? (a.unshift(e[l - 1]), l--, d--) : n[l - 1][d] >= n[l][d - 1] ? l-- : d--;
  return a;
}
function Pe(e, t, r) {
  const i = [], n = [];
  let a = 0, l = 0;
  for (const d of r) {
    for (; a < e.length && e[a] !== d; )
      i.push({ text: e[a], type: "removed" }), a++;
    for (; l < t.length && t[l] !== d; )
      n.push({ text: t[l], type: "added" }), l++;
    a < e.length && l < t.length && (i.push({ text: d, type: "same" }), n.push({ text: d, type: "same" }), a++, l++);
  }
  for (; a < e.length; )
    i.push({ text: e[a], type: "removed" }), a++;
  for (; l < t.length; )
    n.push({ text: t[l], type: "added" }), l++;
  return {
    left: { parts: A(i) },
    right: { parts: A(n) }
  };
}
function A(e) {
  if (e.length === 0)
    return e;
  const t = [{ ...e[0] }];
  for (let r = 1; r < e.length; r++) {
    const i = e[r], n = t[t.length - 1];
    n.type === i.type ? n.text += i.text : t.push({ ...i });
  }
  return t;
}
var Be = Object.defineProperty, Ie = Object.getOwnPropertyDescriptor, te = (e) => {
  throw TypeError(e);
}, k = (e, t, r, i) => {
  for (var n = i > 1 ? void 0 : i ? Ie(t, r) : t, a = e.length - 1, l; a >= 0; a--)
    (l = e[a]) && (n = (i ? l(t, r, n) : l(n)) || n);
  return i && n && Be(t, r, n), n;
}, De = (e, t, r) => t.has(e) || te("Cannot " + r), Oe = (e, t, r) => t.has(e) ? te("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), X = (e, t, r) => (De(e, t, "access private method"), r), C, B;
let _ = class extends J {
  constructor() {
    super(...arguments), Oe(this, C), this.item = null, this.environmentA = "Environment A", this.environmentB = "Environment B", this.fullscreen = !1;
  }
  render() {
    if (!this.item)
      return u`
        <div class="empty">
          <p>Select a result row to inspect differences.</p>
          <p class="hint">Changed text is highlighted like a Git diff.</p>
        </div>
      `;
    const e = this.item, t = F(e.status);
    return u`
      <div class="diff-details">
        <header class="diff-header">
          <div>
            <p class="diff-title">${e.name}</p>
            <p class="hint">${e.id}</p>
          </div>
          <span class="badge status-${t.toLowerCase()}">${t}</span>
        </header>

        <dl class="meta-grid">
          <div>
            <dt>Type</dt>
            <dd>${e.contentType ?? "—"}</dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>${e.path ?? "—"}</dd>
          </div>
          <div>
            <dt>Culture</dt>
            <dd>${e.culture ?? "—"}</dd>
          </div>
          <div>
            <dt>Summary</dt>
            <dd>${e.differenceSummary ?? "—"}</dd>
          </div>
        </dl>

        <div class="diff-columns">
          ${X(this, C, B).call(this, "Environment A", e.environmentAValue, "left", e.environmentBValue)}
          ${X(this, C, B).call(this, "Environment B", e.environmentBValue, "right", e.environmentAValue)}
        </div>
      </div>
    `;
  }
};
C = /* @__PURE__ */ new WeakSet();
B = function(e, t, r, i) {
  const n = ze(
    r === "left" ? t : i,
    r === "left" ? i : t
  ), a = r === "left" ? n.left.parts : n.right.parts, l = t ?? "(missing)";
  return u`
      <section class="diff-side" aria-label=${e}>
        <header class="diff-side-header">
          <h3>${e}</h3>
          <span class="env-tag">${r === "left" ? this.environmentA : this.environmentB}</span>
        </header>
        <pre class="diff-pre">
          ${a.length > 0 ? a.map(
    (d) => u`
                  <span class="diff-${d.type}">${j(d.text)}</span>
                `
  ) : u`<span class="diff-empty">${j(l)}</span>`}
        </pre>
      </section>
    `;
};
_.styles = [
  K`
      :host {
        display: block;
        color: var(--umb-color-text);
        --muted: var(--uui-color-text-alt, #6e6d70);
        --panel-border: var(--uui-color-border, #d8d7d9);
      }

      .empty {
        display: grid;
        place-content: center;
        text-align: center;
        min-height: 14rem;
        gap: 0.35rem;
        border: 1px dashed var(--panel-border);
        border-radius: 8px;
        padding: 1.5rem;
        color: var(--muted);
      }

      .hint {
        margin: 0.25rem 0 0;
        color: var(--muted);
        font-size: 0.8rem;
      }

      .diff-details {
        display: grid;
        gap: 0.85rem;
      }

      .diff-header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: start;
      }

      .diff-title {
        margin: 0;
        font-weight: 650;
        font-size: 1rem;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem 1rem;
        margin: 0;
      }

      .meta-grid dt {
        margin: 0;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }

      .meta-grid dd {
        margin: 0.15rem 0 0;
        font-size: 0.85rem;
        word-break: break-word;
      }

      .diff-columns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      @media (min-width: 900px) {
        .diff-columns {
          grid-template-columns: 1fr 1fr;
        }
      }

      .diff-side {
        display: grid;
        gap: 0.35rem;
        min-width: 0;
      }

      .diff-side-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .diff-side-header h3 {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 650;
      }

      .env-tag {
        font-size: 0.7rem;
        color: var(--muted);
        padding: 0.1rem 0.45rem;
        border: 1px solid var(--panel-border);
        border-radius: 999px;
      }

      .diff-pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 0.65rem;
        border-radius: 6px;
        border: 1px solid var(--panel-border);
        background: var(--uui-color-surface-alt, #f6f6f8);
        font-size: 0.8rem;
        line-height: 1.45;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        max-height: 18rem;
        overflow: auto;
      }

      :host([fullscreen]) .diff-pre {
        max-height: min(70vh, 48rem);
      }

      :host([fullscreen]) .diff-columns {
        grid-template-columns: 1fr 1fr;
      }

      :host([fullscreen]) .empty {
        min-height: 24rem;
      }

      .diff-same {
        color: inherit;
      }

      .diff-removed {
        background: rgba(214, 69, 69, 0.18);
        color: #9b1c1c;
        border-radius: 2px;
      }

      .diff-added {
        background: rgba(47, 158, 68, 0.18);
        color: #1f6f31;
        border-radius: 2px;
      }

      .diff-empty {
        color: var(--muted);
        font-style: italic;
      }

      .badge {
        display: inline-block;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 650;
        white-space: nowrap;
      }

      .badge.status-added {
        background: rgba(47, 158, 68, 0.15);
        color: #2f9e44;
      }
      .badge.status-missing {
        background: rgba(214, 69, 69, 0.15);
        color: #d64545;
      }
      .badge.status-modified {
        background: rgba(201, 137, 43, 0.15);
        color: #c9892b;
      }
      .badge.status-identical {
        background: rgba(61, 126, 166, 0.15);
        color: #3d7ea6;
      }
      .badge.status-ignored {
        background: rgba(110, 109, 112, 0.12);
        color: var(--muted);
      }

      @media (prefers-color-scheme: dark) {
        .diff-removed {
          color: #fca5a5;
        }
        .diff-added {
          color: #86efac;
        }
      }
    `
];
k([
  M({ attribute: !1 })
], _.prototype, "item", 2);
k([
  M({ type: String })
], _.prototype, "environmentA", 2);
k([
  M({ type: String })
], _.prototype, "environmentB", 2);
k([
  M({ type: Boolean, reflect: !0 })
], _.prototype, "fullscreen", 2);
_ = k([
  Y("envcompare-diff-panel")
], _);
const Re = {
  Missing: 4,
  Modified: 3,
  Added: 2,
  Identical: 1,
  Ignored: 0
};
function re(e) {
  const t = /* @__PURE__ */ new Map(), r = [], i = [...e].sort((n, a) => {
    const l = n.path ?? n.id, d = a.path ?? a.id;
    return l.localeCompare(d);
  });
  for (const n of i) {
    const l = (n.path?.trim() || n.id).split(",").filter((c) => c.length > 0), d = Math.max(l.length, 1);
    let p = "";
    for (let c = 0; c < d; c++) {
      const g = l[c] ?? n.id, b = p;
      if (p = p ? `${p},${g}` : g, t.has(p)) {
        if (c === d - 1) {
          const v = t.get(p);
          v.item = n, v.label = n.name, v.id = n.id, v.statusRank = Math.max(v.statusRank, q(n));
        }
      } else {
        const v = c === d - 1, P = {
          id: v ? n.id : p,
          label: v ? n.name : `… ${g}`,
          path: p,
          depth: c,
          item: v ? n : null,
          children: [],
          statusRank: v ? q(n) : 0
        };
        t.set(p, P), b ? t.get(b)?.children.push(P) : r.push(P);
      }
    }
  }
  return ne(r), r;
}
function ie(e, t, r = 0) {
  const i = [];
  for (const n of e)
    i.push({ node: n, depth: r }), n.children.length > 0 && t.has(n.path) && i.push(...ie(n.children, t, r + 1));
  return i;
}
function We(e) {
  const t = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
  for (const i of e)
    i.culture && t.add(i.culture), i.contentType && r.add(i.contentType);
  return {
    cultures: [...t].sort(),
    contentTypes: [...r].sort()
  };
}
function q(e) {
  return Re[F(e.status)] ?? 0;
}
function ne(e) {
  for (const t of e)
    t.children.length > 0 && (ne(t.children), t.statusRank = Math.max(
      t.statusRank,
      ...t.children.map((r) => r.statusRank)
    ));
}
function se(e, t, r, i, n = 4) {
  if (r <= 0 || i <= 0)
    return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };
  const a = r * i, l = Math.max(0, Math.floor(e / i) - n), d = Math.ceil(t / i) + n * 2, p = Math.min(r, l + d);
  return {
    start: l,
    end: p,
    offsetTop: l * i,
    totalHeight: a
  };
}
var Ve = Object.defineProperty, He = Object.getOwnPropertyDescriptor, ae = (e) => {
  throw TypeError(e);
}, m = (e, t, r, i) => {
  for (var n = i > 1 ? void 0 : i ? He(t, r) : t, a = e.length - 1, l; a >= 0; a--)
    (l = e[a]) && (n = (i ? l(t, r, n) : l(n)) || n);
  return i && n && Ve(t, r, n), n;
}, R = (e, t, r) => t.has(e) || ae("Cannot " + r), x = (e, t, r) => (R(e, t, "read from private field"), t.get(e)), w = (e, t, r) => t.has(e) ? ae("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), I = (e, t, r, i) => (R(e, t, "write to private field"), t.set(e, r), r), o = (e, t, r) => (R(e, t, "access private method"), r), T, E, L, S, s, oe, le, de, ce, pe, ue, he, me, W, z, fe, ge, V, ve, be, _e, H, ye, we, D, y, $, N, $e, xe, ke, Ce, Se, Ae, Te, O;
const Ee = 52, U = {
  content: "content",
  media: "media",
  settings: "settings",
  dictionary: "dictionary"
}, Ne = {
  Identical: "✔",
  Added: "＋",
  Missing: "−",
  Modified: "△",
  Ignored: "○"
};
let h = class extends J {
  constructor() {
    super(...arguments), w(this, s), this._environments = [], this._environmentA = "Local", this._environmentB = "", this._isComparing = !1, this._isLoadingEnvironments = !0, this._progress = 0, this._statusMessage = "Loading environments…", this._activeTab = "content", this._viewMode = "tree", this._search = "", this._statusFilter = "", this._cultureFilter = "", this._contentTypeFilter = "", this._result = null, this._selectedItem = null, this._expandedPaths = /* @__PURE__ */ new Set(), this._listScrollTop = 0, this._listViewportHeight = 420, this._diffPanelWidth = 22, this._diffFullscreen = !1, w(this, T, null), w(this, E, 0), w(this, L, 22), w(this, S, (e) => {
      e.key === "Escape" && this._diffFullscreen && (e.preventDefault(), this._diffFullscreen = !1);
    });
  }
  connectedCallback() {
    super.connectedCallback(), o(this, s, oe).call(this), window.addEventListener("keydown", x(this, S));
  }
  disconnectedCallback() {
    window.removeEventListener("keydown", x(this, S)), super.disconnectedCallback();
  }
  render() {
    const e = o(this, s, z).call(this).length;
    return u`
      <div class="layout">
        <header class="toolbar">
          <div class="brand">
            <h1>CloudLens</h1>
            <p>Compare content between Umbraco Cloud environments (read-only).</p>
          </div>

          <div class="controls">
            <label>
              <span>Environment A</span>
              <select
                .value=${this._environmentA}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${o(this, s, le)}
              >
                ${o(this, s, D).call(this, this._environmentA)}
              </select>
            </label>

            <uui-button
              look="secondary"
              label="Swap environments"
              compact
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${o(this, s, me)}
            >
              ⇄
            </uui-button>

            <label>
              <span>Environment B</span>
              <select
                .value=${this._environmentB}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${o(this, s, de)}
              >
                ${o(this, s, D).call(this, this._environmentB)}
              </select>
            </label>

            <uui-button
              look="primary"
              color="positive"
              label="Compare"
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${o(this, s, we)}
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
          ${o(this, s, y).call(this, "Total Compared", this._result ? String(this._result.totalCompared) : "—", "neutral")}
          ${o(this, s, y).call(this, "Modified", this._result ? String(this._result.modifiedCount) : "—", "modified")}
          ${o(this, s, y).call(this, "Missing", this._result ? String(this._result.missingCount) : "—", "missing")}
          ${o(this, s, y).call(this, "Added", this._result ? String(this._result.addedCount) : "—", "added")}
          ${o(this, s, y).call(this, "Identical", this._result ? String(this._result.identicalCount) : "—", "identical")}
        </section>

        <div
          class="workspace"
          style="--diff-width:${this._diffPanelWidth}rem"
        >
          ${o(this, s, Se).call(this)}

          <main class="results">
            <nav class="tabs" aria-label="Result categories">
              ${o(this, s, $).call(this, "content", "Content")}
              ${o(this, s, $).call(this, "media", "Media")}
              ${o(this, s, $).call(this, "settings", "Settings")}
              ${o(this, s, $).call(this, "dictionary", "Dictionary")}
            </nav>

            <div class="tree-panel ${this._isComparing ? "is-loading" : ""}">
              <div class="tree-toolbar">
                <h2>${this._activeTab}</h2>
                <span class="result-count">${e} visible</span>
                <div class="view-toggle" role="group" aria-label="View mode">
                  <button
                    type="button"
                    class="view-btn ${this._viewMode === "tree" ? "is-active" : ""}"
                    @click=${() => {
      this._viewMode = "tree", this._listScrollTop = 0;
    }}
                  >
                    Tree
                  </button>
                  <button
                    type="button"
                    class="view-btn ${this._viewMode === "list" ? "is-active" : ""}"
                    @click=${() => {
      this._viewMode = "list", this._listScrollTop = 0;
    }}
                  >
                    List
                  </button>
                </div>
                ${this._viewMode === "tree" ? u`
                      <button type="button" class="link-btn" @click=${o(this, s, V)}>
                        Expand all
                      </button>
                      <button type="button" class="link-btn" @click=${o(this, s, ve)}>
                        Collapse all
                      </button>
                    ` : ""}
              </div>

              ${this._isComparing ? u`
                    <div class="loading-overlay" aria-live="polite">
                      <div class="spinner" aria-hidden="true"></div>
                      <p>Running comparison…</p>
                    </div>
                  ` : ""}

              ${o(this, s, Ce).call(this)}
            </div>
          </main>

          <div
            class="splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize diff panel"
            @pointerdown=${o(this, s, ye)}
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
                @click=${o(this, s, Ae)}
              >
                ⛶
              </button>
            </div>
            ${o(this, s, O).call(this)}
          </aside>
        </div>

        ${this._diffFullscreen ? u`
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
                    @click=${o(this, s, Te)}
                  >
                    Close
                  </button>
                </header>
                <div class="diff-fullscreen-body">
                  ${o(this, s, O).call(this, !0)}
                </div>
              </div>
            ` : ""}
      </div>
    `;
  }
};
T = /* @__PURE__ */ new WeakMap();
E = /* @__PURE__ */ new WeakMap();
L = /* @__PURE__ */ new WeakMap();
S = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
oe = async function() {
  this._isLoadingEnvironments = !0;
  try {
    const e = await Le();
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
le = function(e) {
  this._environmentA = e.target.value;
};
de = function(e) {
  this._environmentB = e.target.value;
};
ce = function(e) {
  this._search = e.target.value, this._listScrollTop = 0;
};
pe = function(e) {
  this._statusFilter = e.target.value, this._listScrollTop = 0;
};
ue = function(e) {
  this._cultureFilter = e.target.value, this._listScrollTop = 0;
};
he = function(e) {
  this._contentTypeFilter = e.target.value, this._listScrollTop = 0;
};
me = function() {
  const e = this._environmentA;
  this._environmentA = this._environmentB, this._environmentB = e;
};
W = function(e) {
  const t = F(e.status);
  if (this._statusFilter && t.toLowerCase() !== this._statusFilter.toLowerCase() || this._cultureFilter && e.culture?.toLowerCase() !== this._cultureFilter.toLowerCase() || this._contentTypeFilter && e.contentType?.toLowerCase() !== this._contentTypeFilter.toLowerCase())
    return !1;
  if (this._search.trim()) {
    const r = this._search.trim().toLowerCase();
    if (![
      e.name,
      e.id,
      e.path ?? "",
      e.contentType ?? "",
      e.differenceSummary ?? ""
    ].join(" ").toLowerCase().includes(r))
      return !1;
  }
  return !0;
};
z = function() {
  return (this._result?.items ?? []).filter((t) => (t.moduleAlias ?? "content").toLowerCase() === U[this._activeTab] && o(this, s, W).call(this, t));
};
fe = function(e) {
  return (this._result?.items ?? []).filter((r) => (r.moduleAlias ?? "content").toLowerCase() === U[e] && o(this, s, W).call(this, r)).length;
};
ge = function() {
  const e = (this._result?.items ?? []).filter(
    (t) => (t.moduleAlias ?? "content").toLowerCase() === U[this._activeTab]
  );
  return We(e);
};
V = function() {
  const e = o(this, s, z).call(this), t = re(e), r = /* @__PURE__ */ new Set(), i = (n) => {
    for (const a of n)
      a.children.length > 0 && (r.add(a.path), i(a.children));
  };
  i(t), this._expandedPaths = r;
};
ve = function() {
  this._expandedPaths = /* @__PURE__ */ new Set();
};
be = function(e, t) {
  t.stopPropagation();
  const r = new Set(this._expandedPaths);
  r.has(e) ? r.delete(e) : r.add(e), this._expandedPaths = r;
};
_e = function(e) {
  this._selectedItem = e;
};
H = function(e) {
  const t = e.target;
  this._listScrollTop = t.scrollTop, this._listViewportHeight = t.clientHeight;
};
ye = function(e) {
  e.preventDefault(), I(this, E, e.clientX), I(this, L, this._diffPanelWidth);
  const t = (i) => {
    const n = x(this, E) - i.clientX, a = Math.min(40, Math.max(14, x(this, L) + n / 16));
    this._diffPanelWidth = a;
  }, r = () => {
    window.removeEventListener("pointermove", t), window.removeEventListener("pointerup", r);
  };
  window.addEventListener("pointermove", t), window.addEventListener("pointerup", r);
};
we = async function() {
  if (!this._environmentA || !this._environmentB) {
    this._statusMessage = "Select both Environment A and Environment B.";
    return;
  }
  if (this._environmentA === this._environmentB) {
    this._statusMessage = "Environment A and B must be different.";
    return;
  }
  x(this, T)?.abort(), I(this, T, new AbortController()), this._isComparing = !0, this._progress = 15, this._selectedItem = null, this._diffFullscreen = !1, this._listScrollTop = 0, this._statusMessage = `Comparing ${this._environmentA} → ${this._environmentB}…`;
  const e = window.setInterval(() => {
    this._progress < 85 && (this._progress += 5);
  }, 200);
  try {
    const t = await Me({
      environmentA: this._environmentA,
      environmentB: this._environmentB
    });
    this._result = t, this._progress = 100, this._statusMessage = `Compared ${t.totalCompared} item(s).`, o(this, s, V).call(this);
  } catch (t) {
    this._progress = 0, this._statusMessage = t instanceof Error ? t.message : "Comparison failed.";
  } finally {
    window.clearInterval(e), this._isComparing = !1;
  }
};
D = function(e) {
  return (this._environments.length > 0 ? this._environments : [
    {
      name: "Local",
      displayName: "Local",
      isLocal: !0,
      isAvailable: !0
    }
  ]).map(
    (r) => u`
        <option value=${r.name} ?selected=${r.name === e}>
          ${r.displayName}${r.isAvailable ? "" : " (unavailable)"}
        </option>
      `
  );
};
y = function(e, t, r) {
  return u`
      <div class="summary-card" data-tone=${r}>
        <span class="summary-label">${e}</span>
        <span class="summary-value">${t}</span>
      </div>
    `;
};
$ = function(e, t) {
  const r = this._result ? o(this, s, fe).call(this, e) : null;
  return u`
      <button
        type="button"
        class="tab ${this._activeTab === e ? "is-active" : ""}"
        @click=${() => {
    this._activeTab = e, this._selectedItem = null, this._listScrollTop = 0;
  }}
      >
        ${t}${r !== null ? u` <span class="tab-count">${r}</span>` : ""}
      </button>
    `;
};
N = function(e, t = 0) {
  const r = F(e.status), i = Ne[r] ?? "•";
  return u`
      <button
        type="button"
        class="result-row status-${r.toLowerCase()} ${this._selectedItem?.id === e.id ? "is-selected" : ""}"
        style=${`--indent:${t}`}
        @click=${() => o(this, s, _e).call(this, e)}
      >
        <span class="result-icon" aria-hidden="true">${i}</span>
        <span class="result-status">${r}</span>
        <span class="result-name">${e.name}</span>
        <span class="result-meta"
          >${e.contentType ?? "—"} · ${e.path ?? e.id}</span
        >
      </button>
    `;
};
$e = function(e, t) {
  const r = this._expandedPaths.has(e.path), i = e.item;
  return i ? o(this, s, N).call(this, i, t) : u`
      <button
        type="button"
        class="tree-folder"
        style=${`--indent:${t}`}
        @click=${(n) => o(this, s, be).call(this, e.path, n)}
      >
        <span class="tree-chevron ${r ? "is-open" : ""}" aria-hidden="true">›</span>
        <span class="tree-folder-label">${e.label}</span>
        <span class="tree-folder-meta">${e.children.length} children</span>
      </button>
    `;
};
xe = function(e) {
  const t = se(
    this._listScrollTop,
    this._listViewportHeight,
    e.length,
    Ee
  ), r = e.slice(t.start, t.end);
  return u`
      <div
        class="virtual-scroll"
        @scroll=${o(this, s, H)}
        role="list"
      >
        <div class="virtual-spacer" style="height:${t.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${t.offsetTop}px)">
            ${r.map((i) => o(this, s, N).call(this, i))}
          </div>
        </div>
      </div>
    `;
};
ke = function(e) {
  const t = re(e), r = ie(t, this._expandedPaths);
  if (r.length === 0)
    return u`<div class="empty"><p>No items to display.</p></div>`;
  const i = se(
    this._listScrollTop,
    this._listViewportHeight,
    r.length,
    Ee
  ), n = r.slice(i.start, i.end);
  return u`
      <div class="virtual-scroll" @scroll=${o(this, s, H)} role="tree">
        <div class="virtual-spacer" style="height:${i.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${i.offsetTop}px)">
            ${n.map(({ node: a, depth: l }) => o(this, s, $e).call(this, a, l))}
          </div>
        </div>
      </div>
    `;
};
Ce = function() {
  const e = o(this, s, z).call(this);
  return this._result ? e.length === 0 ? u`
        <div class="empty">
          <p>No items match the current tab/filters.</p>
        </div>
      ` : this._viewMode === "tree" ? o(this, s, ke).call(this, e) : o(this, s, xe).call(this, e) : u`
        <div class="empty">
          <p>No comparison results yet.</p>
          <p class="hint">Select environments and click Compare.</p>
        </div>
      `;
};
Se = function() {
  const e = o(this, s, ge).call(this);
  return u`
      <aside class="filters" aria-label="Filters">
        <h2>Filters</h2>

        <label>
          <span>Search</span>
          <input
            type="search"
            placeholder="Instant search…"
            .value=${this._search}
            @input=${o(this, s, ce)}
          />
        </label>

        <label>
          <span>Status</span>
          <select .value=${this._statusFilter} @change=${o(this, s, pe)}>
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
          <select .value=${this._cultureFilter} @change=${o(this, s, ue)}>
            <option value="">All cultures</option>
            ${e.cultures.map(
    (t) => u`<option value=${t}>${t}</option>`
  )}
          </select>
        </label>

        <label>
          <span>Content type</span>
          <select .value=${this._contentTypeFilter} @change=${o(this, s, he)}>
            <option value="">All types</option>
            ${e.contentTypes.map(
    (t) => u`<option value=${t}>${t}</option>`
  )}
          </select>
        </label>

        <p class="hint">
          Filters apply instantly on the result grid. Dictionary items appear
          under <strong>Dictionary</strong>. Document types, element types, media
          types, and data types appear under <strong>Settings</strong>. New items
          show as <strong>Missing</strong> when they exist only in Environment A
          (e.g. Local).
        </p>
      </aside>
    `;
};
Ae = function() {
  this._selectedItem && (this._diffFullscreen = !0);
};
Te = function() {
  this._diffFullscreen = !1;
};
O = function(e = !1) {
  return u`
      <envcompare-diff-panel
        .item=${this._selectedItem}
        .environmentA=${this._environmentA}
        .environmentB=${this._environmentB}
        ?fullscreen=${e}
      ></envcompare-diff-panel>
    `;
};
h.styles = [
  K`
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
    `
];
m([
  f()
], h.prototype, "_environments", 2);
m([
  f()
], h.prototype, "_environmentA", 2);
m([
  f()
], h.prototype, "_environmentB", 2);
m([
  f()
], h.prototype, "_isComparing", 2);
m([
  f()
], h.prototype, "_isLoadingEnvironments", 2);
m([
  f()
], h.prototype, "_progress", 2);
m([
  f()
], h.prototype, "_statusMessage", 2);
m([
  f()
], h.prototype, "_activeTab", 2);
m([
  f()
], h.prototype, "_viewMode", 2);
m([
  f()
], h.prototype, "_search", 2);
m([
  f()
], h.prototype, "_statusFilter", 2);
m([
  f()
], h.prototype, "_cultureFilter", 2);
m([
  f()
], h.prototype, "_contentTypeFilter", 2);
m([
  f()
], h.prototype, "_result", 2);
m([
  f()
], h.prototype, "_selectedItem", 2);
m([
  f()
], h.prototype, "_expandedPaths", 2);
m([
  f()
], h.prototype, "_listScrollTop", 2);
m([
  f()
], h.prototype, "_listViewportHeight", 2);
m([
  f()
], h.prototype, "_diffPanelWidth", 2);
m([
  f()
], h.prototype, "_diffFullscreen", 2);
h = m([
  Y("envcompare-dashboard")
], h);
const Xe = h;
export {
  h as EnvCompareDashboardElement,
  Xe as default
};
//# sourceMappingURL=envcompare-dashboard.element-D0zzy_0_.js.map
