// Contrato de Leitura Genérico
export interface IReadRepository<T> {
	findAll: () => Promise<T[]>;
	findById: (id: string) => Promise<T | null>;
}

// Contrato de Escrita Genérico
export interface IWriteRepository<T> {
	create: (data: Partial<T>) => Promise<T | null>;
	update: (id: string, data: Partial<T>) => Promise<T | null>;
	delete: (id: string) => Promise<boolean>;
}

// Combinação (Repository Completo)
export type IRepository<T> = IReadRepository<T> & IWriteRepository<T>;
