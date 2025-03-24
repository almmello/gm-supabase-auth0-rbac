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

## 1. Configurando o Auth0 para incluir roles no JWT e gerando o token para o Supabase

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

## 3. Implementando e testando as políticas RBAC na interface Next.js

Agora que as políticas de segurança (RLS) foram definidas no Supabase e as roles estão sendo corretamente incluídas no JWT emitido pelo Auth0, vamos implementar uma interface prática para verificar se as permissões estão funcionando corretamente na aplicação frontend.

Vamos realizar os seguintes passos:

- ✅ **Verificar o carregamento das roles no frontend.**
- ✅ **Ajustar o componente `pages/index.js` para exibir conteúdos diferentes com base na role do usuário.**
- ✅ **Validar as políticas RLS diretamente na interface.**

---

## 3. Integrando RBAC no Frontend (Next.js)

Com as roles já presentes no JWT recebido do Auth0, vamos implementar uma interface que diferencia as funcionalidades acessíveis a um usuário comum de um administrador.

### 3.1 – Verificando o recebimento das roles no frontend

Primeiro, vamos garantir que as roles definidas no Auth0 estejam corretamente disponíveis no objeto `user` do Next.js.

**Edite** o arquivo `pages/api/auth/[...auth0].js` para garantir que as roles sejam propagadas ao objeto da sessão corretamente:

```javascript
// pages/api/auth/[...auth0].js
import { handleAuth, handleCallback, handleLogin } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Logger configurável
const logger = {
  log: (...args) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

const afterCallback = async (req, res, session) => {
  const decodedToken = jwt.decode(session.idToken);
  const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE; 

  logger.log('JWT recebido do Auth0:', {
    token: session.idToken,
    claims: decodedToken
  });

  // Adicionando log para verificar as roles
  logger.log('ID Token Claims:', decodedToken);
  logger.log('Namespace:', namespace);
  logger.log('Roles from decodedToken:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user before assignment:', session.user);
  logger.log('Decoded roles:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user after assignment:', session.user);
  logger.log('Roles assigned to session.user:', session.user[`${namespace}/roles`]);
  logger.log('Decoded roles after assignment:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user roles after assignment:', session.user[`${namespace}/roles`]);
  logger.log('Namespace after assignment:', namespace);

  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    role: 'authenticated',
    roles: decodedToken[`${namespace}/roles`] || [],
  };

  session.user[`${namespace}/roles`] = decodedToken[`${namespace}/roles`] || [];

  const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);

  logger.log('Token gerado para o Supabase:', {
    token: supabaseToken,
    claims: jwt.decode(supabaseToken)
  });

  session.user.accessToken = supabaseToken;
  return session;
};

export default handleAuth({
  async login(req, res) {
    return handleLogin(req, res, {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email'
      }
    });
  },
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
```

Desta forma, teremos acesso direto às roles na aplicação através do objeto `user.roles`.

---

## 3. Ajustando o Frontend para validação das Roles

Agora que o backend está corretamente propagando as roles no JWT, podemos refletir essas diferenças diretamente no frontend, ajustando a interface de usuário para exibir ações baseadas nas permissões.

### Passo 1: Ajustar o `getServerSideProps`

**Arquivo:** `pages/index.js`

Substitua a função `getServerSideProps` atual por este trecho atualizado:

```javascript
import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const session = await getSession(req, res);
    
    const supabase = getSupabase(session.user.accessToken);
    
    const { data: todos, error } = await supabase.from('todos').select('*');

    if (error) {
      console.error("Erro ao buscar tarefas:", error);
    }

    return {
      props: {
        user: session.user,
        todos: todos || [],
      },
    };
  },
});
```

> Este código recupera corretamente os "todos" utilizando as permissões definidas pelas políticas RLS que criamos anteriormente.

### Passo 2: Ajustar o Componente React para exibir ações baseadas em Roles

**Arquivo:** `pages/index.js`

Atualize o componente principal da seguinte forma:

