import { defineConfig } from "@takazudo/zfb/config";

// Corporate-website demo: styled entirely with CSS Modules (*.module.css)
// plus one global token sheet — Tailwind is intentionally disabled.
export default defineConfig({
  framework: "preact",
  base: "/",
});
