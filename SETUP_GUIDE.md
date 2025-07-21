# 🖥️ Guia Completo - Plataforma Hyper-V

Este guia detalha como configurar e usar a plataforma completa de gerenciamento de máquinas virtuais Hyper-V.

## 📋 Pré-requisitos

### No servidor/máquina de desenvolvimento:
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker e Docker Compose** - [Download](https://docs.docker.com/get-docker/)
- **Git** - Para clonar o repositório

### No servidor Hyper-V (Windows):
- **Windows Server 2019/2022** ou **Windows 10/11 Pro/Enterprise**
- **Hyper-V habilitado** e configurado
- **PowerShell 5.1+** ou **PowerShell Core 7+**
- **Acesso administrativo** ao servidor
- **Imagem base da VM** preparada (.vhdx)

### Configurações de rede:
- **Acesso de rede** entre o servidor da aplicação e o servidor Hyper-V
- **PowerShell Remoting** habilitado no servidor Hyper-V
- **Firewall** configurado para permitir conexões

## 🚀 Instalação Rápida

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd hyperv-platform
```

### 2. Executar setup automático
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configurar variáveis de ambiente
Edite o arquivo `.env` criado:

```bash
# =============================================================================
# DISCORD OAUTH2 - OBRIGATÓRIO
# =============================================================================
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# =============================================================================
# HYPER-V - OBRIGATÓRIO
# =============================================================================
HYPERV_HOST=192.168.1.100  # IP do seu servidor Hyper-V
HYPERV_USERNAME=Administrator
HYPERV_PASSWORD=SuaSenhaAqui
BASE_VM_IMAGE_PATH=C:\VMs\BaseImage\windows-template.vhdx
VM_SWITCH_NAME=Default Switch

# =============================================================================
# CONFIGURAÇÕES OPCIONAIS
# =============================================================================
VM_RAM_MB=4096
VM_CPU_CORES=2
MAX_VMS_PER_USER=1
MAX_QUEUE_SIZE=50
```

### 4. Iniciar o sistema
```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Ou com Docker (produção-like)
docker-compose up -d
```

## 🔐 Configuração do Discord OAuth2

### 1. Criar aplicação no Discord:
1. Acesse: https://discord.com/developers/applications
2. Clique em "New Application"
3. Dê um nome: "Hyper-V Platform"
4. Vá para "OAuth2" > "General"

### 2. Configurar OAuth2:
```
Redirect URIs:
http://localhost:3000/auth/discord/callback
https://seu-dominio.com/auth/discord/callback (produção)

Scopes:
✅ identify
✅ email
```

### 3. Copiar credenciais:
- **Client ID** → `DISCORD_CLIENT_ID`
- **Client Secret** → `DISCORD_CLIENT_SECRET`

## 🖥️ Configuração do Servidor Hyper-V

### 1. Habilitar PowerShell Remoting:
```powershell
# No servidor Hyper-V, execute como Administrador:
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
```

### 2. Configurar firewall:
```powershell
# Permitir WinRM
New-NetFirewallRule -DisplayName "WinRM-HTTP" -Direction Inbound -LocalPort 5985 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "WinRM-HTTPS" -Direction Inbound -LocalPort 5986 -Protocol TCP -Action Allow
```

### 3. Preparar imagem base:
1. Crie uma VM template com Windows
2. Configure a VM (drivers, software básico, etc.)
3. Execute `sysprep` para generalizar
4. Pare a VM e exporte o disco `.vhdx`
5. Coloque o arquivo em `C:\VMs\BaseImage\`

### 4. Configurar switch virtual:
```powershell
# Criar switch NAT (se não existir)
New-VMSwitch -Name "NAT Switch" -SwitchType Internal
New-NetIPAddress -IPAddress 192.168.100.1 -PrefixLength 24 -InterfaceAlias "vEthernet (NAT Switch)"
New-NetNat -Name "NAT Network" -InternalIPInterfaceAddressPrefix 192.168.100.0/24
```

## 📁 Estrutura do Projeto

```
hyperv-platform/
├── 📂 frontend/           # Interface React/Next.js
│   ├── 📂 components/     # Componentes React
│   ├── 📂 pages/          # Páginas Next.js
│   ├── 📂 hooks/          # Custom hooks
│   └── 📂 lib/            # Utilitários
├── 📂 backend/            # API Node.js/Express
│   ├── 📂 src/
│   │   ├── 📂 routes/     # Rotas da API
│   │   ├── 📂 services/   # Lógica de negócio
│   │   ├── 📂 middleware/ # Middlewares
│   │   └── 📂 database/   # Prisma/DB
│   └── 📂 prisma/         # Schema e migrações
├── 📂 hyper-v-agent/      # Agente Windows/PowerShell
├── 📂 shared/             # Tipos TypeScript compartilhados
└── 📂 database/           # Scripts de inicialização
```

## 🎯 Como o Sistema Funciona

### 1. Fluxo do usuário:
```
1. Usuário faz login via Discord
2. Clica em "Ligar Máquina"
3. Sistema verifica disponibilidade
4. Se disponível: cria VM imediatamente
5. Se ocupado: adiciona à fila
6. Exibe progresso em tempo real
7. Entrega acesso RDP/VNC
```

### 2. Componentes principais:

#### **Frontend (Next.js)**
- Interface moderna e responsiva
- Autenticação via Discord
- Dashboard em tempo real
- Fila de espera interativa
- Painel administrativo

#### **Backend (Node.js/Express)**
- API RESTful
- WebSocket para tempo real
- Autenticação JWT
- Sistema de filas (Bull)
- Logs e auditoria

#### **Hyper-V Agent**
- Comunicação com Hyper-V
- Criação/gerenciamento de VMs
- Monitoramento de recursos
- Limpeza automática

#### **Banco de Dados (PostgreSQL)**
- Usuários e sessões
- VMs e histórico
- Fila de espera
- Logs e métricas

## 🔧 Scripts Úteis

```bash
# Desenvolvimento
npm run dev                    # Frontend + Backend
npm run dev:backend           # Apenas Backend
npm run dev:frontend          # Apenas Frontend

# Build
npm run build                 # Build completo
npm run build:shared          # Build tipos compartilhados

# Database
cd backend
npx prisma studio            # Interface visual do DB
npx prisma migrate dev       # Criar migração
npx prisma generate          # Gerar cliente

# Docker
docker-compose up -d         # Iniciar infraestrutura
docker-compose logs -f       # Ver logs
docker-compose down          # Parar tudo
```

## 🐛 Troubleshooting

### Problemas comuns:

#### **1. Erro de conexão com Hyper-V**
```
❌ HYPERV_CONNECTION_FAILED
```
**Soluções:**
- Verificar se PowerShell Remoting está habilitado
- Testar conectividade: `Test-WSMan <HYPERV_HOST>`
- Verificar credenciais no `.env`
- Checar firewall do servidor

#### **2. Erro de banco de dados**
```
❌ Database connection failed
```
**Soluções:**
- Verificar se PostgreSQL está rodando: `docker ps`
- Verificar string de conexão no `.env`
- Executar migrações: `npx prisma migrate dev`

#### **3. Discord OAuth falha**
```
❌ Invalid redirect URI
```
**Soluções:**
- Verificar redirect URI no Discord Developer Portal
- Conferir `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`
- Verificar se a aplicação Discord está configurada corretamente

#### **4. VM não inicia**
```
❌ VM_CREATION_FAILED
```
**Soluções:**
- Verificar se a imagem base existe e é válida
- Checar se há espaço em disco suficiente
- Verificar permissões do diretório de VMs
- Consultar logs do Hyper-V Agent

### Debug avançado:

#### **1. Logs do sistema:**
```bash
# Backend logs
tail -f backend/logs/hyperv-platform-$(date +%Y-%m-%d).log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

#### **2. Testar conectividade Hyper-V:**
```powershell
# No servidor de aplicação
$cred = Get-Credential # Digite credenciais do Hyper-V
Invoke-Command -ComputerName HYPERV_HOST -Credential $cred -ScriptBlock { Get-VM }
```

#### **3. Health check:**
```bash
curl http://localhost:5000/health
```

## 📊 Monitoramento

### Métricas disponíveis:
- VMs ativas por usuário
- Tempo médio na fila
- Uso de recursos do servidor
- Estatísticas de acesso

### Endpoints úteis:
```
GET /health                 # Status geral
GET /health/metrics         # Métricas detalhadas
GET /admin/dashboard        # Dashboard administrativo
```

## 🔒 Segurança

### Implementado:
- ✅ Autenticação Discord OAuth2
- ✅ Tokens JWT com expiração
- ✅ Rate limiting
- ✅ Logs de auditoria
- ✅ Isolamento de VMs
- ✅ Validação de entrada

### Recomendações produção:
- Use HTTPS em produção
- Configure firewall adequadamente
- Monitore logs regularmente
- Mantenha sistema atualizado
- Use segredos seguros (não padrões)

## 📞 Suporte

### Logs importantes:
- `backend/logs/` - Logs da aplicação
- `docker logs <container>` - Logs dos containers
- Event Viewer do Windows - Logs do Hyper-V

### Comandos de diagnóstico:
```bash
# Status dos serviços
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Conectar no container
docker exec -it hyperv_backend bash

# Status do banco
docker exec -it hyperv_postgres psql -U hyperv_user -d hyperv_platform -c "\dt"
```

---

## ✅ Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] Docker funcionando
- [ ] Repositório clonado
- [ ] `./setup.sh` executado
- [ ] `.env` configurado
- [ ] Discord OAuth2 configurado
- [ ] Servidor Hyper-V configurado
- [ ] PowerShell Remoting testado
- [ ] Imagem base da VM preparada
- [ ] Sistema iniciado com `npm run dev`
- [ ] Login funcionando
- [ ] VM de teste criada com sucesso

---

🎉 **Parabéns!** Sua plataforma Hyper-V está pronta para uso!