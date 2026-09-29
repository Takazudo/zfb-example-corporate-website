import { defineConfig } from "@takazudo/zfb/config";

// Corporate-website demo: styled entirely with CSS Modules (*.module.css)
// plus one global token sheet. `wind: false` turns off zfb's built-in
// zudo-wind utility engine, so the emitted stylesheet is only the authored
// CSS — no utility layer and no reset beyond the one in styles/global.css.
export default defineConfig({
  base: "/",
  wind: false,
});
