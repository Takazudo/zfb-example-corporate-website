import styles from "./site-footer.module.css";

const COLUMNS = [
  {
    title: "Studio",
    links: [
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Work",
    links: [
      { label: "Case studies", href: "#services" },
      { label: "Industries", href: "#services" },
      { label: "Process", href: "#about" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer class={styles.footer}>
      <div class={styles.inner}>
        <div class={styles.brandColumn}>
          <a class={styles.brand} href="#main">
            <span class={styles.mark} aria-hidden="true">
              N
            </span>
            Northwind Studio
          </a>
          <p class={styles.tagline}>
            A product engineering partner for teams that measure what they ship.
          </p>
        </div>

        <nav class={styles.columns} aria-label="Footer">
          {COLUMNS.map((column) => (
            <div class={styles.column} key={column.title}>
              <h3 class={styles.columnTitle}>{column.title}</h3>
              <ul class={styles.linkList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a class={styles.link} href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div class={styles.baseline}>
        <p class={styles.copyright}>
          © {year} Northwind Studio. A demo site built with zfb + CSS Modules.
        </p>
        <p class={styles.legal}>Privacy · Terms</p>
      </div>
    </footer>
  );
}
