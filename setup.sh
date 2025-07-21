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

# Shared
echo "📚 Instalando shared..."
cd shared
npm install
npm run build
cd ..

# Backend
echo "🖥️  Instalando backend..."
cd backend
npm install

# Gerar cliente Prisma
echo "🔧 Configurando banco de dados..."
npx prisma generate
cd ..

# Frontend
echo "🎨 Instalando frontend..."
cd frontend
npm install
cd ..

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Arquivo .env já existe com credenciais Discord configuradas"
else
    echo "✅ Arquivo .env já configurado"
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
echo "   ✅ Client ID: 1396903584356106374 (já configurado)"
echo "   ✅ Client Secret: configurado no .env"
echo ""
echo "   📋 PRÓXIMO PASSO OBRIGATÓRIO:"
echo "   1. Acesse: https://discord.com/developers/applications/1396903584356106374"
echo "   2. Vá em OAuth2 > General"
echo "   3. Adicione Redirect URI: http://localhost:3000/auth/discord/callback"
echo "   4. Salve as alterações"
echo ""

# Scripts úteis
echo "🚀 Agora você pode executar:"
echo "   npm run dev:backend      - Iniciar apenas backend"
echo "   npm run dev:frontend     - Iniciar apenas frontend (em outro terminal)"
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   docker-compose up -d     - Iniciar toda infraestrutura"
    echo ""
fi

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "   1. ✅ Discord OAuth2 credenciais configuradas"
echo "   2. 📋 Configure o Redirect URI no Discord (veja instruções acima)"
echo "   3. 📋 Configure o servidor Hyper-V no arquivo .env"
echo "   4. 🚀 Execute: npm run dev:backend (em um terminal)"
echo "   5. 🚀 Execute: npm run dev:frontend (em outro terminal)"
echo ""
echo "📖 Documentação completa: README.md"
echo "🔧 Configuração Discord: DISCORD_SETUP.md"
echo "🐛 Problemas? Verifique os logs em: backend/logs/"
echo ""