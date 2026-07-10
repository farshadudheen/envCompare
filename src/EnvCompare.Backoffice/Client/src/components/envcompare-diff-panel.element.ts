import {
  css,
  html,
  customElement,
  property,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import {
  statusLabel,
  type ComparisonItem,
} from "../api/compare-api.js";
import { diffText, escapeHtml } from "../utils/text-diff.js";

/**
 * Git-style side-by-side diff panel for a selected comparison row.
 */
@customElement("envcompare-diff-panel")
export class EnvCompareDiffPanelElement extends UmbLitElement {
  @property({ attribute: false })
  item: ComparisonItem | null = null;

  @property({ type: String })
  environmentA = "Environment A";

  @property({ type: String })
  environmentB = "Environment B";

  #renderDiffSide(
    label: string,
    value: string | null | undefined,
    side: "left" | "right",
    other: string | null | undefined,
  ) {
    const diff = diffText(
      side === "left" ? value : other,
      side === "left" ? other : value,
    );
    const parts = side === "left" ? diff.left.parts : diff.right.parts;
    const display = value ?? "(missing)";

    return html`
      <section class="diff-side" aria-label=${label}>
        <header class="diff-side-header">
          <h3>${label}</h3>
          <span class="env-tag">${side === "left" ? this.environmentA : this.environmentB}</span>
        </header>
        <pre class="diff-pre">
          ${parts.length > 0
            ? parts.map(
                (part) => html`
                  <span class="diff-${part.type}">${escapeHtml(part.text)}</span>
                `,
              )
            : html`<span class="diff-empty">${escapeHtml(display)}</span>`}
        </pre>
      </section>
    `;
  }

  override render() {
    if (!this.item) {
      return html`
        <div class="empty">
          <p>Select a result row to inspect differences.</p>
          <p class="hint">Changed text is highlighted like a Git diff.</p>
        </div>
      `;
    }

    const item = this.item;
    const status = statusLabel(item.status);

    return html`
      <div class="diff-details">
        <header class="diff-header">
          <div>
            <p class="diff-title">${item.name}</p>
            <p class="hint">${item.id}</p>
          </div>
          <span class="badge status-${status.toLowerCase()}">${status}</span>
        </header>

        <dl class="meta-grid">
          <div>
            <dt>Type</dt>
            <dd>${item.contentType ?? "—"}</dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>${item.path ?? "—"}</dd>
          </div>
          <div>
            <dt>Culture</dt>
            <dd>${item.culture ?? "—"}</dd>
          </div>
          <div>
            <dt>Summary</dt>
            <dd>${item.differenceSummary ?? "—"}</dd>
          </div>
        </dl>

        <div class="diff-columns">
          ${this.#renderDiffSide(
            "Environment A",
            item.environmentAValue,
            "left",
            item.environmentBValue,
          )}
          ${this.#renderDiffSide(
            "Environment B",
            item.environmentBValue,
            "right",
            item.environmentAValue,
          )}
        </div>
      </div>
    `;
  }

  static override readonly styles = [
    css`
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
    `,
  ];
}

export default EnvCompareDiffPanelElement;

declare global {
  interface HTMLElementTagNameMap {
    "envcompare-diff-panel": EnvCompareDiffPanelElement;
  }
}
