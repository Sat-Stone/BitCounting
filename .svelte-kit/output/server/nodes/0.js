

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.BHKYyWLp.js","_app/immutable/chunks/DBc14fdn.js","_app/immutable/chunks/CpRHF_J6.js","_app/immutable/chunks/jUeHQVEq.js","_app/immutable/chunks/BzEoO9uo.js"];
export const stylesheets = [];
export const fonts = [];
