import { httpRouter } from "convex/server";
import { registerRoutes } from "@autosend/convex";
import { components } from "./_generated/api";

const http = httpRouter();
registerRoutes(http, components.autosend);

export default http;
