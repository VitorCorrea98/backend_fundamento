/**
 * 1. Definimos os objetos com 'as const'.
 * Isso torna as propriedades READONLY e transforma os valores em TIPOS LITERAIS.
 * Ex: OK não é 'number', ele é literalmente o número '200'.
 */

export const HTTP_SUCCESS = {
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NO_CONTENT: 204,
	PARTIAL_CONTENT: 206,
} as const;

export type THttpSuccessKeys = keyof typeof HTTP_SUCCESS;

export const HTTP_ERROR = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504,
} as const;

export type THttpErrorKeys = keyof typeof HTTP_ERROR;

// Unimos tudo num objeto único para facilidade de acesso geral, se precisar
export const HTTP_STATUS = {
	...HTTP_SUCCESS,
	...HTTP_ERROR,
} as const;

// ------------------------------------------------------------------
// 2. Extração de Tipos (Mágica do TypeScript)
// ------------------------------------------------------------------

// Extrai as chaves (ex: "OK" | "CREATED" | "NOT_FOUND")
export type THttpStatusKey = keyof typeof HTTP_STATUS;

// Extrai os valores (ex: 200 | 201 | 404 | 500)
// Lê-se: "Pegue o tipo do objeto HTTP_STATUS, e olhe para as chaves dele"
export type THttpStatusCode = (typeof HTTP_STATUS)[THttpStatusKey];

// Se quiser ser específico para Sucesso ou Erro:
export type THttpSuccessCode = (typeof HTTP_SUCCESS)[keyof typeof HTTP_SUCCESS];
export type THttpErrorCode = (typeof HTTP_ERROR)[keyof typeof HTTP_ERROR];

export type TServiceGoodResult<T> = { status: THttpSuccessKeys; data: T };
export type TServiceErrorResult = {
	status: THttpErrorKeys;
	data: { message: string };
};

export type TServiceResponse<T> = TServiceGoodResult<T> | TServiceErrorResult;

export interface ICrudService<T, DTO = T> {
	findAll: () => Promise<TServiceResponse<T[]>>;
	findById: (id: string) => Promise<TServiceResponse<T>>;
	create: (data: DTO) => Promise<TServiceResponse<T>>;
	update: (id: string, data: DTO) => Promise<TServiceResponse<T>>;
	delete: (id: string) => Promise<TServiceResponse<boolean | string>>;
}