```jsx
// pages/index.js
import { useState } from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { getSupabase } from "../utils/supabase";
import Link from 'next/link';

const Index = ({ user, todos }) => {
  const [content, setContent] = useState('');
  const [allTodos, setAllTodos] = useState(todos || []);

  const isAdmin = user.roles.includes('admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = getSupabase(user.accessToken);

    const { data, error } = await supabase
      .from('todos')
      .insert({ content, user_id: user.sub })
      .select();

    if (!error && data) {
      setAllTodos([...allTodos, data[0]]);
      setContent('');
    } else {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleDelete = async (id) => {
    const supabase = getSupabase(user.accessToken);
    await supabase.from('todos').delete().eq('id', id);
    setAllTodos(allTodos.filter(todo => todo.id !== id));
  };

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-2xl space-y-6">
        <p className="text-lg flex items-center justify-between">
          <span>
            Bem-vindo {user.name}! ({isAdmin ? 'Admin' : 'Usuário'})
          </span>
          <Link href="/api/auth/logout" className="text-blue-400 underline ml-2">
            Sair
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            onChange={(e) => setContent(e.target.value)}
            value={content}
            placeholder="Adicione uma nova tarefa..."
            className="flex-1 p-2 border rounded bg-gray-800 text-white"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Adicionar
          </button>
        </form>

        <div className="space-y-4">
          {allTodos.length > 0 ? (
            allTodos.map(todo => (
              <div key={todo.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                <span>{todo.content}</span>
                {isAdmin && (
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(todo.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">Você completou todas as tarefas!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const session = await getSession(req, res);
    const supabase = getSupabase(session.user.accessToken);
    const { data: todos } = await supabase.from('todos').select('*');

    return {
      props: {
        user: {
          ...session.user,
          roles: session.user['https://gm-supabase-tutorial.us.auth0.com/roles'] || [],
          accessToken: session.user.accessToken
        },
        todos,
      }
    };
  },
});

export default Index;
```

### 🛠️ O que fizemos aqui?

- Criamos uma lógica para exibir condicionalmente o botão **"Excluir"** apenas para usuários Admin.
- Ajustamos a captura correta das roles com o namespace correto, refletindo a configuração no Auth0 (`https://gm-supabase-tutorial.us.auth0.com/roles`).
- Garantimos que o frontend leia corretamente as roles recebidas pelo JWT emitido pelo Auth0.

---

## ✅ Próximos passos para validar esta implementação:

1. **Faça login como usuário Admin** e confirme que o botão "Excluir" aparece corretamente.
2. **Faça login como usuário Comum** e verifique que o botão "Excluir" não aparece, confirmando o funcionamento correto das regras RLS no Supabase.
3. Teste as operações (listar, adicionar, editar, excluir) com ambos usuários para validar as políticas de segurança e a interface.


## Sistema de Logs Otimizado

O projeto implementa um sistema de logs otimizado focado em monitoramento de erros e chamadas de API. Este sistema foi desenvolvido para fornecer visibilidade sobre o funcionamento da aplicação sem impactar o desempenho.

### Características Principais

1. **Foco em Logs Críticos**
   - Erros de API e operações
   - Chamadas de API ao Supabase
   - Erros de autenticação e autorização
   - Operações de banco de dados

2. **Prevenção de Duplicação**
   - Sistema de debounce (5 segundos) para evitar logs repetidos
   - Limite máximo de logs armazenados (100)
   - Limpeza automática de logs antigos
   - Cache de logs processados

3. **Diferenciação de Ambientes**
   - **Desenvolvimento**: Logs detalhados incluindo chamadas de API
   - **Produção**: Foco em erros críticos e informações essenciais
   - Configuração via variáveis de ambiente

4. **Formato Padronizado**
   ```javascript
   [ERROR] Mensagem de erro
   [WARN]  Aviso
   [INFO]  Informação
   [API]   Serviço - Método { parâmetros }
   ```

5. **Limpeza Automática**
   - Limpa logs ao fechar a página (browser)
   - Limpa logs ao recarregar o módulo (desenvolvimento)
   - Gerenciamento automático de memória

### Exemplo de Uso

```javascript
import logger from '../utils/logger';

// Log de chamada de API
logger.apiCall('Supabase', 'select', { table: 'todos' });

// Log de sucesso
logger.info('Tarefa adicionada com sucesso');

// Log de erro com detalhes
logger.error('Erro ao adicionar tarefa', error);

// Log de aviso
logger.warn('Tentativa de acesso não autorizado');
```

### Vantagens

1. **Performance**
   - Evita sobrecarga de logs
   - Reduz uso de memória
   - Otimizado para produção

2. **Depuração**
   - Facilita identificação de problemas
   - Fornece contexto relevante
   - Formato consistente e legível

3. **Manutenção**
   - Código limpo e organizado
   - Fácil de estender
   - Centralizado em um único módulo

4. **Segurança**
   - Evita exposição de dados sensíveis
   - Diferenciação de ambientes
   - Controle de informações logadas

### Boas Práticas

1. **Uso em APIs**
   ```javascript
   try {
     logger.apiCall('Supabase', 'insert', { table: 'todos' });
     const { data, error } = await supabase.from('todos').insert(...);
     if (error) throw error;
     logger.info('Operação realizada com sucesso');
   } catch (error) {
     logger.error('Erro na operação', error);
     throw error;
   }
   ```

2. **Tratamento de Erros**
   ```javascript
   if (error) {
     logger.error('Erro ao processar requisição', {
       name: error.name,
       message: error.message,
       stack: error.stack
     });
     return;
   }
   ```

