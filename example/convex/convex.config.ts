import { defineApp } from "convex/server";
import autosend from "@autosend/convex/convex.config.js";

const app = defineApp();
app.use(autosend, { name: "autosend" });

export default app;
