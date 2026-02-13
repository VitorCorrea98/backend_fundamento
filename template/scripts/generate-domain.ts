import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import { getSupabaseClient } from "../src/infra/Supabase/SupabaseConnection";

// ================= LEITURA DE ARGUMENTOS (CLI) ================= //
const args = process.argv.slice(2);
const domainInput = args.find((arg) => !arg.startsWith("--"));
const noDb = args.includes("--no-db");

// Captura prefixo customizado (Ex: --prefix=sistema_financeiro_) ou usa default "app_"
const prefixArg = args.find((arg) => arg.startsWith("--prefix="));
const tablePrefix = prefixArg ? prefixArg.split("=")[1] : "app_";

// Captura caminho de types customizado
const pathArg = args.find((arg) => arg.startsWith("--path="));
const customTypesPath = pathArg ? pathArg.split("=")[1] : null;

if (!domainInput) {
	console.error("❌ Por favor, forneça o nome do domínio/entidade.");
	console.error(
		"Exemplo: npm run gen CentroCusto -- --no-db --prefix=meu_sys_ --path=../web/types",
	);
	process.exit(1);
}

// ================= UTILITÁRIOS DE STRING ================= //
const toPascalCase = (str: string) =>
	str.replace(/(\w)(\w*)/g, (_, g1, g2) => g1 + g2);

const toCamelCase = (str: string) =>
	str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
			index === 0 ? word.toLowerCase() : word.toUpperCase(),
		)
		.replace(/\s+/g, "");

const toSnakeCase = (str: string) =>
	str
		.replace(/([a-z])([A-Z])/g, "$1_$2")
		.replace(/[\s-]+/g, "_")
		.toLowerCase();

// ================= CONFIGURAÇÃO DE CAMINHOS ================= //
const pascalName = toPascalCase(domainInput);
const camelName = toCamelCase(domainInput);
const snakeName = toSnakeCase(domainInput);

// Define o caminho dos types: Customizado > Padrão Antigo > Padrão Genérico
const DEFAULT_FRONT_PATH = path.resolve(process.cwd(), "../src/types");
const FRONTEND_TYPES_PATH = customTypesPath
	? path.resolve(process.cwd(), customTypesPath)
	: DEFAULT_FRONT_PATH;

const BACKEND_MODULES_PATH = path.join(process.cwd(), "src", "modules");
const MODULE_PATH = path.join(BACKEND_MODULES_PATH, pascalName);

// ================= EXECUTOR DE SQL ================= //

const executeSqlInSupabase = async (sql: string) => {
	if (noDb) return; // Segurança extra

	console.log("\n🐘 Conectando ao Supabase para criar tabela...");
	try {
		const supabase = getSupabaseClient();
		const { error } = await supabase.rpc("exec_sql", { query: sql });

		if (error) {
			console.error(`❌ Erro ao criar tabela no Supabase: ${error.message}`);
		} else {
			console.log("✅ Tabela criada/verificada com sucesso!");
		}
	} catch (err) {
		console.error("❌ Erro de conexão:", err);
	}
};

// ================= LEITURA DE TIPOS (RESILIENTE) ================= //

interface PropInfo {
	name: string;
	type: string;
	isOptional: boolean;
	isArray: boolean;
}

const findInterfaceInFrontend = (interfaceName: string): PropInfo[] | null => {
	console.log(
		`🔎 Procurando interface "${interfaceName}" em: ${FRONTEND_TYPES_PATH}...`,
	);

	// 1. Verifica se a pasta existe (sem quebrar o script)
	if (!fs.existsSync(FRONTEND_TYPES_PATH)) {
		console.warn(`⚠️  Pasta de tipos não encontrada em: ${FRONTEND_TYPES_PATH}`);
		console.warn("⚠️  Gerando domínio genérico (Skeleton Mode).");
		return null;
	}

	const project = new Project();
	project.addSourceFilesAtPaths(`${FRONTEND_TYPES_PATH}/**/*.ts`);
	const sourceFiles = project.getSourceFiles();

	for (const sourceFile of sourceFiles) {
		let iface = sourceFile.getInterface(interfaceName);
		if (!iface) iface = sourceFile.getInterface(`I${interfaceName}`);

		if (iface) {
			console.log(`✅ Interface encontrada em: ${sourceFile.getFilePath()}`);
			return iface.getProperties().map((p) => {
				const typeNode = p.getTypeNode();
				let typeName = "any";
				let isArray = false;

				if (typeNode) {
					typeName = typeNode.getText();
					if (typeName.endsWith("[]") || typeName.startsWith("Array<")) {
						isArray = true;
					}
				} else {
					typeName = p.getType().getText();
				}

				return {
					name: p.getName(),
					type: typeName,
					isOptional: p.hasQuestionToken(),
					isArray,
				};
			});
		}
	}

	console.warn(
		`⚠️  Interface "${interfaceName}" não encontrada. Usando template padrão.`,
	);
	return null;
};