3. **Logs de API**
   ```javascript
   logger.apiCall('Supabase', 'select', {
     table: 'todos',
     filters: { user_id: userId }
   });
   ```

### Configuração

O sistema de logs pode ser configurado através de variáveis de ambiente:

```env
NODE_ENV=development  # Habilita logs detalhados
NODE_ENV=production  # Foca em logs críticos
```

### Contribuindo

Ao adicionar novas funcionalidades, siga estas diretrizes:

1. Use `logger.apiCall()` para todas as chamadas de API
2. Registre erros com `logger.error()`
3. Adicione logs informativos para operações importantes
4. Mantenha o formato consistente
5. Evite logs sensíveis em produção

## 4. Refatoração e Identidade Visual Goalmoon

Nesta etapa, realizamos uma importante refatoração do código e implementamos a identidade visual da Goalmoon, tornando a aplicação mais profissional e manutenível.

### 4.1 Componentização e Hooks Customizados

Reorganizamos a estrutura do projeto separando as responsabilidades em componentes e hooks específicos:

#### `components/todos/TodoForm.js`
```jsx
// Componente responsável pelo formulário de adição de tarefas
// Benefícios:
// - Isolamento da lógica de formulário
// - Reutilização em diferentes contextos
// - Manutenção simplificada
```

#### `components/todos/TodoList.js`
```jsx
// Componente para exibição e gerenciamento da lista de tarefas
// Benefícios:
// - Separação clara da lógica de listagem
// - Melhor organização do código
// - Facilita implementação de novas features
```

#### `hooks/useTodos.js`
```jsx
// Hook customizado para gerenciamento de estado e operações CRUD
// Benefícios:
// - Centralização da lógica de negócio
// - Reutilização de código
// - Melhor testabilidade
// - Separação clara entre UI e lógica
```

### 4.2 Identidade Visual Goalmoon

Implementamos o design system da Goalmoon, criando uma experiência visual consistente e profissional:

#### Paleta de Cores
```css
:root {
  --color-deep-navy: #374161;    /* Fundo principal */
  --color-dark-slate: #293047;   /* Fundo secundário */
  --color-blue-light: #6374AD;   /* Elementos interativos */
  --color-blue-lighter: #879FED; /* Destaques */
  --color-mint: #71b399;         /* Ações positivas */
}
```

#### Componentes Estilizados
- **Header**: Design moderno com logo proeminente
- **Formulários**: Campos com bordas suaves e feedback visual
- **Botões**: Estados hover e transições suaves
- **Cards**: Elevação sutil com sombras
- **Loading**: Spinner animado personalizado

### 4.3 Benefícios da Nova Estrutura

1. **Manutenibilidade**
   - Código mais organizado e modular
   - Facilidade para encontrar e corrigir bugs
   - Simplicidade para adicionar novas funcionalidades

2. **Performance**
   - Componentes otimizados
   - Menos re-renders desnecessários
   - Melhor gerenciamento de estado

3. **Experiência do Usuário**
   - Interface mais profissional
   - Feedback visual mais claro
   - Navegação mais intuitiva

4. **Desenvolvimento**
   - Código mais limpo e legível
   - Facilidade para trabalho em equipe
   - Melhor organização do projeto

### 4.4 Como Implementar

1. **Crie os Novos Componentes**
```bash
mkdir -p components/todos
touch components/todos/TodoForm.js
touch components/todos/TodoList.js
mkdir hooks
touch hooks/useTodos.js
```

2. **Implemente o Hook useTodos**
```javascript
// hooks/useTodos.js
export const useTodos = () => {
  // Implementação das operações CRUD
  // Gerenciamento de estado
  // Tratamento de erros
};
```

3. **Desenvolva os Componentes**
```javascript
// components/todos/TodoForm.js
// components/todos/TodoList.js
// Implemente a UI seguindo o design system
```

4. **Aplique os Estilos**
```css
/* styles/globals.css */
/* Adicione as variáveis de cores e estilos base */
```

### 4.5 Próximos Passos

- [ ] Implementar testes unitários para os novos componentes
- [ ] Adicionar documentação detalhada dos componentes
- [ ] Criar storybook para visualização dos componentes
- [ ] Implementar mais animações e transições

Esta nova estrutura não apenas melhora a qualidade do código, mas também estabelece uma base sólida para o crescimento futuro da aplicação, mantendo a consistência visual da marca Goalmoon.

## 5. Correções e Melhorias na Autenticação e Atualização de Registros

Durante o desenvolvimento, identificamos e corrigimos alguns problemas importantes relacionados à autenticação e atualização de registros. Vamos detalhar as correções necessárias:

