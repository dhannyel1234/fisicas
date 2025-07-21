# 🖥️ Plataforma de Acesso Remoto - Hyper-V VMs

Sistema completo para gerenciamento de máquinas virtuais Hyper-V com fila de espera inteligente e acesso via web.

## 🎯 Funcionalidades

- ✅ Login via Discord OAuth2
- ✅ Sistema de filas inteligente
- ✅ Criação automática de VMs
- ✅ Painel do cliente em tempo real
- ✅ Painel administrativo
- ✅ Agente Hyper-V para gerenciamento de VMs
- ✅ Formatação automática das VMs após uso

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│    Backend      │◄──►│  Hyper-V Agent  │
│   (Next.js)     │    │   (Node.js)     │    │  (PowerShell)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌─────────┐            ┌─────────┐
    │ Browser │            │PostgreSQL│            │Hyper-V  │
    │ Client  │            │Database │            │Server   │
    └─────────┘            └─────────┘            └─────────┘
```

## 🚀 Quick Start

### 1. Configurar variáveis de ambiente:

```bash
# Backend (.env)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DATABASE_URL=postgresql://user:password@localhost:5432/hyperv_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret

# Hyper-V Agent (.env)
HYPERV_HOST=your-hyperv-server
HYPERV_USERNAME=Administrator
HYPERV_PASSWORD=your_password
BASE_VM_IMAGE_PATH=C:\VMs\BaseImage\base.vhdx
VM_SWITCH_NAME=Default Switch
```

### 2. Executar com Docker:

```bash
docker-compose up -d
```

### 3. Ou executar manualmente:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Hyper-V Agent (no servidor Windows)
cd hyper-v-agent
npm install
npm start
```

## 📊 Estrutura do Projeto

```
hyper-v-platform/
├── frontend/          # Interface do usuário (Next.js)
├── backend/           # API e lógica de negócio (Node.js)
├── hyper-v-agent/     # Agente para controle do Hyper-V
├── database/          # Scripts e migrações
├── docker/            # Configurações Docker
└── shared/            # Tipos TypeScript compartilhados
```

## 🔧 Configuração

1. Configure o Discord OAuth2 em https://discord.com/developers/applications
2. Configure o servidor Hyper-V com PowerShell remoting habilitado
3. Prepare uma imagem base da VM (.vhdx)
4. Configure as variáveis de ambiente
5. Execute as migrações do banco de dados

## 📱 Interfaces

### Cliente:
- Dashboard com status da fila
- Botão para solicitar VM
- Acesso direto à VM quando disponível
- Histórico de uso

### Administrador:
- Painel de controle das VMs
- Monitoramento da fila
- Estatísticas de uso
- Gerenciamento de usuários

## 🔐 Segurança

- Autenticação via Discord OAuth2
- JWT tokens para sessões
- Validação de permissões em todas as rotas
- Logs de auditoria
- Isolamento das VMs

## 📈 Monitoramento

- Status em tempo real das VMs
- Métricas de uso e performance
- Alertas automáticos
- Dashboard administrativo

## 🛠️ Desenvolvimento

### Pré-requisitos:
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- PowerShell 5.1+ (para o agente Hyper-V)
- Docker (opcional)

### Scripts disponíveis:
- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executar testes
- `npm run migrate` - Executar migrações do banco

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.