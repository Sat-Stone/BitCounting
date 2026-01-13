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
		client: {start:"_app/immutable/entry/start.BIcqQ8Xv.js",app:"_app/immutable/entry/app.BCHByTAF.js",imports:["_app/immutable/entry/start.BIcqQ8Xv.js","_app/immutable/chunks/GRJQHiqT.js","_app/immutable/chunks/CpRHF_J6.js","_app/immutable/chunks/BllFAqDe.js","_app/immutable/entry/app.BCHByTAF.js","_app/immutable/chunks/CpRHF_J6.js","_app/immutable/chunks/CwfX5RAp.js","_app/immutable/chunks/DBc14fdn.js","_app/immutable/chunks/BllFAqDe.js","_app/immutable/chunks/DFbZmBis.js","_app/immutable/chunks/BzEoO9uo.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
