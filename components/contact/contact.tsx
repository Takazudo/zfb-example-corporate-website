import styles from "./contact.module.css";

const CHANNELS = [
  { label: "Email", value: "hello@northwind.studio", href: "mailto:hello@northwind.studio" },
  { label: "Phone", value: "+1 (206) 555-0142", href: "tel:+12065550142" },
  { label: "Studio", value: "412 Pike Street, Seattle WA", href: null },
];

export default function Contact() {
  return (
    <section class={styles.section} id="contact">
      <div class={styles.inner}>
        <div class={styles.copy}>
          <p class={styles.eyebrow}>Let's talk</p>
          <h2 class={styles.heading}>Tell us what you're building</h2>
          <p class={styles.body}>
            Send a few lines about your product and timeline. You will hear back
            from a senior member of the team within one business day — no sales
            funnel, no scripted demo.
          </p>

          <ul class={styles.channels}>
            {CHANNELS.map((channel) => (
              <li class={styles.channel} key={channel.label}>
                <span class={styles.channelLabel}>{channel.label}</span>
                {channel.href ? (
                  <a class={styles.channelValue} href={channel.href}>
                    {channel.value}
                  </a>
                ) : (
                  <span class={styles.channelValue}>{channel.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form class={styles.form} action="#" method="post">
          <div class={styles.field}>
            <label class={styles.label} for="contact-name">
              Name
            </label>
            <input
              class={styles.input}
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jordan Avery"
              required
            />
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="contact-email">
              Work email
            </label>
            <input
              class={styles.input}
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jordan@company.com"
              required
            />
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="contact-project">
              About the project
            </label>
            <textarea
              class={styles.textarea}
              id="contact-project"
              name="project"
              rows={4}
              placeholder="What are you building, and what does success look like?"
              required
            />
          </div>

          <button class={styles.submit} type="submit">
            Send the brief
          </button>
          <p class={styles.note}>
            This demo form is static — submissions are not stored.
          </p>
        </form>
      </div>
    </section>
  );
}
