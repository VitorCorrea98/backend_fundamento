import path from "node:path";
import dotenv from "dotenv";

export interface IEnv {
	SUPABASE_URL: string;
	SUPABASE_KEY: string;
}

dotenv.config({ path: path.resolve(process.cwd(), "./.env") });

const validateEnvKey = (key: keyof IEnv) => {
	const envKey = process.env[key];

	if (!envKey) {
		throw new Error(`${key} NOT FOUND IN .env`);
	}

	return envKey;
};

export const getEnv = (): IEnv => ({
	SUPABASE_KEY: validateEnvKey("SUPABASE_KEY"),
	SUPABASE_URL: validateEnvKey("SUPABASE_URL"),
});
