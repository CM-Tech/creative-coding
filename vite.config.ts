import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import glslPlugin from "vite-plugin-glsl";

export default defineConfig({
  plugins: [solidPlugin(), glslPlugin()],
});