### 5.1 Correção do Payload do Token JWT

No arquivo `pages/api/auth/[...auth0].js`, identificamos que o payload do token JWT estava usando `userId` em vez de `sub`, que é o que a política RLS do Supabase espera. Fizemos a seguinte correção:

```js
const payload = {
  sub: session.user.sub,
  exp: Math.floor(Date.now() / 1000) + 60 * 60,
  role: 'authenticated',
  roles: roles,
};
```

### 5.2 Otimização do Hook useFetchTodos

No arquivo `hooks/useTodos.js`, implementamos o `useCallback` para evitar recriações desnecessárias da função `fetchTodos`, que estava causando loops infinitos de chamadas à API:

```js
const fetchTodos = useCallback(async () => {
  try {
    const supabase = await getSupabase(user.accessToken);
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.sub);
    // ... resto do código
  } catch (error) {
    // ... tratamento de erro
  }
}, [user?.accessToken, user?.sub, router]);
```

### 5.3 Melhorias no Hook useEditTodo

Adicionamos validações e logs mais detalhados no hook `useEditTodo` para melhor diagnóstico de problemas:

```js
const editTodo = async (id, content) => {
  try {
    if (!user?.accessToken) {
      logger.error('Token de acesso não encontrado');
      throw new Error('Token de acesso não encontrado');
    }

    if (!user?.sub) {
      logger.error('ID do usuário não encontrado');
      throw new Error('ID do usuário não encontrado');
    }

    const supabase = await getSupabase(user.accessToken);
    
    logger.apiCall('Supabase', 'update', { 
      table: 'todos', 
      id, 
      content,
      user_id: user.sub 
    });
    
    const { data, error } = await supabase
      .from('todos')
      .update({ content })
      .eq('id', id)
      .eq('user_id', user.sub)
      .select();

    if (!data || data.length === 0) {
      logger.error('Nenhum dado retornado após atualização', {
        user_id: user.sub,
        todo_id: id
      });
      throw new Error('Nenhum dado retornado após atualização');
    }

    return data[0];
  } catch (error) {
    logger.error('Erro ao atualizar tarefa:', error);
    throw error;
  }
};
```

### 5.4 Melhorias no Gerenciamento de Estado

No arquivo `pages/index.js`, implementamos um mecanismo de cleanup no `useEffect` para evitar atualizações de estado em componentes desmontados:

```js
useEffect(() => {
  let isMounted = true;

  const loadTodos = async () => {
    if (!user) return;
    
    try {
      const todos = await fetchTodos();
      if (isMounted) {
        setTodos(todos);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  loadTodos();

  return () => {
    isMounted = false;
  };
}, [user, fetchTodos]);
```

### 5.5 Resumo das Correções

As principais correções implementadas foram:

1. **Correção do Token JWT**: Ajustamos o payload para usar `sub` em vez de `userId`, alinhando com as expectativas do Supabase.
2. **Otimização de Performance**: Implementamos `useCallback` para evitar loops infinitos de chamadas à API.
3. **Melhor Tratamento de Erros**: Adicionamos validações e logs mais detalhados para facilitar o diagnóstico de problemas.
4. **Prevenção de Memory Leaks**: Implementamos cleanup no `useEffect` para evitar atualizações de estado em componentes desmontados.

Estas correções resolveram os problemas de:
- Loops infinitos de chamadas à API
- Falha na atualização de registros por usuários comuns
- Possíveis memory leaks
- Melhor diagnóstico de erros de autenticação e autorização

Para aplicar estas correções, certifique-se de:
1. Reiniciar o servidor após as alterações
2. Fazer logout e login novamente para obter um novo token JWT com a estrutura correta
3. Testar as operações de CRUD tanto como admin quanto como usuário comum

### 5.6 Melhorias na Interface e Tratamento de Erros

Após identificar que usuários comuns ainda podiam ver o botão de exclusão, implementamos melhorias na interface e no tratamento de erros:

1. **Ocultação Condicional do Botão de Exclusão**
   - O botão de exclusão agora só é exibido para usuários Admin
   - Implementado através de renderização condicional no componente `TodoList`

2. **Validação Dupla de Permissões**
   - Interface: O botão não aparece para usuários não-admin
   - Backend: Validação adicional no handler de exclusão
   - Mensagem de erro clara quando usuário tenta excluir sem permissão

3. **Melhorias no Tratamento de Erros**
   - Mensagens de erro mais descritivas
   - Feedback visual imediato para o usuário
   - Logs mais detalhados para debugging

Exemplo de implementação:

