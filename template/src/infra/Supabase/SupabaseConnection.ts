import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../../utils/env";

const Env = getEnv();

export const getSupabaseClient = () => {
	return createClient(Env.SUPABASE_URL, Env.SUPABASE_KEY);
};
