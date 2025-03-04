# Adicionando RBAC (Role-Based Access Control) com Auth0 e Supabase em Next.js 15

Neste tutorial, vamos implementar controle de acesso por funções (RBAC) em um projeto **Next.js 15** integrado com **Auth0** (para autenticação) e **Supabase** (banco de dados PostgreSQL + API). Teremos dois papéis de usuário: **Admin** e **Usuário comum**, com permissões diferentes. Abordaremos:

1. **Configuração do Auth0 para incluir *roles* no JWT** – adicionando as roles de usuário (Admin ou Usuário) no token JWT retornado pelo Auth0, de forma que o Supabase possa utilizá-las.
2. **Políticas de Row Level Security (RLS) no Supabase** – criação de políticas de acesso no PostgreSQL baseadas nas roles presentes no JWT (Admin com acesso total CRUD; Usuário comum pode criar, ler e editar, porém não excluir).
3. **Integração no Next.js** – uso do JWT no aplicativo Next.js para acessar o Supabase com as credenciais corretas e ajustes na interface para habilitar/ocultar funcionalidades conforme a role do usuário.
4. **Boas práticas de segurança** – garantir validade do JWT, evitar exposições desnecessárias de dados sensíveis e outras dicas de segurança e performance na integração.

Cada seção trará exemplos de código e explicações claras de cada etapa. Vamos começar! 🎯

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
