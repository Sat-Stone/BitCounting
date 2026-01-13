

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.fe2WFEtu.js","_app/immutable/chunks/CRIM0Y84.js","_app/immutable/chunks/3dYk9t86.js","_app/immutable/chunks/DxVck5LP.js","_app/immutable/chunks/CifscWXp.js"];
export const stylesheets = [];
export const fonts = [];
