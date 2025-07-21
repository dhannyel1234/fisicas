FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/
COPY prisma/ ./prisma/

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S hyperv -u 1001

# Mudar ownership dos arquivos
RUN chown -R hyperv:nodejs /app
USER hyperv

# Expor porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando de inicialização
CMD ["npm", "start"]