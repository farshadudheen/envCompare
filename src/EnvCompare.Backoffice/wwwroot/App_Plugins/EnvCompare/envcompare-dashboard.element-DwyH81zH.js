import { css as X, property as B, customElement as q, html as h, state as f } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as Y } from "@umbraco-cms/backoffice/lit-element";
import { c as K } from "./client.gen-Cq1iPozM.js";
async function Se() {
  const { data: e, error: t, response: r } = await K.get({
    url: "/umbraco/envcompare/api/v1/environments"
  });
  if (t || !r.ok)
    throw new Error(
      `Failed to load environments (${r?.status ?? "unknown"}).`
    );
  const i = e;
  return Array.isArray(i) ? i : [];
}
async function Ae(e) {
  const { data: t, error: r, response: i } = await K.post({
    url: "/umbraco/envcompare/api/v1/compare",
    body: e,
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (r || !i.ok) {
    const s = typeof r == "string" ? r : `Comparison failed (${i?.status ?? "unknown"}).`;
    throw new Error(s);
  }
  return t;
}
function A(e) {
  return typeof e == "number" ? ["Identical", "Added", "Missing", "Modified", "Ignored"][e] ?? String(e) : e;
}
function N(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function Ee(e, t) {
  const r = U(e), i = U(t), s = J(r, i);
  return Me(r, i, s);
}
function Le(e, t) {
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
  const s = r.split(`
`), n = i.split(`
`);
  if (s.length === 1 && n.length === 1)
    return Ee(r, i);
  const l = J(s, n), d = [], p = [];
  let c = 0, g = 0;
  for (const b of l) {
    for (; c < s.length && s[c] !== b; )
      d.push({ text: `${s[c]}
`, type: "removed" }), c++;
    for (; g < n.length && n[g] !== b; )
      p.push({ text: `${n[g]}
`, type: "added" }), g++;
    c < s.length && g < n.length && (d.push({ text: `${b}
`, type: "same" }), p.push({ text: `${b}
`, type: "same" }), c++, g++);
  }
  for (; c < s.length; )
    d.push({ text: `${s[c]}
`, type: "removed" }), c++;
  for (; g < n.length; )
    p.push({ text: `${n[g]}
`, type: "added" }), g++;
  return {
    left: { parts: k(d) },
    right: { parts: k(p) }
  };
}
function U(e) {
  const t = [], r = /(\s+|[^\s]+)/g;
  let i;
  for (; (i = r.exec(e)) !== null; )
    t.push(i[0]);
  return t.length > 0 ? t : [e];
}
function J(e, t) {
  const r = e.length + 1, i = t.length + 1, s = Array.from({ length: r }, () => Array(i).fill(0));
  for (let p = 1; p < r; p++)
    for (let c = 1; c < i; c++)
      e[p - 1] === t[c - 1] ? s[p][c] = s[p - 1][c - 1] + 1 : s[p][c] = Math.max(s[p - 1][c], s[p][c - 1]);
  const n = [];
  let l = e.length, d = t.length;
  for (; l > 0 && d > 0; )
    e[l - 1] === t[d - 1] ? (n.unshift(e[l - 1]), l--, d--) : s[l - 1][d] >= s[l][d - 1] ? l-- : d--;
  return n;
}
function Me(e, t, r) {
  const i = [], s = [];
  let n = 0, l = 0;
  for (const d of r) {
    for (; n < e.length && e[n] !== d; )
      i.push({ text: e[n], type: "removed" }), n++;
    for (; l < t.length && t[l] !== d; )
      s.push({ text: t[l], type: "added" }), l++;
    n < e.length && l < t.length && (i.push({ text: d, type: "same" }), s.push({ text: d, type: "same" }), n++, l++);
  }
  for (; n < e.length; )
    i.push({ text: e[n], type: "removed" }), n++;
  for (; l < t.length; )
    s.push({ text: t[l], type: "added" }), l++;
  return {
    left: { parts: k(i) },
    right: { parts: k(s) }
  };
}
function k(e) {
  if (e.length === 0)
    return e;
  const t = [{ ...e[0] }];
  for (let r = 1; r < e.length; r++) {
    const i = e[r], s = t[t.length - 1];
    s.type === i.type ? s.text += i.text : t.push({ ...i });
  }
  return t;
}
var Fe = Object.defineProperty, Pe = Object.getOwnPropertyDescriptor, Q = (e) => {
  throw TypeError(e);
}, E = (e, t, r, i) => {
  for (var s = i > 1 ? void 0 : i ? Pe(t, r) : t, n = e.length - 1, l; n >= 0; n--)
    (l = e[n]) && (s = (i ? l(t, r, s) : l(s)) || s);
  return i && s && Fe(t, r, s), s;
}, ze = (e, t, r) => t.has(e) || Q("Cannot " + r), Ie = (e, t, r) => t.has(e) ? Q("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), j = (e, t, r) => (ze(e, t, "access private method"), r), x, F;
let y = class extends Y {
  constructor() {
    super(...arguments), Ie(this, x), this.item = null, this.environmentA = "Environment A", this.environmentB = "Environment B";
  }
  render() {
    if (!this.item)
      return h`
        <div class="empty">
          <p>Select a result row to inspect differences.</p>
          <p class="hint">Changed text is highlighted like a Git diff.</p>
        </div>
      `;
    const e = this.item, t = A(e.status);
    return h`
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
          ${j(this, x, F).call(this, "Environment A", e.environmentAValue, "left", e.environmentBValue)}
          ${j(this, x, F).call(this, "Environment B", e.environmentBValue, "right", e.environmentAValue)}
        </div>
      </div>
    `;
  }
};
x = /* @__PURE__ */ new WeakSet();
F = function(e, t, r, i) {
  const s = Le(
    r === "left" ? t : i,
    r === "left" ? i : t
  ), n = r === "left" ? s.left.parts : s.right.parts, l = t ?? "(missing)";
  return h`
      <section class="diff-side" aria-label=${e}>
        <header class="diff-side-header">
          <h3>${e}</h3>
          <span class="env-tag">${r === "left" ? this.environmentA : this.environmentB}</span>
        </header>
        <pre class="diff-pre">
          ${n.length > 0 ? n.map(
    (d) => h`
                  <span class="diff-${d.type}">${N(d.text)}</span>
                `
  ) : h`<span class="diff-empty">${N(l)}</span>`}
        </pre>
      </section>
    `;
};
y.styles = [
  X`
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
E([
  B({ attribute: !1 })
], y.prototype, "item", 2);
E([
  B({ type: String })
], y.prototype, "environmentA", 2);
E([
  B({ type: String })
], y.prototype, "environmentB", 2);
y = E([
  q("envcompare-diff-panel")
], y);
const Be = {
  Missing: 4,
  Modified: 3,
  Added: 2,
  Identical: 1,
  Ignored: 0
};
function Z(e) {
  const t = /* @__PURE__ */ new Map(), r = [], i = [...e].sort((s, n) => {
    const l = s.path ?? s.id, d = n.path ?? n.id;
    return l.localeCompare(d);
  });
  for (const s of i) {
    const l = (s.path?.trim() || s.id).split(",").filter((c) => c.length > 0), d = Math.max(l.length, 1);
    let p = "";
    for (let c = 0; c < d; c++) {
      const g = l[c] ?? s.id, b = p;
      if (p = p ? `${p},${g}` : g, t.has(p)) {
        if (c === d - 1) {
          const v = t.get(p);
          v.item = s, v.label = s.name, v.id = s.id, v.statusRank = Math.max(v.statusRank, G(s));
        }
      } else {
        const v = c === d - 1, M = {
          id: v ? s.id : p,
          label: v ? s.name : `… ${g}`,
          path: p,
          depth: c,
          item: v ? s : null,
          children: [],
          statusRank: v ? G(s) : 0
        };
        t.set(p, M), b ? t.get(b)?.children.push(M) : r.push(M);
      }
    }
  }
  return te(r), r;
}
function ee(e, t, r = 0) {
  const i = [];
  for (const s of e)
    i.push({ node: s, depth: r }), s.children.length > 0 && t.has(s.path) && i.push(...ee(s.children, t, r + 1));
  return i;
}
function Re(e) {
  const t = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set();
  for (const i of e)
    i.culture && t.add(i.culture), i.contentType && r.add(i.contentType);
  return {
    cultures: [...t].sort(),
    contentTypes: [...r].sort()
  };
}
function G(e) {
  return Be[A(e.status)] ?? 0;
}
function te(e) {
  for (const t of e)
    t.children.length > 0 && (te(t.children), t.statusRank = Math.max(
      t.statusRank,
      ...t.children.map((r) => r.statusRank)
    ));
}
function re(e, t, r, i, s = 4) {
  if (r <= 0 || i <= 0)
    return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };
  const n = r * i, l = Math.max(0, Math.floor(e / i) - s), d = Math.ceil(t / i) + s * 2, p = Math.min(r, l + d);
  return {
    start: l,
    end: p,
    offsetTop: l * i,
    totalHeight: n
  };
}
var De = Object.defineProperty, Oe = Object.getOwnPropertyDescriptor, ie = (e) => {
  throw TypeError(e);
}, m = (e, t, r, i) => {
  for (var s = i > 1 ? void 0 : i ? Oe(t, r) : t, n = e.length - 1, l; n >= 0; n--)
    (l = e[n]) && (s = (i ? l(t, r, s) : l(s)) || s);
  return i && s && De(t, r, s), s;
}, R = (e, t, r) => t.has(e) || ie("Cannot " + r), P = (e, t, r) => (R(e, t, "read from private field"), t.get(e)), $ = (e, t, r) => t.has(e) ? ie("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), z = (e, t, r, i) => (R(e, t, "write to private field"), t.set(e, r), r), o = (e, t, r) => (R(e, t, "access private method"), r), C, T, S, a, se, ne, ae, oe, le, de, ce, pe, ue, he, D, L, me, fe, O, ge, ve, be, W, _e, ye, I, _, w, V, we, $e, xe, ke, Ce;
const Te = 52, H = {
  content: "content",
  media: "media",
  settings: "settings",
  dictionary: "dictionary"
}, We = {
  Identical: "✔",
  Added: "＋",
  Missing: "−",
  Modified: "△",
  Ignored: "○"
};
let u = class extends Y {
  constructor() {
    super(...arguments), $(this, a), this._environments = [], this._environmentA = "Local", this._environmentB = "", this._isComparing = !1, this._isLoadingEnvironments = !0, this._progress = 0, this._statusMessage = "Loading environments…", this._activeTab = "content", this._viewMode = "tree", this._search = "", this._statusFilter = "", this._cultureFilter = "", this._contentTypeFilter = "", this._pathFilter = "", this._showIgnored = !1, this._result = null, this._selectedItem = null, this._expandedPaths = /* @__PURE__ */ new Set(), this._listScrollTop = 0, this._listViewportHeight = 420, this._diffPanelWidth = 22, $(this, C, null), $(this, T, 0), $(this, S, 22);
  }
  connectedCallback() {
    super.connectedCallback(), o(this, a, se).call(this);
  }
  render() {
    const e = o(this, a, L).call(this).length;
    return h`
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
                @change=${o(this, a, ne)}
              >
                ${o(this, a, I).call(this, this._environmentA)}
              </select>
            </label>

            <uui-button
              look="secondary"
              label="Swap environments"
              compact
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${o(this, a, he)}
            >
              ⇄
            </uui-button>

            <label>
              <span>Environment B</span>
              <select
                .value=${this._environmentB}
                ?disabled=${this._isComparing || this._isLoadingEnvironments}
                @change=${o(this, a, ae)}
              >
                ${o(this, a, I).call(this, this._environmentB)}
              </select>
            </label>

            <uui-button
              look="primary"
              color="positive"
              label="Compare"
              ?disabled=${this._isComparing || this._isLoadingEnvironments}
              @click=${o(this, a, ye)}
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
          ${o(this, a, _).call(this, "Total Compared", this._result ? String(this._result.totalCompared) : "—", "neutral")}
          ${o(this, a, _).call(this, "Modified", this._result ? String(this._result.modifiedCount) : "—", "modified")}
          ${o(this, a, _).call(this, "Missing", this._result ? String(this._result.missingCount) : "—", "missing")}
          ${o(this, a, _).call(this, "Added", this._result ? String(this._result.addedCount) : "—", "added")}
          ${o(this, a, _).call(this, "Identical", this._result ? String(this._result.identicalCount) : "—", "identical")}
        </section>

        <div
          class="workspace"
          style="--diff-width:${this._diffPanelWidth}rem"
        >
          ${o(this, a, Ce).call(this)}

          <main class="results">
            <nav class="tabs" aria-label="Result categories">
              ${o(this, a, w).call(this, "content", "Content")}
              ${o(this, a, w).call(this, "media", "Media")}
              ${o(this, a, w).call(this, "settings", "Settings")}
              ${o(this, a, w).call(this, "dictionary", "Dictionary")}
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
                ${this._viewMode === "tree" ? h`
                      <button type="button" class="link-btn" @click=${o(this, a, O)}>
                        Expand all
                      </button>
                      <button type="button" class="link-btn" @click=${o(this, a, ge)}>
                        Collapse all
                      </button>
                    ` : ""}
              </div>

              ${this._isComparing ? h`
                    <div class="loading-overlay" aria-live="polite">
                      <div class="spinner" aria-hidden="true"></div>
                      <p>Running comparison…</p>
                    </div>
                  ` : ""}

              ${o(this, a, ke).call(this)}
            </div>
          </main>

          <div
            class="splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize diff panel"
            @pointerdown=${o(this, a, _e)}
          ></div>

          <aside class="diff-panel" aria-label="Property differences">
            <h2>Differences</h2>
            <envcompare-diff-panel
              .item=${this._selectedItem}
              .environmentA=${this._environmentA}
              .environmentB=${this._environmentB}
            ></envcompare-diff-panel>
          </aside>
        </div>
      </div>
    `;
  }
};
C = /* @__PURE__ */ new WeakMap();
T = /* @__PURE__ */ new WeakMap();
S = /* @__PURE__ */ new WeakMap();
a = /* @__PURE__ */ new WeakSet();
se = async function() {
  this._isLoadingEnvironments = !0;
  try {
    const e = await Se();
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
ne = function(e) {
  this._environmentA = e.target.value;
};
ae = function(e) {
  this._environmentB = e.target.value;
};
oe = function(e) {
  this._search = e.target.value, this._listScrollTop = 0;
};
le = function(e) {
  this._statusFilter = e.target.value, this._listScrollTop = 0;
};
de = function(e) {
  this._cultureFilter = e.target.value, this._listScrollTop = 0;
};
ce = function(e) {
  this._contentTypeFilter = e.target.value, this._listScrollTop = 0;
};
pe = function(e) {
  this._pathFilter = e.target.value, this._listScrollTop = 0;
};
ue = function(e) {
  this._showIgnored = e.target.checked, this._listScrollTop = 0;
};
he = function() {
  const e = this._environmentA;
  this._environmentA = this._environmentB, this._environmentB = e;
};
D = function(e) {
  const t = A(e.status);
  if (!this._showIgnored && t === "Ignored" || this._statusFilter && t.toLowerCase() !== this._statusFilter.toLowerCase() || this._cultureFilter && e.culture?.toLowerCase() !== this._cultureFilter.toLowerCase() || this._contentTypeFilter && e.contentType?.toLowerCase() !== this._contentTypeFilter.toLowerCase())
    return !1;
  if (this._pathFilter.trim()) {
    const r = this._pathFilter.trim().toLowerCase();
    if (!(e.path ?? "").toLowerCase().includes(r))
      return !1;
  }
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
L = function() {
  return (this._result?.items ?? []).filter((t) => (t.moduleAlias ?? "content").toLowerCase() === H[this._activeTab] && o(this, a, D).call(this, t));
};
me = function(e) {
  return (this._result?.items ?? []).filter((r) => (r.moduleAlias ?? "content").toLowerCase() === H[e] && o(this, a, D).call(this, r)).length;
};
fe = function() {
  const e = (this._result?.items ?? []).filter(
    (t) => (t.moduleAlias ?? "content").toLowerCase() === H[this._activeTab]
  );
  return Re(e);
};
O = function() {
  const e = o(this, a, L).call(this), t = Z(e), r = /* @__PURE__ */ new Set(), i = (s) => {
    for (const n of s)
      n.children.length > 0 && (r.add(n.path), i(n.children));
  };
  i(t), this._expandedPaths = r;
};
ge = function() {
  this._expandedPaths = /* @__PURE__ */ new Set();
};
ve = function(e, t) {
  t.stopPropagation();
  const r = new Set(this._expandedPaths);
  r.has(e) ? r.delete(e) : r.add(e), this._expandedPaths = r;
};
be = function(e) {
  this._selectedItem = e;
};
W = function(e) {
  const t = e.target;
  this._listScrollTop = t.scrollTop, this._listViewportHeight = t.clientHeight;
};
_e = function(e) {
  e.preventDefault(), z(this, T, e.clientX), z(this, S, this._diffPanelWidth);
  const t = (i) => {
    const s = P(this, T) - i.clientX, n = Math.min(40, Math.max(14, P(this, S) + s / 16));
    this._diffPanelWidth = n;
  }, r = () => {
    window.removeEventListener("pointermove", t), window.removeEventListener("pointerup", r);
  };
  window.addEventListener("pointermove", t), window.addEventListener("pointerup", r);
};
ye = async function() {
  if (!this._environmentA || !this._environmentB) {
    this._statusMessage = "Select both Environment A and Environment B.";
    return;
  }
  if (this._environmentA === this._environmentB) {
    this._statusMessage = "Environment A and B must be different.";
    return;
  }
  P(this, C)?.abort(), z(this, C, new AbortController()), this._isComparing = !0, this._progress = 15, this._selectedItem = null, this._listScrollTop = 0, this._statusMessage = `Comparing ${this._environmentA} → ${this._environmentB}…`;
  const e = window.setInterval(() => {
    this._progress < 85 && (this._progress += 5);
  }, 200);
  try {
    const t = await Ae({
      environmentA: this._environmentA,
      environmentB: this._environmentB,
      culture: this._cultureFilter || void 0,
      contentType: this._contentTypeFilter || void 0,
      pathContains: this._pathFilter || void 0,
      status: this._statusFilter || void 0,
      search: this._search || void 0
    });
    this._result = t, this._progress = 100, this._statusMessage = `Compared ${t.totalCompared} item(s).`, o(this, a, O).call(this);
  } catch (t) {
    this._progress = 0, this._statusMessage = t instanceof Error ? t.message : "Comparison failed.";
  } finally {
    window.clearInterval(e), this._isComparing = !1;
  }
};
I = function(e) {
  return (this._environments.length > 0 ? this._environments : [
    {
      name: "Local",
      displayName: "Local",
      isLocal: !0,
      isAvailable: !0
    }
  ]).map(
    (r) => h`
        <option value=${r.name} ?selected=${r.name === e}>
          ${r.displayName}${r.isAvailable ? "" : " (unavailable)"}
        </option>
      `
  );
};
_ = function(e, t, r) {
  return h`
      <div class="summary-card" data-tone=${r}>
        <span class="summary-label">${e}</span>
        <span class="summary-value">${t}</span>
      </div>
    `;
};
w = function(e, t) {
  const r = this._result ? o(this, a, me).call(this, e) : null;
  return h`
      <button
        type="button"
        class="tab ${this._activeTab === e ? "is-active" : ""}"
        @click=${() => {
    this._activeTab = e, this._selectedItem = null, this._listScrollTop = 0;
  }}
      >
        ${t}${r !== null ? h` <span class="tab-count">${r}</span>` : ""}
      </button>
    `;
};
V = function(e, t = 0) {
  const r = A(e.status), i = We[r] ?? "•";
  return h`
      <button
        type="button"
        class="result-row status-${r.toLowerCase()} ${this._selectedItem?.id === e.id ? "is-selected" : ""}"
        style=${`--indent:${t}`}
        @click=${() => o(this, a, be).call(this, e)}
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
we = function(e, t) {
  const r = this._expandedPaths.has(e.path), i = e.item;
  return i ? o(this, a, V).call(this, i, t) : h`
      <button
        type="button"
        class="tree-folder"
        style=${`--indent:${t}`}
        @click=${(s) => o(this, a, ve).call(this, e.path, s)}
      >
        <span class="tree-chevron ${r ? "is-open" : ""}" aria-hidden="true">›</span>
        <span class="tree-folder-label">${e.label}</span>
        <span class="tree-folder-meta">${e.children.length} children</span>
      </button>
    `;
};
$e = function(e) {
  const t = re(
    this._listScrollTop,
    this._listViewportHeight,
    e.length,
    Te
  ), r = e.slice(t.start, t.end);
  return h`
      <div
        class="virtual-scroll"
        @scroll=${o(this, a, W)}
        role="list"
      >
        <div class="virtual-spacer" style="height:${t.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${t.offsetTop}px)">
            ${r.map((i) => o(this, a, V).call(this, i))}
          </div>
        </div>
      </div>
    `;
};
xe = function(e) {
  const t = Z(e), r = ee(t, this._expandedPaths);
  if (r.length === 0)
    return h`<div class="empty"><p>No items to display.</p></div>`;
  const i = re(
    this._listScrollTop,
    this._listViewportHeight,
    r.length,
    Te
  ), s = r.slice(i.start, i.end);
  return h`
      <div class="virtual-scroll" @scroll=${o(this, a, W)} role="tree">
        <div class="virtual-spacer" style="height:${i.totalHeight}px">
          <div class="virtual-window" style="transform:translateY(${i.offsetTop}px)">
            ${s.map(({ node: n, depth: l }) => o(this, a, we).call(this, n, l))}
          </div>
        </div>
      </div>
    `;
};
ke = function() {
  const e = o(this, a, L).call(this);
  return this._result ? e.length === 0 ? h`
        <div class="empty">
          <p>No items match the current tab/filters.</p>
        </div>
      ` : this._viewMode === "tree" ? o(this, a, xe).call(this, e) : o(this, a, $e).call(this, e) : h`
        <div class="empty">
          <p>No comparison results yet.</p>
          <p class="hint">Select environments and click Compare.</p>
        </div>
      `;
};
Ce = function() {
  const e = o(this, a, fe).call(this);
  return h`
      <aside class="filters" aria-label="Filters">
        <h2>Filters</h2>

        <label>
          <span>Search</span>
          <input
            type="search"
            placeholder="Instant search…"
            .value=${this._search}
            @input=${o(this, a, oe)}
          />
        </label>

        <label>
          <span>Status</span>
          <select .value=${this._statusFilter} @change=${o(this, a, le)}>
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
          <select .value=${this._cultureFilter} @change=${o(this, a, de)}>
            <option value="">All cultures</option>
            ${e.cultures.map(
    (t) => h`<option value=${t}>${t}</option>`
  )}
          </select>
        </label>

        <label>
          <span>Content type</span>
          <select .value=${this._contentTypeFilter} @change=${o(this, a, ce)}>
            <option value="">All types</option>
            ${e.contentTypes.map(
    (t) => h`<option value=${t}>${t}</option>`
  )}
          </select>
        </label>

        <label>
          <span>Path contains</span>
          <input
            type="search"
            placeholder="/home…"
            .value=${this._pathFilter}
            @input=${o(this, a, pe)}
          />
        </label>

        <label class="checkbox-row">
          <input
            type="checkbox"
            .checked=${this._showIgnored}
            @change=${o(this, a, ue)}
          />
          <span>Show ignored items</span>
        </label>

        <p class="hint">
          Filters apply instantly. Click Compare to push filters to the engine
          for large sites.
        </p>
      </aside>
    `;
};
u.styles = [
  X`
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
      .diff-panel h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
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
        gap: 0.75rem;
        min-width: 0;
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
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
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
      }

      .tree-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 0.75rem;
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
        padding: 0.35rem 0.65rem;
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
], u.prototype, "_environments", 2);
m([
  f()
], u.prototype, "_environmentA", 2);
m([
  f()
], u.prototype, "_environmentB", 2);
m([
  f()
], u.prototype, "_isComparing", 2);
m([
  f()
], u.prototype, "_isLoadingEnvironments", 2);
m([
  f()
], u.prototype, "_progress", 2);
m([
  f()
], u.prototype, "_statusMessage", 2);
m([
  f()
], u.prototype, "_activeTab", 2);
m([
  f()
], u.prototype, "_viewMode", 2);
m([
  f()
], u.prototype, "_search", 2);
m([
  f()
], u.prototype, "_statusFilter", 2);
m([
  f()
], u.prototype, "_cultureFilter", 2);
m([
  f()
], u.prototype, "_contentTypeFilter", 2);
m([
  f()
], u.prototype, "_pathFilter", 2);
m([
  f()
], u.prototype, "_showIgnored", 2);
m([
  f()
], u.prototype, "_result", 2);
m([
  f()
], u.prototype, "_selectedItem", 2);
m([
  f()
], u.prototype, "_expandedPaths", 2);
m([
  f()
], u.prototype, "_listScrollTop", 2);
m([
  f()
], u.prototype, "_listViewportHeight", 2);
m([
  f()
], u.prototype, "_diffPanelWidth", 2);
u = m([
  q("envcompare-dashboard")
], u);
const Ue = u;
export {
  u as EnvCompareDashboardElement,
  Ue as default
};
//# sourceMappingURL=envcompare-dashboard.element-DwyH81zH.js.map
