const ROLE_ALIASES = {
  admin: "admin",
  administrator: "admin",
  project_manager: "project_manager",
  "project manager": "project_manager",
  projectmanager: "project_manager",
  team_member: "team_member",
  "team member": "team_member",
  teammember: "team_member",
  sales_finance: "sales_finance",
  "sales finance": "sales_finance",
  "sales & finance": "sales_finance",
  salesfinance: "sales_finance",
};

export function normalizeRole(role) {
  if (!role || typeof role !== "string") return null;

  const normalizedInput = role.trim().toLowerCase().replace(/-/g, "_");
  if (ROLE_ALIASES[normalizedInput]) return ROLE_ALIASES[normalizedInput];

  const compacted = normalizedInput.replace(/[\s_]+/g, " ").trim();
  return ROLE_ALIASES[compacted] ?? normalizedInput;
}

export const ROLE_ROUTE_PREFIX = {
  admin: "/admin",
  project_manager: "/project_manager",
  team_member: "/team_member",
  sales_finance: "/sales_finance",
};
