import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header class={styles.header}>
      <div class={styles.inner}>
        <a class={styles.brand} href="#main" aria-label="Northwind Studio home">
          <span class={styles.mark} aria-hidden="true">
            N
          </span>
          <span class={styles.wordmark}>Northwind Studio</span>
        </a>

        <nav class={styles.nav} aria-label="Primary">
          <ul class={styles.navList}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a class={styles.navLink} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a class={styles.cta} href="#contact">
          Start a project
        </a>
      </div>
    </header>
  );
}