```jsx
// No componente TodoList
{userRole === 'admin' && (
  <button
    className="todo-delete-button"
    onClick={() => {
      if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        onDelete(todo.id);
      }
    }}
  >
    Excluir
  </button>
)}

// No handler de exclusão
const handleDeleteTodo = async (id) => {
  try {
    if (currentUser.role !== 'admin') {
      setError('Você não tem permissão para excluir tarefas. Apenas administradores podem realizar esta operação.');
      return;
    }
    await deleteTodo(id);
    setTodos(todos.filter(todo => todo.id !== id));
  } catch (err) {
    setError(err.message || 'Erro ao excluir tarefa. Por favor, tente novamente.');
  }
};
```

Estas melhorias garantem que:
1. A interface reflita corretamente as permissões do usuário
2. Usuários recebam feedback claro sobre suas ações
3. A segurança seja mantida tanto no frontend quanto no backend
4. A experiência do usuário seja mais intuitiva e profissional

## 6. Testes Unitários

Para garantir a qualidade e confiabilidade do código, implementamos testes unitários usando Jest e React Testing Library. Os testes cobrem componentes e hooks principais da aplicação.

### 6.1 Configuração

O projeto utiliza as seguintes ferramentas de teste:
- Jest: Framework de teste
- React Testing Library: Biblioteca para testar componentes React
- jest-environment-jsdom: Ambiente DOM para testes
- @testing-library/user-event: Simulação de eventos do usuário

Para instalar as dependências:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 6.2 Estrutura dos Testes

Os testes estão organizados no diretório `__tests__`, seguindo a mesma estrutura do código fonte:
```
__tests__/
  ├── components/
  │   └── TodoList.test.js
  └── hooks/
      └── useTodos.test.js
```

### 6.3 Executando os Testes

Para executar os testes, use um dos seguintes comandos:
```bash
npm test           # Executa todos os testes uma vez
npm test:watch    # Executa os testes em modo watch
npm test:coverage # Executa os testes e gera relatório de cobertura
```

### 6.4 Exemplos de Testes

#### Testes de Componentes (TodoList)
- Renderização da lista vazia
- Renderização de todos
- Visibilidade do botão de exclusão baseada na role
- Interações de edição e exclusão

```javascript
test('botão de exclusão só aparece para admin', () => {
  const { rerender } = render(
    <TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />
  );
  expect(screen.queryAllByText('Excluir')).toHaveLength(0);

  rerender(
    <TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="admin" />
  );
  expect(screen.getAllByText('Excluir')).toHaveLength(2);
});
```

#### Testes de Hooks (useTodos)
- Busca de todos
- Adição de novos todos
- Edição de todos
- Exclusão de todos
- Tratamento de erros

```javascript
describe('useFetchTodos', () => {
  it('busca todos corretamente', async () => {
    const mockTodos = [
      { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
      { id: 2, content: 'Test todo 2', user_id: 'test-user-id' },
    ];

    mockSupabase.select.mockResolvedValueOnce({ data: mockTodos, error: null });

    const { result } = renderHook(() => useFetchTodos());

    await act(async () => {
      const todos = await result.current.fetchTodos();
      expect(todos).toEqual(mockTodos);
    });
  });
});
```

### 6.5 Mocks

Os testes utilizam mocks para:
- Auth0 (autenticação)
- Supabase (banco de dados)
- Next.js (Image, Router)
- Funções do navegador (window.prompt, window.confirm)

Isso permite testar componentes e hooks isoladamente, sem depender de serviços externos.


## 7. Implementando a Camada de Serviço

Após implementar a autenticação, autorização, interface e testes, vamos dar um passo importante na evolução da nossa arquitetura: a implementação de uma camada de serviço. Esta mudança vai melhorar a organização do código e facilitar a manutenção.

### 7.1 Por que uma Camada de Serviço?

Atualmente, nossa aplicação acessa o Supabase diretamente dos hooks, como mostrado no diagrama:

![Diagrama de Sequência Anterior](docs/sequence/sequencia-todo-20250323-01.png)

Esta abordagem funciona, mas apresenta alguns desafios:
- Código duplicado nas operações CRUD
- Dificuldade para manter consistência no tratamento de erros
- Acoplamento entre a lógica de negócio e o acesso ao banco de dados

### 7.2 Nova Arquitetura com TodoService

Vamos implementar uma camada de serviço que centraliza todas as operações CRUD:

![Diagrama de Sequência Atual](docs/sequence/sequencia-todo-20250323-02.png)

### 7.3 Implementação Passo a Passo

1. Primeiro, crie a pasta `services` e o arquivo `todoService.js`:
```bash
mkdir services
touch services/todoService.js
```

