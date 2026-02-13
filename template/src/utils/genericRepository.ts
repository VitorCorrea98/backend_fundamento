// src/infra/shared/SupabaseRepositoryFactory.ts

import type { IRepository } from "../core/ORM/ORMTypes";
import { getSupabaseClient } from "../infra/Supabase/SupabaseConnection";

const supabase = getSupabaseClient();

interface RepositoryConfig {
	tableName: string;
	primaryKey: string;
}

export const makeSupabaseRepository = <T>(
	config: RepositoryConfig,
): IRepository<T> => {
	return {
		findAll: async () => {
			const { data } = await supabase.from(config.tableName).select("*");
			return data as T[];
		},

		findById: async (id) => {
			const { data } = await supabase
				.from(config.tableName)
				.select("*")
				.eq(config.primaryKey, id)
				.single();

			return data as T;
		},

		create: async (row) => {
			const { data, error } = await supabase
				.from(config.tableName)
				.insert(row)
				.select("*")
				.single();

			if (error || !data) return null;
			return data as T;
		},

		update: async (id: string, row: Partial<T>) => {
			const { data, error } = await supabase
				.from(config.tableName)
				.update(row)
				.eq(config.primaryKey, id)
				.select("*")
				.single();

			console.log({ data, error });

			if (error || !data) return null;
			return data as T;
		},

		delete: async (id: string) => {
			const { error } = await supabase
				.from(config.tableName)
				.delete()
				.eq(config.primaryKey, id);

			return !error;
		},
	};
};
