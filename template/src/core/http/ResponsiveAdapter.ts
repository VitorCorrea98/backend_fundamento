import type { ServerResponse } from "node:http";
import { sendJson } from "../../utils/http"; // Assumindo que seu sendJson está aqui
import { HTTP_STATUS, type TServiceResponse } from "./HttpType";

/**
 * Esta função é o CORAÇÃO da sua refatoração.
 * Ela desacopla o Controller da necessidade de saber qual método HTTP chamar.
 */
export const handleServiceResponse = <T>(
	res: ServerResponse,
	result: TServiceResponse<T>,
): void => {
	// 1. Mapeia a String (ex: "NOT_FOUND") para o Número (ex: 404)
	// O TypeScript garante que result.status existe dentro de HTTP_STATUS
	const statusCode = HTTP_STATUS[result.status];

	// 2. Envia a resposta usando sua função base
	sendJson(res, statusCode, result.data);
};
