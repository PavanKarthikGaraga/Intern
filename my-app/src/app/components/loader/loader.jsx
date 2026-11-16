import "./loader.css";

/**
 * Brand loading indicator.
 * - Inline (default): centres itself inside the current content area.
 * - fullscreen: covers the viewport, for whole-page loads before any layout renders.
 *
 * Styles are namespaced (.app-loader) — the previous version styled the generic
 * `.container` class globally, which leaked onto other pages.
 */
export default function Loader({ fullscreen = false, label = "Loading…" }) {
  return (
    <div
      className={`app-loader${fullscreen ? " app-loader--fullscreen" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="app-loader__spinner" aria-hidden="true" />
      <span className="app-loader__label">{label}</span>
    </div>
  );
}
