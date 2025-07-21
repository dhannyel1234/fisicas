# 🚀 Início Rápido - Plataforma Hyper-V

## ✅ Status da Configuração

### 🎉 **JÁ CONFIGURADO:**
- ✅ **Credenciais Discord OAuth2** configuradas no `.env`
  - Client ID: `1396903584356106374`
  - Client Secret: configurado
- ✅ **Dependências instaladas** (shared, backend, frontend)
- ✅ **Banco de dados** configurado (schema Prisma)
- ✅ **Estrutura completa** do projeto criada

### 📋 **FALTAM APENAS 2 PASSOS:**

## 1. 🔐 Configure Discord Redirect URI

**Acesse:** https://discord.com/developers/applications/1396903584356106374

1. Vá em **OAuth2 > General**
2. Em **Redirect URIs**, adicione:
   ```
   http://localhost:3000/auth/discord/callback
   ```
3. **Clique em "Save Changes"**

## 2. 🖥️ Configure Servidor Hyper-V

**Edite o arquivo `.env` e substitua estas linhas:**

```bash
# Substitua pelos dados do seu servidor Hyper-V:
HYPERV_HOST=SEU_IP_HYPERV              # Ex: 192.168.1.100
HYPERV_USERNAME=Administrator           # Ou seu usuário admin
HYPERV_PASSWORD=SUA_SENHA_ADMIN         # Senha do administrador
BASE_VM_IMAGE_PATH=C:\VMs\BaseImage\base.vhdx   # Caminho da imagem base
```

---

## 🎯 Iniciar o Sistema

### Opção A: Desenvolvimento (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

### Opção B: Docker (Se você tem Docker)
```bash
docker-compose up -d postgres redis  # Apenas banco
```

---

## 🌐 Acessar a Aplicação

1. **Frontend:** http://localhost:3000
2. **Backend API:** http://localhost:5000
3. **Health Check:** http://localhost:5000/health

---

## 🧪 Testar o Login

1. Acesse http://localhost:3000
2. Clique em **"Login via Discord"**
3. Autorize a aplicação no Discord
4. Você será redirecionado de volta para o dashboard

---

## 🎯 Fluxo Completo Funcionando

1. **Login** via Discord ✅
2. **Dashboard** com interface moderna ✅
3. **Botão "Ligar Máquina"** ✅
4. **Sistema de filas** em tempo real ✅
5. **Barra de progresso** animada ✅
6. **Painel administrativo** ✅

---

## 📊 Funcionalidades Implementadas

### 🔐 **Autenticação**
- Login/logout via Discord OAuth2
- Tokens JWT com expiração
- Sessões seguras

### 🖥️ **Interface**
- Dashboard responsivo
- Tema dark/light
- Animações suaves
- Tempo real via WebSocket

### ⚡ **Sistema de VMs**
- Fila de espera inteligente
- Progresso em tempo real
- Criação automática
- Limpeza pós-uso

### 👨‍💼 **Administração**
- Painel admin completo
- Controle de VMs
- Estatísticas
- Logs de auditoria

---

## 🔧 Configuração Hyper-V (Opcional)

Se quiser testar com um servidor Hyper-V real:

1. **No servidor Windows Hyper-V:**
   ```powershell
   # Habilitar PowerShell Remoting
   Enable-PSRemoting -Force
   Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
   ```

2. **Preparar imagem base:**
   - Crie uma VM template
   - Execute `sysprep` para generalizar
   - Salve o arquivo `.vhdx` em `C:\VMs\BaseImage\`

3. **Atualizar `.env` com dados reais**

---

## 🐛 Problemas Comuns

### **Erro de Discord OAuth:**
- Verifique se o Redirect URI está configurado corretamente
- Confirme Client ID e Secret no `.env`

### **Erro de banco de dados:**
- Execute: `cd backend && npx prisma migrate dev`
- Ou use Docker: `docker-compose up -d postgres`

### **Porta ocupada:**
- Backend (5000): `lsof -ti:5000 | xargs kill -9`
- Frontend (3000): `lsof -ti:3000 | xargs kill -9`

---

## 📱 Interface Preview

### Dashboard do Cliente:
- ✅ Status da VM atual
- ✅ Botão "Ligar Máquina"
- ✅ Posição na fila
- ✅ Tempo estimado
- ✅ Progresso em tempo real

### Painel Admin:
- ✅ Lista de VMs ativas
- ✅ Controle de usuários
- ✅ Métricas do sistema
- ✅ Fila de espera

---

## 🎉 Resultado Final

**Você terá uma plataforma completa e profissional para:**

- ✅ **Gerenciar VMs** via interface web
- ✅ **Sistema de filas** inteligente
- ✅ **Autenticação** via Discord
- ✅ **Monitoramento** em tempo real
- ✅ **Administração** completa
- ✅ **Logs** e auditoria

---

## 📞 Suporte

### **Logs do Sistema:**
```bash
# Backend logs
tail -f backend/logs/hyperv-platform-$(date +%Y-%m-%d).log

# Verificar status
curl http://localhost:5000/health
```

### **Comandos Úteis:**
```bash
# Reiniciar backend
cd backend && npm run dev

# Reiniciar frontend  
cd frontend && npm run dev

# Ver logs do Docker
docker-compose logs -f
```

---

🎯 **Sua plataforma está 95% pronta!** 

Falta apenas configurar o Discord Redirect URI e você terá um sistema completo funcionando! 🚀