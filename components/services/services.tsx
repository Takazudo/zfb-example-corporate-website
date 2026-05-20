import styles from "./services.module.css";

type Service = {
  badge: string;
  title: string;
  body: string;
  points: string[];
};

const SERVICES: Service[] = [
  {
    badge: "01",
    title: "Product strategy",
    body: "We pressure-test the idea before a line of code is written — market signals, user research, and a roadmap your stakeholders can actually fund.",
    points: ["Discovery sprints", "Roadmapping", "Success metrics"],
  },
  {
    badge: "02",
    title: "Design systems",
    body: "Interfaces that scale: a token-driven design system, accessible by default, documented so every team ships a consistent product.",
    points: ["UI & interaction design", "Component libraries", "Accessibility audits"],
  },
  {
    badge: "03",
    title: "Engineering",
    body: "Senior engineers who own delivery end to end — typed front ends, resilient APIs, and deploys you trust on a Friday afternoon.",
    points: ["Web & mobile builds", "Platform & APIs", "CI/CD and observability"],
  },
  {
    badge: "04",
    title: "Scale & support",
    body: "Once it ships we stay close — performance work, growth experiments, and an on-call partnership that keeps the product healthy.",
    points: ["Performance tuning", "Growth experiments", "Managed maintenance"],
  },
];

export default function Services() {
  return (
    <section class={styles.section} id="services">
      <div class={styles.inner}>
        <header class={styles.head}>
          <p class={styles.eyebrow}>What we do</p>
          <h2 class={styles.heading}>One partner, the whole product lifecycle</h2>
          <p class={styles.intro}>
            Most agencies hand you a deliverable and disappear. We stay
            accountable from the first whiteboard sketch to the metrics review
            six months after launch.
          </p>
        </header>

        <ul class={styles.grid}>
          {SERVICES.map((service) => (
            <li class={styles.card} key={service.badge}>
              <span class={styles.badge}>{service.badge}</span>
              <h3 class={styles.cardTitle}>{service.title}</h3>
              <p class={styles.cardBody}>{service.body}</p>
              <ul class={styles.points}>
                {service.points.map((point) => (
                  <li class={styles.point} key={point}>
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
