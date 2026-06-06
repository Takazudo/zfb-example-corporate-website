import { defineConfig } from "@takazudo/zfb/config";

// Corporate-website demo: styled entirely with CSS Modules (*.module.css)
// plus one global token sheet — Tailwind is intentionally disabled.
// (tailwind.enabled:false requires zfb >= 0.1.0-next.31; earlier versions
// dropped all authored CSS with this flag — zfb#824.)
export default defineConfig({
  framework: "preact",
  base: "/",
  tailwind: { enabled: false },
});
