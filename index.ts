import { Hono } from 'hono';

const app = new Hono();
app.get('/', (c) => c.text('Hello'));

export default app;

// Hanya jalankan server jika file ini dieksekusi langsung
if (import.meta.main) {
  Bun.serve({
    fetch: app.fetch,
    port: 3000,
  });
}