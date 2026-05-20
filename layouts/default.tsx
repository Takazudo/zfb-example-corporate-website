import type { ComponentChildren } from "preact";

import "../styles/global.css";
import SiteHeader from "../components/header/site-header";
import SiteFooter from "../components/footer/site-footer";

type Props = {
  title?: string;
  description?: string;
  children: ComponentChildren;
};

const DEFAULT_TITLE = "Northwind Studio — product engineering partner";
const DEFAULT_DESCRIPTION =
  "Northwind Studio designs, builds, and scales digital products for ambitious teams. Strategy, engineering, and design under one roof.";

/**
 * The single shared chrome for the corporate site. It is a plain server
 * component — the whole demo is statically rendered, so no islands and no
 * client JS ship to the browser.
 */
export default function DefaultLayout({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  children,
}: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <meta name="color-scheme" content="light" />
        <title>{title}</title>
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
