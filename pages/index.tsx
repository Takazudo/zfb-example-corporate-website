import DefaultLayout from "../layouts/default";
import Hero from "../components/hero/hero";
import Services from "../components/services/services";
import About from "../components/about/about";
import Contact from "../components/contact/contact";

export default function HomePage() {
  return (
    <DefaultLayout>
      <Hero />
      <Services />
      <About />
      <Contact />
    </DefaultLayout>
  );
}