// ================= GERADORES DE CONTEÚDO ================= //

const generateTypeContent = (pascalName: string, props: PropInfo[] | null) => {
	// Template Padrão (Fallback)
	if (!props) {
		return `export interface I${pascalName} {
\tid: string;
\tnome: string; // Placeholder genérico
\tativo: boolean;
\tcreatedAt: Date;
\tupdatedAt: Date;
}

export interface I${pascalName}Row {
\tid: string;
\tnome: string;
\tativo: boolean;
\tcreated_at: string;
\tupdated_at: string;
}

export interface I${pascalName}DTO {
\tnome: string;
\tativo?: boolean;
}`;
	}

	const domainProps = props
		.map((p) => `\t${p.name}${p.isOptional ? "?" : ""}: ${p.type};`)
		.join("\n");

	const rowProps = props
		.map((p) => {
			const snakeName = toSnakeCase(p.name);
			let type = p.type;
			if (type.includes("Date")) type = "string";
			if (p.isArray) type = "any[]";
			return `\t${snakeName}: ${type}${p.isOptional || p.name === "id" ? " | null" : ""};`;
		})
		.join("\n");

	const dtoProps = props
		.filter(
			(p) =>
				!["id", "createdAt", "updatedAt", "created_at", "updated_at"].includes(
					p.name,
				),
		)
		.map((p) => `\t${p.name}${p.isOptional ? "?" : ""}: ${p.type};`)
		.join("\n");

	return `export interface I${pascalName} {
${domainProps}
}

export interface I${pascalName}Row {
${rowProps}
}

export interface I${pascalName}DTO {
${dtoProps}
}`;
};

const generateUtilsContent = (pascalName: string, props: PropInfo[] | null) => {
	if (!props) {
		return `import { randomUUID } from "node:crypto";
import type { I${pascalName}, I${pascalName}DTO, I${pascalName}Row } from "./${pascalName}.type";

export const mapDTOToRow = (dto: I${pascalName}DTO, id?: string): Partial<I${pascalName}Row> => ({
\tid: id || randomUUID(),
\tnome: dto.nome,
\tativo: dto.ativo ?? true,
\tcreated_at: new Date().toISOString(),
\tupdated_at: new Date().toISOString(),
});

export const mapRowToDomain = (row: I${pascalName}Row): I${pascalName} => ({
\tid: row.id,
\tnome: row.nome,
\tativo: row.ativo,
\tcreatedAt: new Date(row.created_at),
\tupdatedAt: new Date(row.updated_at),
});`;
	}

	const dtoToRowMap = props
		.filter(
			(p) =>
				!["id", "createdAt", "updatedAt", "created_at", "updated_at"].includes(
					p.name,
				),
		)
		.map((p) => {
			const rowKey = toSnakeCase(p.name);
			let value = `dto.${p.name}`;
			if (p.name === "ativo") value = "dto.ativo ?? true";
			return `\t${rowKey}: ${value},`;
		})
		.join("\n");

	const rowToDomainMap = props
		.map((p) => {
			const rowKey = toSnakeCase(p.name);
			let value = `row.${rowKey}`;
			if (p.type.includes("Date")) value = `new Date(row.${rowKey})`;
			if (
				!p.isOptional &&
				p.type.includes("string") &&
				!p.type.includes("Date")
			)
				value = `row.${rowKey} || ""`;
			if (p.isArray) value = `row.${rowKey} ?? []`;
			return `\t${p.name}: ${value},`;
		})
		.join("\n");

	return `import { randomUUID } from "node:crypto";
import type { I${pascalName}, I${pascalName}DTO, I${pascalName}Row } from "./${pascalName}.type";

export const mapDTOToRow = (
\tdto: I${pascalName}DTO,
\tid?: string,
): Partial<I${pascalName}Row> => ({
\tid: id || randomUUID(),
${dtoToRowMap}
\tupdated_at: new Date().toISOString(),
});

export const mapRowToDomain = (row: I${pascalName}Row): I${pascalName} => ({
${rowToDomainMap}
});`;
};

// ================= GERADOR DE SQL ================= //

