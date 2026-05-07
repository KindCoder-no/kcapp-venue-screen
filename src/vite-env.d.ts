/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_KCAPP_API_BASE?: string;
	readonly VITE_KCAPP_SOCKET_URL?: string;
	readonly VITE_KCAPP_VENUE_LIST_URL?: string;
	readonly VITE_KCAPP_BASIC_AUTH_USERNAME?: string;
	readonly VITE_KCAPP_BASIC_AUTH_PASSWORD?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
