#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// 1. Pegar o nome do projeto dos argumentos (ex: npx create-xxx meu-projeto)
const projectName = process.argv[2];

if (!projectName) {
	console.error(
		"\x1b[31m%s\x1b[0m",
		"Erro: Por favor, especifique o nome do projeto.",
	);
	console.log("Exemplo: npx create-backend-funcional meu-api");
	process.exit(1);
}

const currentDir = process.cwd();
const projectDir = path.join(currentDir, projectName);
const templateDir = path.join(__dirname, "../template");

// 2. Criar a pasta do projeto
if (fs.existsSync(projectDir)) {
	console.error(
		"\x1b[31m%s\x1b[0m",
		`Erro: A pasta "${projectName}" já existe.`,
	);
	process.exit(1);
}

console.log(
	`\n🚀 Criando novo projeto backend funcional em: ${projectName}...`,
);
fs.mkdirSync(projectDir, { recursive: true });

// 3. Função recursiva para copiar arquivos (Nativo, sem libs externas)
function copyRecursiveSync(src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();

	if (isDirectory) {
		fs.mkdirSync(dest, { recursive: true });
		// biome-ignore lint/complexity/noForEach: <explanation>
		fs.readdirSync(src).forEach((childItemName) => {
			copyRecursiveSync(
				path.join(src, childItemName),
				path.join(dest, childItemName),
			);
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

// Copia tudo da pasta template para a nova pasta
copyRecursiveSync(templateDir, projectDir);

// 4. Renomear _gitignore para .gitignore
const gitignoreTemplate = path.join(projectDir, "_gitignore");
const gitignoreFinal = path.join(projectDir, ".gitignore");
if (fs.existsSync(gitignoreTemplate)) {
	fs.renameSync(gitignoreTemplate, gitignoreFinal);
}

// 5. Atualizar o package.json do novo projeto
const projectPackageJsonPath = path.join(projectDir, "package.json");
const projectPackageJson = require(projectPackageJsonPath);

projectPackageJson.name = projectName;
projectPackageJson.version = "1.0.0";
projectPackageJson.description = "Backend gerado via create-backend-funcional";

fs.writeFileSync(
	projectPackageJsonPath,
	JSON.stringify(projectPackageJson, null, 2),
);

// 6. Instalar Dependências automaticamente
console.log("📦 Instalando dependências (isso pode demorar um pouco)...");
try {
	execSync("npm install", { cwd: projectDir, stdio: "inherit" });
} catch (error) {
	console.error(
		'❌ Erro ao instalar dependências. Tente rodar "npm install" manualmente.',
	);
}

console.log(`
✅ Projeto criado com sucesso!

Para começar:
  cd ${projectName}
  npm run dev

Gerar novo domínio:
  npm run gen NomeEntidade

Happy Coding! 🚀
`);
