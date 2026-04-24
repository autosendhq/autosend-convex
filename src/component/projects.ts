import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  listProjects as providerListProjects,
  createProject as providerCreateProject,
  deleteProject as providerDeleteProject,
} from "./provider";
import {
  createProjectArgsValidator,
  createProjectResultValidator,
  deleteProjectResultValidator,
  listProjectsResultValidator,
  type CreateProjectResult,
  type DeleteProjectResult,
  type ListProjectsResult,
} from "./types";

export const listProjects = action({
  args: {
    apiKey: v.optional(v.string()),
  },
  returns: listProjectsResultValidator,
  handler: async (ctx, args): Promise<ListProjectsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const apiKey = args.apiKey ?? globals.autosendApiKey;
    if (!apiKey) {
      throw new Error("API key not configured. Set autosendApiKey via setConfig().");
    }

    const projects = await providerListProjects({
      apiKey,
      baseUrl: globals.autosendBaseUrl,
    });

    return { projects };
  },
});

export const createProject = action({
  args: createProjectArgsValidator,
  returns: createProjectResultValidator,
  handler: async (ctx, args): Promise<CreateProjectResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const apiKey = args.apiKey ?? globals.autosendApiKey;
    if (!apiKey) {
      throw new Error("API key not configured. Set autosendApiKey via setConfig().");
    }

    const project = await providerCreateProject(
      {
        name: args.name,
        domain: args.domain,
        regionKey: args.regionKey,
      },
      { apiKey, baseUrl: globals.autosendBaseUrl },
    );

    return { project };
  },
});

export const deleteProject = action({
  args: {
    projectId: v.string(),
    apiKey: v.optional(v.string()),
  },
  returns: deleteProjectResultValidator,
  handler: async (ctx, args): Promise<DeleteProjectResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const apiKey = args.apiKey ?? globals.autosendApiKey;
    if (!apiKey) {
      throw new Error("API key not configured. Set autosendApiKey via setConfig().");
    }

    return await providerDeleteProject(args.projectId, {
      apiKey,
      baseUrl: globals.autosendBaseUrl,
    });
  },
});
