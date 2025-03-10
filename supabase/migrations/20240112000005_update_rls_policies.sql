-- Atualização de política para SELECT: Admin pode ver todos; usuário vê apenas seus próprios
DROP POLICY IF EXISTS "Todos_Select_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Select_Admin_ou_Proprio"
ON public.todos
FOR SELECT
USING (
  (auth.jwt() -> 'gm-supabase-tutorial.us.auth0.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para INSERT: Admin insere qualquer, usuário somente se for o dono
DROP POLICY IF EXISTS "Todos_Insert_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Insert_Admin_ou_Proprio"
ON public.todos
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'gm-supabase-tutorial.us.auth0.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para UPDATE: Admin pode atualizar qualquer, usuário apenas seus próprios
DROP POLICY IF EXISTS "Todos_Update_Admin_ou_Proprio" ON public.todos;
CREATE POLICY "Todos_Update_Admin_ou_Proprio"
ON public.todos
FOR UPDATE
USING (
  (auth.jwt() -> 'gm-supabase-tutorial.us.auth0.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
)
WITH CHECK (
  (auth.jwt() -> 'gm-supabase-tutorial.us.auth0.com/roles') @> '["admin"]'::jsonb
  OR (auth.jwt() ->> 'sub' = user_id)
);

-- Atualização de política para DELETE: apenas Admin
DROP POLICY IF EXISTS "Todos_Delete_Admin" ON public.todos;
CREATE POLICY "Todos_Delete_Admin"
ON public.todos
FOR DELETE
USING (
  (auth.jwt() -> 'gm-supabase-tutorial.us.auth0.com/roles') @> '["admin"]'::jsonb
);