2. Implemente o `todoService.js`:
```javascript
import { getSupabase } from '../utils/supabase';
import logger from '../utils/logger';

export const todoService = {
  async getTodos(accessToken, userId) {
    try {
      const supabase = getSupabase(accessToken);
      const { data, error } = await supabase
        .from('todos')
        .select()
        .eq('user_id', userId);

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado');
      
      return data;
    } catch (error) {
      logger.error('Erro ao buscar tarefas:', error);
      throw error;
    }
  },

  async createTodo(accessToken, userId, content) {
    try {
      const supabase = getSupabase(accessToken);
      const { data, error } = await supabase
        .from('todos')
        .insert({ content, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado após criação');
      
      return data;
    } catch (error) {
      logger.error('Erro ao criar tarefa:', error);
      throw error;
    }
  },

  async updateTodo(accessToken, userId, id, content) {
    try {
      const supabase = getSupabase(accessToken);
      const { data, error } = await supabase
        .from('todos')
        .update({ content })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado após atualização');
      
      return data;
    } catch (error) {
      logger.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  },

  async deleteTodo(accessToken, userId, id) {
    try {
      const supabase = getSupabase(accessToken);
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Erro ao excluir tarefa:', error);
      throw error;
    }
  }
};

export default todoService;
```

3. Atualize o hook `useTodos` para utilizar o serviço:
```javascript
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import todoService from '../services/todoService';
import logger from '../utils/logger';

export function useTodos() {
  const { user } = useUser();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTodos = async () => {
      try {
        if (!user?.sub) return;
        const data = await todoService.getTodos(user.accessToken, user.sub);
        if (isMounted) {
          setTodos(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          logger.error('Erro ao buscar tarefas:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTodos();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const addTodo = async (content) => {
    try {
      const newTodo = await todoService.createTodo(user.accessToken, user.sub, content);
      setTodos([...todos, newTodo]);
      setError(null);
    } catch (err) {
      setError(err.message);
      logger.error('Erro ao adicionar tarefa:', err);
    }
  };

  const editTodo = async (id, content) => {
    try {
      const updatedTodo = await todoService.updateTodo(user.accessToken, user.sub, id, content);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      setError(null);
    } catch (err) {
      setError(err.message);
      logger.error('Erro ao editar tarefa:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(user.accessToken, user.sub, id);
      setTodos(todos.filter(todo => todo.id !== id));
      setError(null);
    } catch (err) {
      setError(err.message);
      logger.error('Erro ao excluir tarefa:', err);
    }
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    editTodo,
    deleteTodo
  };
}
```

### 7.4 Testes Unitários

Para garantir a qualidade do código, vamos criar testes para o `todoService` e o hook `useTodos`. Primeiro, instale as dependências necessárias:

```bash
npm install --save-dev @testing-library/react-hooks --legacy-peer-deps
```

1. Crie a estrutura de pastas para os testes:
```bash
mkdir -p __tests__/services __tests__/hooks
touch __tests__/services/todoService.test.js
touch __tests__/hooks/useTodos.test.js
```

2. Implemente o teste do `todoService`:
```javascript
// __tests__/services/todoService.test.js
import todoService from '../../services/todoService';
import { getSupabase } from '../../utils/supabase';

jest.mock('../../utils/supabase');
jest.mock('../../utils/logger', () => ({
  apiCall: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('todoService', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSupabase.mockReturnValue(mockSupabase);
  });

  describe('getTodos', () => {
    it('deve retornar lista de tarefas', async () => {
      const mockTodos = [{ id: 1, content: 'Test todo' }];
      mockSupabase.select.mockResolvedValueOnce({ data: mockTodos, error: null });

      const result = await todoService.getTodos('token', 'user123');
      expect(result).toEqual(mockTodos);
    });
  });

  describe('createTodo', () => {
    it('deve criar uma nova tarefa', async () => {
      const mockTodo = { id: 1, content: 'New todo' };
      mockSupabase.single.mockResolvedValueOnce({ data: mockTodo, error: null });

      const result = await todoService.createTodo('token', 'user123', 'New todo');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('updateTodo', () => {
    it('deve atualizar uma tarefa existente', async () => {
      const mockTodo = { id: 1, content: 'Updated todo' };
      mockSupabase.single.mockResolvedValueOnce({ data: mockTodo, error: null });

      const result = await todoService.updateTodo('token', 'user123', 1, 'Updated todo');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('deleteTodo', () => {
    it('deve excluir uma tarefa', async () => {
      mockSupabase.delete.mockResolvedValueOnce({ error: null });

      await expect(todoService.deleteTodo('token', 'user123', 1)).resolves.not.toThrow();
    });
  });
});
```

