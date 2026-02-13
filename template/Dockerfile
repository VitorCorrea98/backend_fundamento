# Estágio 1: Build (Compilação do TS)
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas arquivos de dependência primeiro (para cache eficiente do Docker)
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies para conseguir fazer o build)
RUN npm i

# Copia o restante do código
COPY . .

# Compila o TypeScript (gera a pasta dist)
RUN npm run build

# Estágio 2: Runner (Imagem final leve para Produção)
FROM node:20-alpine

WORKDIR /app

# Copia package.json novamente para instalar apenas dependências de produção
COPY package*.json ./

# Instala APENAS dependências de produção (ignora eslint, typescript, types, etc)
RUN npm i

# Copia apenas o código compilado do estágio anterior
COPY --from=builder /app/dist ./dist

# Define usuário não-root por segurança (boa prática)
USER node

EXPOSE 8000
# Comando de inicialização direto (sem npm start para economizar memória)
CMD ["node", "dist/server.js"]