const generateAndRunDDL = async (
	pascalName: string,
	snakeName: string,
	props: PropInfo[] | null,
) => {
	// AQUI: Usa o prefixo dinâmico definido nos argumentos
	const tableName = `${tablePrefix}${snakeName}`;

	let columns = [];

	if (props) {
		columns = props.map((p) => {
			const colName = toSnakeCase(p.name);
			let sqlType = "TEXT";
			if (p.name === "id")
				return "  id UUID PRIMARY KEY DEFAULT gen_random_uuid()";
			if (p.type.includes("number")) sqlType = "NUMERIC";
			else if (p.type.includes("boolean")) sqlType = "BOOLEAN";
			else if (p.type.includes("Date")) sqlType = "TIMESTAMPTZ";
			else if (p.isArray) sqlType = "TEXT[]";

			let constraints = "";
			if (!p.isOptional) constraints = "NOT NULL";
			if (["created_at", "updated_at"].includes(colName))
				constraints = "NOT NULL DEFAULT now()";

			return `  ${colName} ${sqlType} ${constraints}`;
		});
	} else {
		// Colunas padrão caso não tenha props
		columns = [
			"  id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
			"  nome TEXT NOT NULL",
			"  ativo BOOLEAN DEFAULT true NOT NULL",
		];
	}

	// Garante auditoria
	if (!columns.some((c) => c.includes("created_at")))
		columns.push("  created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
	if (!columns.some((c) => c.includes("updated_at")))
		columns.push("  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");

	const sql = `CREATE TABLE IF NOT EXISTS public.${tableName} (
${columns.join(",\n")}
);

ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = '${tableName}' AND policyname = 'Permitir leitura para autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura para autenticados" ON public.${tableName}
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END
$$;`;

	console.log(`\n📜 SQL Gerado (${tableName}):\n`);
	console.log(sql);

	if (noDb) {
		console.log(
			"\n🔕 Modo --no-db ativado. SQL apenas exibido, não executado.",
		);
	} else {
		await executeSqlInSupabase(sql);
	}
};

// ================= EXECUÇÃO DE CRIAÇÃO ================= //

const createFiles = async () => {
	console.log(`🚀 Gerando módulo: ${pascalName} (Prefixo DB: ${tablePrefix})`);
	if (noDb) console.log("🔕 Database: OFF");

	// 1. Tenta buscar tipos (agora retorna null se falhar, sem crashar)
	const props = findInterfaceInFrontend(pascalName);

	// 2. Gerar Conteúdo
	const typesContent = generateTypeContent(pascalName, props);
	const utilsContent = generateUtilsContent(pascalName, props);

	// 3. Templates Estáticos (Usando tablePrefix dinamicamente)
	const repositoryContent = `import { makeSupabaseRepository } from "../../utils/genericRepository";
import type { I${pascalName}Row } from "./${pascalName}.type";

// Nome da tabela gerado dinamicamente via CLI
const TABLE_NAME = "${tablePrefix}${snakeName}";

export const ${camelName}Repo = makeSupabaseRepository<I${pascalName}Row>({
\ttableName: TABLE_NAME,
\tprimaryKey: "id",
});
`;

	const serviceContent = `import type { ICrudService } from "../../core/http/HttpType";
import type { IRepository } from "../../core/ORM/ORMTypes";
import { failure, success } from "../../core/services/ServiceResult";
import { taskFindById, taskUpdate } from "../../utils/crudTasks";
import { asyncPipe } from "../../utils/pipe";
import { chain, map, tryTask } from "../../utils/task";
import { ensureFound } from "../../utils/validator";
import type {
\tI${pascalName},
\tI${pascalName}DTO,
\tI${pascalName}Row,
} from "./${pascalName}.type";
import { mapDTOToRow, mapRowToDomain } from "./${pascalName}.utils";

export const make${pascalName}Service = (
\trepo: IRepository<I${pascalName}Row>,
): ICrudService<I${pascalName}, I${pascalName}DTO> => ({
\tfindAll: () => {
\t\treturn asyncPipe(
\t\t\ttryTask(() => repo.findAll(), "Erro ao buscar registros")(),
\t\t\tmap((rows) => rows.map(mapRowToDomain)),
\t\t);
\t},

\tfindById: (id) => {
\t\treturn asyncPipe(
\t\t\ttryTask(() => repo.findById(id), "Erro ao buscar registro")(),
\t\t\tchain((row) =>
\t\t\t\trow
\t\t\t\t\t? success("OK", row)
\t\t\t\t\t: failure("NOT_FOUND", "Registro não encontrado"),
\t\t\t),
\t\t\tmap(mapRowToDomain),
\t\t);
\t},

\tcreate: (dto) => {
\t\treturn asyncPipe(
\t\t\tsuccess("OK", dto),
\t\t\tmap(mapDTOToRow),
\t\t\tchain((row) => tryTask(() => repo.create(row), "Erro ao criar")()),
\t\t\tmap(mapRowToDomain),
\t\t);
\t},

\tupdate: (id: string, dto) =>
\t\tasyncPipe(
\t\t\ttaskFindById(repo, id, "Erro ao buscar registro")(),
\t\t\tchain(ensureFound("Registro não encontrado para edição")),
\t\t\tchain(() =>
\t\t\t\ttaskUpdate(
\t\t\t\t\trepo,
\t\t\t\t\tid,
\t\t\t\t\tmapDTOToRow(dto, id),
\t\t\t\t\t"Erro ao salvar alterações",
\t\t\t\t)(),
\t\t\t),
\t\t\tmap(mapRowToDomain),
\t\t),

\tdelete: (id) => {
\t\treturn asyncPipe(
\t\t\ttryTask(() => repo.delete(id), "Erro ao deletar")(),
\t\t\tmap(() => true),
\t\t);
\t},
});
`;

	const controllerContent = `import { createGenericController } from "../../utils/genericController";
import { ${camelName}Repo } from "./${pascalName}.repository";
import { make${pascalName}Service } from "./${pascalName}.service";

const service = make${pascalName}Service(${camelName}Repo);
export const ${camelName}Controller = createGenericController(service);
`;

	const routerContent = `import type { RouteMap } from "../../utils/http";
import { ${camelName}Controller } from "./${pascalName}.controller";

export const ${camelName}Routes: RouteMap = {
\t"GET:/${camelName}s": ${camelName}Controller.getAll,
\t"GET:/${camelName}s/([\\w-]+)": ${camelName}Controller.getById,
\t"POST:/${camelName}s": ${camelName}Controller.create,
\t"PUT:/${camelName}s/([\\w-]+)": ${camelName}Controller.update,
\t"DELETE:/${camelName}s/([\\w-]+)": ${camelName}Controller.delete,
};
`;

	const indexContent = `export * from "./${pascalName}.router";
export * from "./${pascalName}.type";
`;

	// 4. Verificar existência e criar pasta
	if (fs.existsSync(MODULE_PATH)) {
		console.error(`❌ O módulo "${pascalName}" já existe em src/modules.`);
		process.exit(1);
	}
	fs.mkdirSync(MODULE_PATH, { recursive: true });

	// 5. Escrever Arquivos
	const files = [
		{ name: `${pascalName}.type.ts`, content: typesContent },
		{ name: `${pascalName}.utils.ts`, content: utilsContent },
		{ name: `${pascalName}.repository.ts`, content: repositoryContent },
		{ name: `${pascalName}.service.ts`, content: serviceContent },
		{ name: `${pascalName}.controller.ts`, content: controllerContent },
		{ name: `${pascalName}.router.ts`, content: routerContent },
		{ name: "index.ts", content: indexContent },
	];

	for (const f of files) {
		fs.writeFileSync(path.join(MODULE_PATH, f.name), f.content);
		console.log(`  📄 Criado: ${f.name}`);
	}

	console.log("\n✅ Módulo criado com sucesso!");
	await generateAndRunDDL(pascalName, snakeName, props);
};

const registerRouteAutomatically = () => {
	const barrelPath = path.join(
		process.cwd(),
		"src",
		"infra",
		"Routes",
		"routesBarrel.ts",
	);

	if (!fs.existsSync(barrelPath)) return;

	let content = fs.readFileSync(barrelPath, "utf-8");
	if (content.includes(`${camelName}Routes`)) return;

	const importStatement = `import { ${camelName}Routes } from "../../modules/${pascalName}";\n`;
	const lastImportMatch = content.match(/^import .*$/gm);

	if (lastImportMatch) {
		const lastImport = lastImportMatch[lastImportMatch.length - 1];
		content = content.replace(
			lastImport,
			`${lastImport}\n${importStatement.trim()}`,
		);
	} else {
		content = importStatement + content;
	}

	const routesObjStart = content.indexOf("const internalRoutes: RouteMap = {");
	if (routesObjStart !== -1) {
		const openBrace = content.indexOf("{", routesObjStart) + 1;
		content = `${content.slice(0, openBrace)}\n\t...${camelName}Routes,${content.slice(openBrace)}`;
		fs.writeFileSync(barrelPath, content);
		console.log("🔗 Rota registrada automaticamente!");
	}
};

const run = async () => {
	try {
		await createFiles();
		registerRouteAutomatically();
		console.log("\n🎉 Processo finalizado!");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Erro fatal:", error);
		process.exit(1);
	}
};

run();
