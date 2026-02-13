# 🚀 Backend Fundamento (Node.js + TypeScript Functional Starter)

> Um boilerplate backend robusto, focado em **Programação Funcional**, **Ferramentas Nativas** e **Clean Architecture**, sem a complexidade de classes ou frameworks pesados.

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

## 💡 Filosofia do Projeto

Este projeto foi desenhado para desenvolvedores que preferem controle, performance e previsibilidade. Diferente dos padrões convencionais de OOP (Programação Orientada a Objetos), aqui nós abraçamos:

* **Zero Classes:** Toda a lógica é construída com funções puras e composição.
* **Result Pattern:** Nada de `try/catch` espalhado. Erros são tratados como valores (`Success` ou `Failure`).
* **Pipelines:** Uso extensivo de `pipe` e `asyncPipe` para criar fluxos de dados legíveis e lineares.
* **Native First:** Evitamos bibliotecas externas para o que o Node.js já faz bem nativamente.

## 🛠️ Tech Stack

* **Runtime:** Node.js (v20+)
* **Linguagem:** TypeScript
* **Banco de Dados:** PostgreSQL (via Supabase)
* **Infra:** Docker & Docker Compose
* **Dev Tools:** TSX, Biome, TS-Morph (para geração de código)

## ⚡ Começando Agora

### Pré-requisitos

* Node.js v20+
* NPM ou PNPM
* Docker (Opcional, mas recomendado)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/backend-fundamento.git](https://github.com/seu-usuario/backend-fundamento.git)
    cd backend-fundamento
    ```

2.  **Configure as Variáveis de Ambiente:**
    ```bash
    cp .env.example .env
    ```
    *Preencha o `.env` com suas credenciais do Supabase.*

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Rode o projeto:**
    ```bash
    npm run dev
    ```
    *O servidor iniciará em `http://localhost:8000`*

---

## 🏗️ Arquitetura e Fluxo

O projeto segue um fluxo unidirecional baseado em camadas funcionais:

    A[Request] --> B(Router Engine)
    B --> C(Controller)
    C --> D{Service / Pipe}
    D --> E[Validator]
    D --> F[Repository]
    F --> G[(Database)]
    D --> H[Response Adapter]
    


