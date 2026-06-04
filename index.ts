import app from "./src/index";

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

export default {
  port,
  hostname: host,
  fetch: app.fetch,
};