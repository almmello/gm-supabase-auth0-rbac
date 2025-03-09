# gm-supabase-auth0-RBAC

## Estrutura do Projeto

Neste tutorial, vamos implementar controle de acesso por funções (RBAC) em um projeto **Next.js 15** integrado com **Auth0** (para autenticação) e **Supabase** (banco de dados PostgreSQL + API). Teremos dois papéis de usuário: **Admin** e **Usuário comum**, com permissões diferentes. Abordaremos:

1. **Configuração do Auth0 para incluir *roles* no JWT** – adicionando as roles de usuário (Admin ou Usuário) no token JWT retornado pelo Auth0, de forma que o Supabase possa utilizá-las.
2. **Políticas de Row Level Security (RLS) no Supabase** – criação de políticas de acesso no PostgreSQL baseadas nas roles presentes no JWT (Admin com acesso total CRUD; Usuário comum pode criar, ler e editar, porém não excluir).
3. **Integração no Next.js** – uso do JWT no aplicativo Next.js para acessar o Supabase com as credenciais corretas e ajustes na interface para habilitar/ocultar funcionalidades conforme a role do usuário.
4. **Boas práticas de segurança** – garantir validade do JWT, evitar exposições desnecessárias de dados sensíveis e outras dicas de segurança e performance na integração.

Cada seção trará exemplos de código e explicações claras de cada etapa. Vamos começar! 🎯

## Instruções de Reset do Banco de Dados

Antes de iniciar o tutorial, é importante garantir que o banco de dados esteja em um estado limpo e sincronizado. Para isso, execute o seguinte comando:

```bash
npx supabase db reset --db-url postgresql://postgres:[sua-senha]@[sua-string-de-conexão] --debug
```

Isso irá restaurar o estado do banco de dados e aplicar todas as migrações necessárias.

## 1. Configurando o Auth0 para incluir roles no JWT

Para que o Supabase saiba qual é a role do usuário autenticado, precisamos garantir que o token JWT emitido pelo Auth0 contenha essa informação. Faremos isso através do sistema de **Roles** do Auth0 e de uma **Action** (ação pós-login) que insere as roles no JWT.

### 1.1 Definindo roles e atribuindo a usuários no Auth0

Primeiro, defina os papéis (roles) no Auth0 e atribua-os aos seus usuários. No dashboard do Auth0, navegue até **User Management > Roles** e crie duas roles, por exemplo: `admin` e `user`. Em seguida, atribua essas roles aos usuários apropriados (na tela de perfil de cada usuário, aba **Roles**, use *Assign Roles* para selecionar a role.

- **Admin**: terá permissões administrativas (acesso total de leitura, criação, edição e exclusão).
- **User (Usuário comum)**: terá permissões limitadas (pode criar, ler e editar seus dados, **não pode excluir**).

**Importante:** Garanta que cada usuário tenha pelo menos uma role atribuída antes do login. O Auth0 só conseguirá inserir roles no token de quem as possui.

### 1.2 Criando uma Action para adicionar roles ao token JWT

Por padrão, os tokens do Auth0 **não incluem** as roles do usuário. Vamos criar uma **Action** (ação pós-login) para adicionar essa informação como um claim customizado no JWT. Além disso, vamos adicionar um claim especial exigido pelo Supabase:

- `role: "authenticated"` – este claim indica para o Supabase que o usuário está autenticado. O Supabase usa o valor do claim `role` para definir o papel de banco de dados (`authenticated` ou `anon`) quando aplica as políticas de segurança.

A Action será executada automaticamente em cada login, modificando o token. No Auth0 Dashboard, vá em **Actions > Library**, crie uma nova Action do tipo **Post Login** e insira o seguinte código:

```js
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://myapp.example.com';  // use seu domínio aqui
  if (event.authorization) {
    // Adicionar array de roles do usuário (se existirem) no ID Token e Access Token
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    // Adicionar claim 'role' requerido pelo Supabase (marcando usuário autenticado)
    api.accessToken.setCustomClaim('role', 'authenticated');
  }
}
```

**Explicação do código:**
- `event.authorization.roles` contém a lista de roles do usuário (por exemplo, `["admin"]` ou `["user"]`).
- Usamos um `namespace` customizado (`https://myapp.example.com/roles`) para nosso claim de roles.
- Adicionamos as roles tanto no **ID Token** quanto no **Access Token**.
- Adicionamos o claim `role` no Access Token com valor `"authenticated"`.

Salve e deploie essa Action. Certifique-se de que ela esteja **ativa** e atribuída à sua aplicação Auth0 (em *Flows > Login*, arraste a Action para o fluxo de Post Login, se necessário).

### 1.3 Configurando o Auth0 para emitir um Access Token JWT

No contexto do Next.js, é comum usar a biblioteca Auth0 ou NextAuth para autenticar. Para garantir que tenhamos um JWT contendo as roles, precisamos solicitar um **Access Token** JWT ao Auth0. Isso geralmente envolve configurar uma **API** no Auth0 e usar seu **Audience**:

- No Auth0 Dashboard, vá em **Applications > APIs** e crie uma nova API (dê um nome e uma identificação, por exemplo `https://myapp.example.com/api`). Escolha o algoritmo **RS256** (padrão).
- No seu aplicativo Next.js (Applications > Applications > sua app > Settings), adicione o **Audience** da API criada (por exemplo `https://myapp.example.com/api`) nas configurações.

**Nota:** O algoritmo RS256 (assimétrico) é suportado pelo Supabase. Não use HS256 para tokens do Auth0, pois a integração do Supabase não o suporta.

Depois dessas configurações, quando um usuário fizer login, o Auth0 retornará um **Access Token JWT** que inclui:
- O claim customizado com as roles do usuário, e 
- O claim `role: "authenticated"`.

Podemos agora usar esse token no Supabase para aplicar controle de acesso.

### 1.4 Verificando e logando o JWT enriquecido

Durante o desenvolvimento, é útil verificar se o JWT está sendo corretamente enriquecido com as informações necessárias. Podemos fazer isso adicionando logs para inspecionar o token no arquivo pages/api/auth/[..auth0].js]:

```js
import jwt from 'jsonwebtoken';

// Função para logar informações do token
function logTokenDetails(supabaseToken) {
  try {
    const decoded = jwt.decode(supabaseToken);
    
    console.log('Token decodificado:', {
      userId: decoded.sub,
      roles: decoded['https://myapp.example.com/roles'],
      expiration: new Date(decoded.exp * 1000).toLocaleString()
    });
    
    return decoded;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    throw error;
  }
}

// Uso no fluxo de autenticação
const supabaseToken = session.user.accessToken;
logTokenDetails(supabaseToken);
```

**O que estamos logando:**
- `userId`: Identificador único do usuário
- `roles`: Array de roles do usuário
- `expiration`: Data de expiração do token formatada

**Boas práticas para produção:**
- Evite logar o token completo em produção
- Use máscaras para informações sensíveis
- Considere usar serviços de logging centralizados
- Implemente níveis de log (debug, info, warn, error)
- Remova logs de debug antes de enviar para produção

**Atenção:** Esses logs são úteis para desenvolvimento e depuração, mas devem ser usados com cuidado em produção para evitar exposição de dados sensíveis.

Como fica a versão final do arquivo `pages/api/auth/[...auth0].js`:

```js
// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Logger configurável
const logger = {
  log: (...args) => {
    if (process.env.DEBUG_LOG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

const afterCallback = async (req, res, session) => {
  // Log do JWT recebido do Auth0
  logger.log('JWT recebido do Auth0:', {
    token: session.idToken,
    claims: jwt.decode(session.idToken)
  });

  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const supabaseToken = jwt.sign(
    payload,
    process.env.SUPABASE_SIGNING_SECRET
  );

  // Log do token gerado para o Supabase
  logger.log('Token gerado para o Supabase:', {
    token: supabaseToken,
    claims: jwt.decode(supabaseToken)
  });

  session.user.accessToken = supabaseToken;
  return session;
};

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
```

## 2. Atualizando as políticas de acesso via nova migração

Nas migrações iniciais já foi executado o comando para habilitar o Row Level Security na tabela `todos` e, consequentemente, algumas políticas já foram criadas. Dessa forma, não é necessário executar novamente.

Para atualizar as regras de acesso de acordo com as novas diretrizes, vamos criar uma nova migração de ajuste.

Nesta nova migração, vamos redefinir as políticas para garantir que:

- **SELECT (leitura):** um usuário com a role **admin** pode visualizar todos os registros; o usuário comum poderá visualizar apenas os registros cujo `user_id` seja igual ao seu próprio (extraído do claim `sub` do JWT).
- **INSERT (inserção):** o admin pode inserir qualquer registro; o usuário comum só poderá inserir registros se o `user_id` informado for o seu próprio.
- **UPDATE (atualização):** o admin pode atualizar qualquer registro; o usuário comum só poderá atualizar registros de que é dono.
- **DELETE (exclusão):** apenas o admin poderá deletar registros.

Crie uma nova migração (por exemplo, `20240112000005_update_rls_policies.sql`) com o seguinte conteúdo:

```sql
-- Atualização de política para SELECT: Admin pode ver todos; usuário vê apenas seus próprios
DROP POLICY IF EXISTS "Todos_Select_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Select_Admin_ou_Proprio" 
ON public.todos
FOR SELECT
USING (
  (auth.jwt() -> 'https://myapp.example.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para INSERT: Admin insere qualquer, usuário somente se for o dono
DROP POLICY IF EXISTS "Todos_Insert_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Insert_Admin_ou_Proprio" 
ON public.todos
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'https://myapp.example.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para UPDATE: Admin pode atualizar qualquer, usuário apenas seus próprios
DROP POLICY IF EXISTS "Todos_Update_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Update_Admin_ou_Proprio" 
ON public.todos
FOR UPDATE
USING (
  (auth.jwt() -> 'https://myapp.example.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
)
WITH CHECK (
  (auth.jwt() -> 'https://myapp.example.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para DELETE: apenas Admin
DROP POLICY IF EXISTS "Todos_Delete_Admin" ON public.todos;
CREATE POLICY "Todos_Delete_Admin" 
ON public.todos
FOR DELETE
USING (
  (auth.jwt() -> 'https://myapp.example.com/roles') @> '["admin"]'::jsonb
);
```

Após criar essa nova migração, aplique-a utilizando o comando de migração do Supabase (por exemplo, via CLI com `npx supabase db push`) para que as novas regras sejam efetivadas no banco de dados.

> **Observação:** Essa migração substitui as políticas existentes e assegura que as regras de acesso estejam atualizadas conforme a estrutura de RBAC definida (diferenciando admin e usuário comum).

**Referências úteis:**
- [Documentação oficial do Supabase sobre RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guia de migrações do Supabase](https://supabase.com/docs/guides/database/migrations)
