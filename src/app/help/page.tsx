"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  SUPPORT_EMAIL,
  searchArticles,
  type HelpCategory,
} from "@/lib/help/catalog";
import { RaiseTicketButton, TicketFloatingAction } from "@/components/tickets";
import styles from "./help.module.css";

const ALL = "all";

const PATH = [
  { step: "1", slug: "first-hour", label: "Set up the workspace" },
  { step: "2", slug: "install-widget", label: "Put chat on the website" },
  { step: "3", slug: "take-over-chat", label: "Take over a live chat" },
] as const;

export default function HelpHubPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);

  const filtered = useMemo(() => searchArticles(search), [search]);
  const searching = search.trim().length > 0;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const art of HELP_ARTICLES) {
      map.set(art.category, (map.get(art.category) || 0) + 1);
    }
    return map;
  }, []);

  const visibleCategories = useMemo(() => {
    if (searching) {
      return HELP_CATEGORIES.filter((cat) => filtered.some((a) => a.category === cat.id));
    }
    if (categoryId === ALL) return HELP_CATEGORIES;
    return HELP_CATEGORIES.filter((cat) => cat.id === categoryId);
  }, [searching, categoryId, filtered]);

  const pathRows = PATH.map((item) => {
    const article = HELP_ARTICLES.find((a) => a.slug === item.slug);
    return article ? { ...item, article } : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);

  const activeCategory: HelpCategory | undefined =
    !searching && categoryId !== ALL
      ? HELP_CATEGORIES.find((c) => c.id === categoryId)
      : undefined;

  return (
    <AppShell
      title="Help"
      subtitle="Guides grouped by the screens in this workspace."
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/tickets">
            <Button variant="ghost" size="sm">
              View Tickets
            </Button>
          </Link>
          <RaiseTicketButton label="Raise Ticket" size="sm" />
        </div>
      }
      requires="dashboard:view"
    >


      <div className={styles.page}>
        <div className={styles.searchBox}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search guides"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) setCategoryId(ALL);
            }}
            aria-label="Search help"
          />
        </div>

        {searching && filtered.length === 0 ? (
          <PageState
            icon="search_off"
            title="No matching guides"
            description="Try another word, or email us — include your company name."
            action={
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setSearch("")}>
                  Clear search
                </Button>
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  <Button>Email support</Button>
                </a>
              </div>
            }
          />
        ) : (
          <div className={styles.layout}>
            <nav className={styles.catNav} aria-label="Help categories">
              <p className={styles.navLabel}>Topics</p>
              <button
                type="button"
                className={`${styles.navItem} ${!searching && categoryId === ALL ? styles.navItemActive : ""}`}
                onClick={() => {
                  setCategoryId(ALL);
                  setSearch("");
                }}
                aria-current={!searching && categoryId === ALL ? "page" : undefined}
              >
                <span>All guides</span>
                <span className={styles.navCount}>{HELP_ARTICLES.length}</span>
              </button>
              {HELP_CATEGORIES.map((cat) => {
                const n = counts.get(cat.id) || 0;
                if (n === 0) return null;
                const active = !searching && categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setSearch("");
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.navName}>
                      <span className={`material-symbols-outlined ${styles.navIcon}`}>{cat.icon}</span>
                      {cat.name}
                    </span>
                    <span className={styles.navCount}>{n}</span>
                  </button>
                );
              })}
            </nav>

            <div className={styles.main}>
              {!searching && categoryId === ALL ? (
                <ol className={styles.path} aria-label="Recommended order">
                  {pathRows.map((row) => (
                    <li key={row.slug}>
                      <Link href={`/help/guides/${row.slug}`} className={styles.pathLink}>
                        <span className={styles.pathStep}>{row.step}</span>
                        <span className={styles.pathBody}>
                          <span className={styles.pathLabel}>{row.label}</span>
                          <span className={styles.pathTitle}>{row.article.title}</span>
                        </span>
                        <span className={styles.pathMeta}>{row.article.minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : null}

              {searching ? (
                <header className={styles.mainHead}>
                  <h2 className={styles.mainTitle}>Search results</h2>
                  <p className={styles.mainDesc}>
                    {filtered.length} guide{filtered.length === 1 ? "" : "s"} matching “{search.trim()}”
                  </p>
                </header>
              ) : activeCategory ? (
                <header className={styles.mainHead}>
                  <h2 className={styles.mainTitle}>{activeCategory.name}</h2>
                  <p className={styles.mainDesc}>{activeCategory.description}</p>
                </header>
              ) : (
                <header className={styles.mainHead}>
                  <h2 className={styles.mainTitle}>All guides</h2>
                  <p className={styles.mainDesc}>Pick a topic on the left, or open a guide below.</p>
                </header>
              )}

              {visibleCategories.map((cat) => {
                const articles = filtered.filter((a) => a.category === cat.id);
                if (articles.length === 0) return null;
                const showGroupHead = searching || categoryId === ALL;
                return (
                  <section key={cat.id} className={styles.group}>
                    {showGroupHead ? (
                      <div className={styles.groupHead}>
                        <h3 className={styles.groupTitle}>{cat.name}</h3>
                        <span className={styles.groupCount}>{articles.length}</span>
                      </div>
                    ) : null}
                    <ul className={styles.rows}>
                      {articles.map((art) => (
                        <li key={art.slug}>
                          <Link href={`/help/guides/${art.slug}`} className={styles.row}>
                            <span className={styles.rowTitle}>{art.title}</span>
                            <span className={styles.rowMeta}>{art.minutes} min</span>
                            <span className={`material-symbols-outlined ${styles.rowArrow}`}>
                              chevron_right
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.supportBox}>
          <div className={styles.supportCopy}>
            <h3>Need a person or technical assistance?</h3>
            <p>
              Submit a support ticket for technical or account inquiries, or email {SUPPORT_EMAIL} directly with your workspace name.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <RaiseTicketButton label="Raise a Ticket" size="md" />
            <Link href="/tickets">
              <Button variant="ghost">View My Tickets</Button>
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Frosty%20help`}>
              <Button variant="ghost">Email support</Button>
            </a>
          </div>
        </div>
      </div>
      <TicketFloatingAction />
    </AppShell>
  );
}


