import styles from "./about.module.css";

const PRINCIPLES = [
  {
    title: "Small teams, senior people",
    body: "No layers of account managers. The people who scope your work are the people who do it.",
  },
  {
    title: "Evidence over opinion",
    body: "Every decision ties back to a metric or a user signal. We instrument first, then iterate.",
  },
  {
    title: "Build to hand over",
    body: "Typed, tested, documented code your in-house team can own the day we step back.",
  },
];

const TIMELINE = [
  { year: "2016", text: "Founded by three engineers in Seattle." },
  { year: "2019", text: "Grew to a 20-person product team." },
  { year: "2022", text: "Opened a remote-first European practice." },
  { year: "2025", text: "120+ products shipped across 6 industries." },
];

export default function About() {
  return (
    <section class={styles.section} id="about">
      <div class={styles.inner}>
        <div class={styles.lead}>
          <p class={styles.eyebrow}>Who we are</p>
          <h2 class={styles.heading}>A studio built around accountability</h2>
          <p class={styles.body}>
            Northwind Studio started in 2016 with a simple frustration: too many
            digital projects shipped late, over budget, and missing the point.
            We set out to build a studio where senior practitioners stay on the
            tools and own the outcome.
          </p>
          <p class={styles.body}>
            Today we are a cross-functional team of strategists, designers, and
            engineers working as one pod per client — close enough to move fast,
            disciplined enough to be trusted with the hard problems.
          </p>

          <ul class={styles.principles}>
            {PRINCIPLES.map((principle) => (
              <li class={styles.principle} key={principle.title}>
                <span class={styles.principleMark} aria-hidden="true" />
                <div>
                  <h3 class={styles.principleTitle}>{principle.title}</h3>
                  <p class={styles.principleBody}>{principle.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside class={styles.timelineCard} aria-label="Company milestones">
          <h3 class={styles.timelineHeading}>Milestones</h3>
          <ol class={styles.timeline}>
            {TIMELINE.map((item) => (
              <li class={styles.milestone} key={item.year}>
                <span class={styles.milestoneYear}>{item.year}</span>
                <span class={styles.milestoneText}>{item.text}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