3. Implemente o teste do hook `useTodos`:
```javascript
// __tests__/hooks/useTodos.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useTodos } from '../../hooks/useTodos';
import todoService from '../../services/todoService';

jest.mock('@auth0/nextjs-auth0/client');
jest.mock('../../services/todoService');
jest.mock('../../utils/logger', () => ({
  error: jest.fn()
}));

describe('useTodos', () => {
  const mockUser = {
    sub: 'user123',
    accessToken: 'token123'
  };

  beforeEach(() => {
    useUser.mockReturnValue({ user: mockUser });
    jest.clearAllMocks();
  });

  it('deve carregar tarefas iniciais', async () => {
    const mockTodos = [{ id: 1, content: 'Test todo' }];
    todoService.getTodos.mockResolvedValueOnce(mockTodos);

    const { result, waitForNextUpdate } = renderHook(() => useTodos());
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.todos).toEqual(mockTodos);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve adicionar uma nova tarefa', async () => {
    const mockNewTodo = { id: 2, content: 'New todo' };
    todoService.createTodo.mockResolvedValueOnce(mockNewTodo);

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await result.current.addTodo('New todo');
    });

    expect(result.current.todos).toContainEqual(mockNewTodo);
  });

  it('deve atualizar uma tarefa existente', async () => {
    const mockUpdatedTodo = { id: 1, content: 'Updated todo' };
    todoService.updateTodo.mockResolvedValueOnce(mockUpdatedTodo);

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await result.current.editTodo(1, 'Updated todo');
    });

    expect(todoService.updateTodo).toHaveBeenCalledWith('token123', 'user123', 1, 'Updated todo');
  });

  it('deve excluir uma tarefa', async () => {
    todoService.deleteTodo.mockResolvedValueOnce();

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await result.current.deleteTodo(1);
    });

    expect(todoService.deleteTodo).toHaveBeenCalledWith('token123', 'user123', 1);
  });
});
```

Execute os testes com:
```bash
npm test
```

### 7.5 Benefícios da Nova Arquitetura

1. **Separação de Responsabilidades**: Cada camada tem um papel específico
2. **Reutilização de Código**: Operações CRUD centralizadas
3. **Consistência**: Tratamento de erros padronizado
4. **Testabilidade**: Facilidade para mockar o serviço nos testes

### 7.6 Próximos Passos

- [ ] Adicionar mais testes de integração
- [ ] Implementar cache de dados no serviço
- [ ] Adicionar validações de dados
- [ ] Melhorar o tratamento de erros

## Área Pública e Tratamento de Sessão

### Área Pública (Landing Page)

Implementamos uma área pública que serve como landing page da aplicação. Esta área é acessível para usuários não autenticados e fornece:

- Design minimalista com a identidade visual da Goalmoon
- Informações sobre as tecnologias utilizadas (Next.js, Supabase, Auth0)
- Botão de acesso ao sistema que redireciona para a autenticação Auth0
- Layout responsivo e moderno

### Estrutura de Layouts

Criamos uma hierarquia de layouts para melhor organização e reutilização de código:

```javascript
// BaseLayout - Configurações comuns para todas as páginas
components/layouts/BaseLayout.js
├── Meta tags
├── Título da aplicação
└── Preload de assets

// PublicLayout - Layout específico para área pública
components/layouts/PublicLayout.js
├── Cabeçalho com logo
├── Botão de login
└── Rodapé institucional
```

### Tratamento de Tokens e Sessão

Implementamos um sistema robusto para gerenciar tokens e sessões:

1. **Geração de Token Supabase**:
```javascript
// pages/api/auth/[...auth0].js
const supabaseExp = Math.min(
  decodedToken.exp,
  Math.floor(Date.now() / 1000) + 3600 // 1 hora
);

const payload = {
  sub: session.user.sub,
  exp: supabaseExp,
  role: 'authenticated',
  roles: roles,
};
```

2. **Controle de Expiração**:
- Token do Supabase configurado para expirar antes do token do Auth0
- Informações de expiração armazenadas na sessão para controle no frontend
- Redirecionamento automático para a landing page em caso de token expirado

3. **Tratamento de Erros**:
```javascript
// hooks/useTodos.js
if (err.message?.includes('JWT') || err.status === 401) {
  router.push('/');
  return;
}
```

### Fluxo de Autenticação

1. **Acesso Inicial**:
   - Usuário acessa a landing page (`/`)
   - Visualiza informações sobre a aplicação
   - Clica no botão "Entrar"

2. **Processo de Login**:
   - Redirecionamento para Auth0
   - Autenticação bem-sucedida gera token JWT
   - Callback do Auth0 gera token Supabase
   - Redirecionamento para dashboard

3. **Expiração de Sessão**:
   - Sistema monitora constantemente a validade dos tokens
   - Em caso de expiração, usuário é redirecionado para landing page
   - Mensagens de erro claras informam o status da sessão

### Benefícios

