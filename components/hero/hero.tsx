import styles from "./hero.module.css";

const STATS = [
  { value: "120+", label: "Products shipped" },
  { value: "9 yrs", label: "Average team tenure" },
  { value: "4.9/5", label: "Client satisfaction" },
];

export default function Hero() {
  return (
    <section class={styles.hero}>
      <div class={styles.inner}>
        <div class={styles.copy}>
          <p class={styles.eyebrow}>Product engineering partner</p>
          <h1 class={styles.title}>
            We build digital products that <em class={styles.accent}>earn their keep</em>.
          </h1>
          <p class={styles.lede}>
            Northwind Studio pairs senior engineers with product strategists and
            designers, so the thing you ship is the thing your customers actually
            needed — measured, not guessed.
          </p>

          <div class={styles.actions}>
            <a class={styles.primary} href="#contact">
              Start a project
            </a>
            <a class={styles.secondary} href="#services">
              See how we work
            </a>
          </div>

          <dl class={styles.stats}>
            {STATS.map((stat) => (
              <div class={styles.stat} key={stat.label}>
                <dt class={styles.statValue}>{stat.value}</dt>
                <dd class={styles.statLabel}>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div class={styles.panel} aria-hidden="true">
          <div class={styles.panelGlow} />
          <div class={styles.card}>
            <span class={styles.cardTag}>Roadmap</span>
            <p class={styles.cardTitle}>Q3 — Checkout rebuild</p>
            <div class={styles.progressTrack}>
              <div class={styles.progressFill} />
            </div>
            <p class={styles.cardMeta}>On track · 68% complete</p>
          </div>
          <div class={styles.cardAlt}>
            <span class={styles.cardTag}>Outcome</span>
            <p class={styles.bigNumber}>+34%</p>
            <p class={styles.cardMeta}>Conversion lift, first release</p>
          </div>
        </div>
      </div>
    </section>
  );
}
