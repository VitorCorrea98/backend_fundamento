import type {
	THttpErrorKeys,
	THttpSuccessKeys,
	TServiceResponse,
} from "../http/HttpType";

export const success = <T>(
	status: THttpSuccessKeys,
	data: T,
): TServiceResponse<T> => ({
	status,
	data,
});

// --- Factories para Erro ---
// Padroniza que todo erro tem uma 'message'
export const failure = (
	status: THttpErrorKeys,
	message: string,
): TServiceResponse<never> => ({
	status,
	data: { message },
});