- **Experiência do Usuário**:
  - Transições suaves entre estados autenticado/não autenticado
  - Interface consistente e responsiva
  - Feedback claro sobre o status da sessão

- **Segurança**:
  - Tokens são gerenciados de forma segura
  - Roles são validadas em múltiplas camadas
  - Sessões são limpas adequadamente

- **Manutenibilidade**:
  - Código organizado em componentes reutilizáveis
  - Separação clara entre área pública e privada
  - Logs detalhados para debugging

### Próximos Passos

- Implementar refresh token automático
- Adicionar mais informações institucionais na landing page
- Melhorar feedback visual durante transições de autenticação

## 8. Correção do Mecanismo de Autenticação e RBAC

### Visão Geral do Sistema

O sistema implementa um mecanismo robusto de autenticação e RBAC (Role-Based Access Control) utilizando Auth0 e Supabase. O fluxo funciona da seguinte forma:

1. **Autenticação com Auth0**:
   - O usuário faz login através do Auth0
   - O Auth0 gera um JWT contendo as roles do usuário
   - O token é armazenado na sessão do usuário

2. **Integração com Supabase**:
   - Um token específico para o Supabase é gerado usando o JWT do Auth0
   - O token do Supabase inclui as roles do usuário
   - O Supabase valida o token e aplica as políticas de RLS baseadas nas roles

3. **Controle de Acesso**:
   - As roles definem quais operações o usuário pode realizar
   - O RLS do Supabase garante que apenas usuários autorizados acessem os dados
   - A interface se adapta às roles do usuário

### Componentes Principais

#### 1. `pages/api/auth/[...auth0].js`
Este arquivo é crucial para o processo de autenticação:

```javascript
const afterCallback = async (req, res, session) => {
  // Decodifica o token do Auth0
  const decodedToken = jwt.decode(session.idToken);
  
  // Gera um token específico para o Supabase
  const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);
  
  // Adiciona o token à sessão
  session.user.accessToken = supabaseToken;
  return session;
};
```

**Funções principais**:
- Gerencia o fluxo de autenticação do Auth0
- Gera o token do Supabase com as roles do usuário
- Configura a sessão do usuário

#### 2. `utils/supabase.js`
Gerencia a conexão com o Supabase:

```javascript
let supabaseClient = null;

export const getSupabase = (accessToken) => {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }
  
  // Atualiza o token de autorização
  supabaseClient.auth.setSession({
    access_token: accessToken,
    refresh_token: null
  });
  
  return supabaseClient;
};
```

**Funções principais**:
- Mantém uma única instância do cliente Supabase
- Atualiza o token de autorização quando necessário
- Evita problemas de token expirado

### Controle de Expiração do Token

O sistema implementa um mecanismo robusto de controle de expiração:

1. **Token do Auth0**:
   - Tem um tempo de vida padrão configurado no Auth0
   - É renovado automaticamente pelo Auth0

2. **Token do Supabase**:
   - Expira antes do token do Auth0 (1 hora)
   - É gerado com as roles do usuário
   - É atualizado quando necessário

3. **Tratamento de Erros**:
   - Verifica a expiração do token antes das operações
   - Redireciona para logout se o token estiver próximo de expirar
   - Implementa retry mechanism para operações falhas

### Área Logada

O sistema implementa uma área logada protegida:

1. **Middleware de Proteção**:
   - Verifica a autenticação do usuário
   - Redireciona para login se não autenticado
   - Mantém o estado da sessão

2. **Componentes Protegidos**:
   - Só são acessíveis a usuários autenticados
   - Adaptam-se às roles do usuário
   - Implementam tratamento de erros de autenticação

3. **Fluxo de Navegação**:
   - Usuários não autenticados são redirecionados para login
   - Usuários autenticados têm acesso ao dashboard
   - Logout limpa a sessão e redireciona para home

### Boas Práticas Implementadas

1. **Segurança**:
   - Tokens são gerenciados de forma segura
   - Roles são validadas em múltiplas camadas
   - Sessões são limpas adequadamente

2. **Performance**:
   - Cliente Supabase é reutilizado
   - Tokens são atualizados apenas quando necessário
   - Cache é gerenciado eficientemente

3. **Manutenibilidade**:
   - Código é modular e bem organizado
   - Logs detalhados para debug
   - Tratamento de erros robusto

### Solução de Problemas Comuns

1. **Token Expirado**:
   - Verifique os logs do Auth0
   - Confirme as configurações de expiração
   - Verifique o fluxo de renovação

2. **Roles não Aplicadas**:
   - Verifique o namespace no Auth0
   - Confirme as roles no token
   - Valide as políticas RLS

3. **Loop de Autenticação**:
   - Verifique o cliente Supabase
   - Confirme o gerenciamento de sessão
   - Valide os redirecionamentos

