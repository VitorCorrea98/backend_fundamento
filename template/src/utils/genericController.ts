import type { IncomingMessage, ServerResponse } from "node:http";
import type { ICrudService } from "../core/http/HttpType";
import { handleServiceResponse } from "../core/http/ResponsiveAdapter";
import { failure } from "../core/services/ServiceResult";
import { parseBody } from "./http";

// Helper para extrair ID de URLs do tipo /recurso/:id
const extractId = (url?: string): string | null => {
	if (!url) return null;
	const parts = url.split("/");
	const lastPart = parts[parts.length - 1];
	return lastPart && lastPart !== "" ? lastPart : null;
};

/**
 * Controller Genérico Funcional.
 * Respeita o SOLID ao depender da interface ICrudService, não de implementações concretas.
 */
export const createGenericController = <T, DTO>(
	service: ICrudService<T, DTO>,
	validate?: (data: unknown) => data is DTO,
) => {
	return {
		getAll: async (_req: IncomingMessage, res: ServerResponse) => {
			const result = await service.findAll();
			return handleServiceResponse(res, result);
		},

		getById: async (req: IncomingMessage, res: ServerResponse) => {
			const id = extractId(req.url);
			if (!id)
				return handleServiceResponse(
					res,
					failure("BAD_REQUEST", "ID is required"),
				);

			const result = await service.findById(id);
			return handleServiceResponse(res, result);
		},

		create: async (req: IncomingMessage, res: ServerResponse) => {
			try {
				const body = await parseBody<DTO>(req);
				if (validate && !validate(body)) {
					return handleServiceResponse(
						res,
						failure("BAD_REQUEST", "Request inválido"),
					);
				}
				const result = await service.create(body);
				return handleServiceResponse(res, result);
			} catch (_err) {
				return handleServiceResponse(
					res,
					failure("BAD_REQUEST", "Invalid JSON body"),
				);
			}
		},

		update: async (req: IncomingMessage, res: ServerResponse) => {
			const id = extractId(req.url);
			if (!id)
				return handleServiceResponse(
					res,
					failure("BAD_REQUEST", "ID is required"),
				);

			let body: DTO;

			// 1. Separa o Parser
			try {
				body = await parseBody<DTO>(req);
			} catch (_err) {
				return handleServiceResponse(
					res,
					failure("BAD_REQUEST", "Invalid JSON format"),
				);
			}

			// 2. Executa o Update e loga o erro real se estourar
			try {
				const result = await service.update(id, body);
				return handleServiceResponse(res, result);
			} catch (error) {
				// AQUI VAI APARECER O SEU ERRO REAL NO TERMINAL
				console.error("Update Service Error:", error);
				return handleServiceResponse(
					res,
					failure("INTERNAL_SERVER_ERROR", "Error executing update service"),
				);
			}
		},

		delete: async (req: IncomingMessage, res: ServerResponse) => {
			const id = extractId(req.url);
			if (!id)
				return handleServiceResponse(
					res,
					failure("BAD_REQUEST", "ID is required"),
				);

			const result = await service.delete(id);
			return handleServiceResponse(res, result);
		},
	};
};

export const extendController = <T, DTO, TSpecific>(
	service: ICrudService<T, DTO>,
	specificFactory: (service: any) => TSpecific,
	validate?: (data: any) => data is DTO,
) => {
	const generic = createGenericController(service, validate);
	const specific = specificFactory(service);

	return {
		...generic,
		...specific,
	};
};
