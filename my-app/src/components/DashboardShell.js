'use client';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import './DashboardShell.css';

/**
 * Keeps the active dashboard section in the URL hash so that refresh,
 * back/forward and shared links land on the same section.
 *
 *   const [section, setSection] = useHashSection('overview', isValid, revalidateKey);
 *
 * revalidateKey: change it when the set of valid sections changes (e.g. once the
 * user or gating data has loaded) so the hash is re-checked.
 */
export function useHashSection(defaultId, isValid = () => true, revalidateKey = '') {
  const [active, setActive] = useState(defaultId);

  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      setActive(id && isValid(id) ? id : defaultId);
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
    // isValid is intentionally excluded: callers pass inline functions and
    // signal changes through revalidateKey instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultId, revalidateKey]);

  const navigate = useCallback((id) => {
    setActive(id);
    if (typeof window !== 'undefined' && window.location.hash !== `#${id}`) {
      window.history.pushState(null, '', `#${id}`);
    }
  }, []);

  return [active, navigate];
}

/**
 * Shared layout for every role dashboard.
 *
 * navGroups: [{ label?: string, items: [{ id, label, icon?, badge?, onClick?, tone?, disabled?, hidden? }] }]
 *   - Items without onClick navigate to their `id`.
 *   - Items with onClick run an action (e.g. switching databases) instead.
 *   - tone: 'warning' highlights an item.
 */
export default function DashboardShell({
  title,
  user,
  navGroups,
  activeId,
  onNavigate,
  banner = null,
  sidebarNotice = null,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer with Escape and lock background scroll while open.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  // Scroll content back to the top when switching sections.
  useEffect(() => {
    document.getElementById('ds-main')?.scrollTo?.({ top: 0 });
  }, [activeId]);

  const handleItem = (item) => {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    else onNavigate(item.id);
    setDrawerOpen(false);
  };

  return (
    <div className={`ds-root ${drawerOpen ? 'ds-drawer-open' : ''}`}>
      <Navbar
        title={title}
        user={user}
        onToggleSidebar={() => setDrawerOpen((open) => !open)}
        sidebarOpen={drawerOpen}
      />

      {banner}

      <div className="ds-body">
        <div
          className="ds-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        <aside className="ds-sidebar" id="ds-sidebar" aria-label="Dashboard navigation">
          <nav className="ds-nav">
            {navGroups.map((group, gi) => {
              const items = group.items.filter((item) => !item.hidden);
              if (items.length === 0) return null;
              return (
                <div className="ds-nav-group" key={group.label || gi}>
                  {group.label && <div className="ds-nav-group-label">{group.label}</div>}
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.onClick && activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={[
                          'ds-nav-item',
                          isActive && 'is-active',
                          item.tone && `is-${item.tone}`,
                        ].filter(Boolean).join(' ')}
                        aria-current={isActive ? 'page' : undefined}
                        disabled={item.disabled}
                        onClick={() => handleItem(item)}
                      >
                        {Icon && <Icon className="ds-nav-icon" size={18} strokeWidth={2} aria-hidden="true" />}
                        <span className="ds-nav-label">{item.label}</span>
                        {item.badge ? <span className="ds-nav-badge">{item.badge}</span> : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {sidebarNotice && <div className="ds-sidebar-notice">{sidebarNotice}</div>}

          <div className="ds-sidebar-footer">
            <p>© {new Date().getFullYear()} Smart Village Revolution</p>
            <p>Designed &amp; developed by Nischal Singana · ZeroOne CodeClub</p>
          </div>
        </aside>

        <main className="ds-main dashboard-main" id="ds-main">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Friendly full-panel state for empty / error / locked sections. */
export function DashboardState({ icon: Icon, title, message, action, tone = 'neutral' }) {
  return (
    <div className={`ds-state is-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {Icon && (
        <div className="ds-state-icon">
          <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
