#!/bin/bash

# =============================================================================
# Script de Setup da Plataforma Hyper-V
# =============================================================================

set -e # Parar em caso de erro

echo "🖥️  Configurando Plataforma Hyper-V..."
echo "==========================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar se Docker está instalado e rodando
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo "✅ Docker está rodando"
        DOCKER_AVAILABLE=true
    else
        echo "⚠️  Docker instalado mas não está rodando"
        DOCKER_AVAILABLE=false
    fi
else
    echo "⚠️  Docker não encontrado"
    DOCKER_AVAILABLE=false
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo ""
echo "🔧 Configurando banco de dados..."
cd backend
npx prisma generate
cd ..

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure suas variáveis de ambiente."
    echo ""
    echo "📝 Variáveis importantes para configurar:"
    echo "   - DISCORD_CLIENT_ID: ID da aplicação Discord"
    echo "   - DISCORD_CLIENT_SECRET: Secret da aplicação Discord"  
    echo "   - HYPERV_HOST: IP/hostname do servidor Hyper-V"
    echo "   - HYPERV_USERNAME: Usuário administrador do Hyper-V"
    echo "   - HYPERV_PASSWORD: Senha do administrador"
    echo "   - BASE_VM_IMAGE_PATH: Caminho da imagem base (.vhdx)"
    echo ""
else
    echo "✅ Arquivo .env já existe"
fi

# Setup do banco com Docker
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Configurando infraestrutura com Docker..."
    
    # Parar containers existentes
    docker-compose down 2>/dev/null || true
    
    # Iniciar PostgreSQL e Redis
    docker-compose up -d postgres redis
    
    echo "⏳ Aguardando banco de dados inicializar..."
    sleep 10
    
    # Executar migrações
    cd backend
    npx prisma migrate dev --name init
    cd ..
    
    echo "✅ Banco de dados configurado"
else
    echo ""
    echo "⚠️  Docker não disponível. Configure PostgreSQL e Redis manualmente:"
    echo "   - PostgreSQL: postgresql://hyperv_user:hyperv_password123@localhost:5432/hyperv_platform"
    echo "   - Redis: redis://localhost:6379"
fi

# Verificar configuração do Discord
echo ""
echo "🔐 Configuração do Discord OAuth2:"
echo "   1. Acesse: https://discord.com/developers/applications"
echo "   2. Crie uma nova aplicação"
echo "   3. Vá em OAuth2 > General"
echo "   4. Adicione redirect URI: http://localhost:3000/auth/discord/callback"
echo "   5. Copie Client ID e Client Secret para o arquivo .env"
echo ""

# Scripts úteis
echo "🚀 Scripts disponíveis:"
echo "   npm run dev              - Iniciar desenvolvimento (frontend + backend)"
echo "   npm run dev:backend      - Iniciar apenas backend"
echo "   npm run dev:frontend     - Iniciar apenas frontend"
echo "   npm run build            - Build de produção"
echo "   docker-compose up -d     - Iniciar toda infraestrutura"
echo ""

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure o arquivo .env com suas credenciais"
echo "   2. Configure o Discord OAuth2"
echo "   3. Configure o servidor Hyper-V"
echo "   4. Execute: npm run dev"
echo ""
echo "📖 Documentação completa: README.md"
echo "🐛 Problemas? Verifique os logs em: backend/logs/"
echo ""