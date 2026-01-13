export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","svelte.svg","tauri.svg","vite.svg"]),
	mimeTypes: {".png":"image/png",".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.CqXIEAVu.js",app:"_app/immutable/entry/app.DGiuN6Ir.js",imports:["_app/immutable/entry/start.CqXIEAVu.js","_app/immutable/chunks/6fZJjxhc.js","_app/immutable/chunks/3dYk9t86.js","_app/immutable/chunks/wAEPIm5X.js","_app/immutable/entry/app.DGiuN6Ir.js","_app/immutable/chunks/3dYk9t86.js","_app/immutable/chunks/RFUBN4CG.js","_app/immutable/chunks/CRIM0Y84.js","_app/immutable/chunks/wAEPIm5X.js","_app/immutable/chunks/Qi2aA18Y.js","_app/immutable/chunks/CifscWXp.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
