# 🔐 Configuração Discord OAuth2 - Finalizar Setup

## ✅ Credenciais Já Configuradas

Suas credenciais do Discord já foram configuradas no arquivo `.env`:
- **Client ID**: `1396903584356106374`
- **Client Secret**: `slLVT8unpsmb4UexqG_aZq_NTMU5IPoI`

## 🎯 Próximos Passos Obrigatórios

### 1. Configure o Redirect URI no Discord

Acesse sua aplicação Discord em: https://discord.com/developers/applications/1396903584356106374

Na seção **OAuth2 > General**, adicione esta URL nos **Redirect URIs**:

```
http://localhost:3000/auth/discord/callback
```

### 2. Configure os Scopes

Na mesma seção, certifique-se de que estes scopes estão habilitados:

- ✅ `identify` - Para obter informações básicas do usuário
- ✅ `email` - Para obter o email do usuário (opcional)

### 3. Teste a Configuração

Após configurar o redirect URI, você pode testar o login:

1. Inicie o sistema:
   ```bash
   ./setup.sh
   npm run dev
   ```

2. Acesse: http://localhost:3000

3. Clique em "Login via Discord"

4. Verifique se o redirecionamento funciona corretamente

## 🔧 Configuração Visual no Discord

### Passo a Passo com Imagens:

1. **Acesse sua aplicação**: https://discord.com/developers/applications/1396903584356106374

2. **Vá para OAuth2 > General**

3. **Adicione Redirect URI**:
   ```
   http://localhost:3000/auth/discord/callback
   ```

4. **Clique em "Save Changes"**

5. **Teste o login** na aplicação

## ⚠️ Importante

- Mantenha o **Client Secret** seguro e nunca o compartilhe publicamente
- Para produção, adicione também o redirect URI do seu domínio:
  ```
  https://seu-dominio.com/auth/discord/callback
  ```

## 🎉 Pronto!

Após configurar o redirect URI, sua integração Discord estará completa e funcionando!

### URLs Úteis:
- **Aplicação Discord**: https://discord.com/developers/applications/1396903584356106374
- **Documentação OAuth2**: https://discord.com/developers/docs/topics/oauth2
- **Sua aplicação local**: http://localhost:3000

---

**💡 Dica**: Se houver problemas com o login, verifique os logs do backend em `backend/logs/` ou execute `docker-compose logs -f backend`