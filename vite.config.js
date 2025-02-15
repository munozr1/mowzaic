import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE');


  return {
    root: "src",
    define: {
      __APP_ENV__: JSON.stringify(env),
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(env.VITE_MAPBOX_TOKEN),
    },
  };
});

