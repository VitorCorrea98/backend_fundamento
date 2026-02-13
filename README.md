# Backend Fundamento (Node.js + TypeScript Functional Starter)

Um boilerplate backend robusto, focado em **Programação Funcional**, **Ferramentas Nativas** e **Clean Architecture**, eliminando a complexidade desnecessária de classes e frameworks pesados.

---

## 💡 Filosofia do Projeto

Este projeto foi desenhado para desenvolvedores que preferem controle, performance e previsibilidade. Diferente dos padrões convencionais de OOP (Programação Orientada a Objetos), aqui nós adotamos:

* **Zero Classes:** Toda a lógica é construída com funções puras e composição.
* **Result Pattern:** Nada de `try/catch` espalhado pela regra de negócio. Erros são tratados como valores de retorno (`Success` ou `Failure`).
* **Pipelines:** Uso extensivo de `pipe` e `asyncPipe` para criar fluxos de dados legíveis e lineares.
* **Native First:** Evitamos bibliotecas externas para o que o Node.js já faz bem nativamente (ex: `node:http` e `node:test`).

---

## 🛠️ Tecnologias

* **Runtime:** Node.js (v20+)
* **Linguagem:** TypeScript (Strict Mode)
* **Banco de Dados:** PostgreSQL (via Supabase)
* **Infra:** Docker & Docker Compose
* **Dev Tools:** TSX (rápido), Biome (linter/formatter), TS-Morph (geração de código)

---

## ⚡ Guia de Início Rápido

### Pré-requisitos

* Node.js v20 ou superior
* NPM
* Docker (Opcional, mas recomendado para o ambiente)

### Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/backend-fundamento.git
cd backend-fundamento

```


2. **Configure o Ambiente:**
Duplique o arquivo de exemplo e configure suas variáveis.
```bash
cp .env.example .env

```


3. **Instale as dependências:**
```bash
npm install

```


4. **Execute o servidor em modo de desenvolvimento:**
```bash
npm run dev

```


O servidor estará rodando em: `http://localhost:8000`

---

## 🏗️ Arquitetura e Fluxo de Dados

O projeto segue um fluxo unidirecional. A requisição entra e flui através de funções puras até a resposta.

**Fluxo da Requisição:**

`[Request]` -> `[Router]` -> `[Controller]` -> `[Service/Pipe]` -> `[Repository]` -> `[Database]`

1. **Router Engine:** Identifica a rota (suporta Regex e parâmetros dinâmicos) e invoca o Controller.
2. **Controller:** Extrai dados da requisição (Body/Params) e chama o Service.
3. **Service:** O coração da aplicação. Uma composição de funções (`chain`, `map`, `tryTask`) que definem a regra de negócio.
4. **Repository:** Camada de acesso a dados genérica.
5. **Response Adapter:** Padroniza a resposta HTTP e o Status Code baseado no resultado do Service.

---

## 🤖 CLI: Gerador de Domínios (Feature Principal)

Este projeto inclui uma ferramenta de CLI personalizada para acelerar o desenvolvimento. Ela cria toda a estrutura de um novo módulo (CRUD) automaticamente.

### Como usar

O comando básico gera: Tipos, Repositório, Serviço, Controller e Rota.

```bash
npm run gen NomeDaEntidade

```

*Exemplo: `npm run gen Produto*`

### Opções Avançadas (Flags)

O script suporta argumentos para flexibilidade total:

* **`--no-db`**
* **O que faz:** Gera apenas os arquivos de código (Service, Controller, etc.), mas **pula** a criação da tabela no banco de dados.
* **Uso:** `npm run gen Log -- --no-db`


* **`--prefix=...`**
* **O que faz:** Define um prefixo personalizado para a tabela criada no banco de dados.
* **Padrão:** `app_` (se não informado).
* **Uso:** `npm run gen Usuario -- --prefix=sistema_auth_`
* **Resultado:** Cria a tabela `sistema_auth_usuario`.


* **`--path=...`**
* **O que faz:** Define o caminho onde o script deve buscar as interfaces/tipos do Frontend para usar como base.
* **Uso:** `npm run gen Cliente -- --path=../../outro-projeto/src/types`



> **Nota:** Se o script não encontrar a interface correspondente no caminho especificado, ele não quebra. Ele gera um "esqueleto" básico com campos padrão (`nome`, `ativo`) para você editar depois.

---

## 📂 Estrutura de Pastas

```text
src/
├── core/           # Contratos base e tipos globais (Http, ORM, ServiceResult)
├── infra/          # Implementações de infraestrutura (Supabase, Server, Context)
├── modules/        # Domínios da aplicação (Onde seu código de negócio vive)
├── utils/          # Ferramentas funcionais (pipe, task, ensure, validator)
└── server.ts       # Ponto de entrada da aplicação

```

---

## 🛡️ Padrões de Código

### O Padrão `asyncPipe`

Em vez de métodos de classe, usamos composição de funções. Um serviço típico se parece com isto:

```typescript
export const create = (dto) => {
    return asyncPipe(
        success("OK", dto),                 // 1. Inicia o fluxo com os dados
        chain(validateBusinessRules),       // 2. Valida (pode retornar erro)
        map(prepareDataForDb),              // 3. Transforma dados
        chain(repo.create),                 // 4. Persiste
        map(formatResponse)                 // 5. Formata retorno
    );
}

```

Isso garante que cada passo seja isolado, testável e que o fluxo de dados seja explícito.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Se você tem ideias para melhorar a arquitetura funcional ou o script de geração:

1. Faça um Fork do projeto.
2. Crie sua Feature Branch (`git checkout -b feature/MinhaMelhoria`).
3. Commit suas mudanças.
4. Abra um Pull Request.

---

## 📄 Licença

Este projeto está sob a licença MIT.