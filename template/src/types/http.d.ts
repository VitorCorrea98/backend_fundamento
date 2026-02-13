import "node:http";

declare module "node:http" {
	interface IncomingMessage {
		params?: Record<string, string>; // Para guardar IDs da URL
		userId?: string; // Para futuras implementações de Auth
	}
}
