import { getSupabase } from '../utils/supabase';

export const todoService = {
  /**
   * Busca todas as tarefas do usuário
   * @param {string} accessToken - Token de acesso do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de tarefas
   */
  async getTodos(accessToken, userId) {
    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('todos')
      .select()
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Cria uma nova tarefa
   * @param {string} accessToken - Token de acesso do usuário
   * @param {string} userId - ID do usuário
   * @param {string} content - Conteúdo da tarefa
   * @returns {Promise<Object>} Tarefa criada
   */
  async createTodo(accessToken, userId, content) {
    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('todos')
      .insert({ content, user_id: userId })
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado retornado após criação');
    }
    return data[0];
  },

  /**
   * Atualiza uma tarefa existente
   * @param {string} accessToken - Token de acesso do usuário
   * @param {string} userId - ID do usuário
   * @param {number} id - ID da tarefa
   * @param {string} content - Novo conteúdo da tarefa
   * @returns {Promise<Object>} Tarefa atualizada
   */
  async updateTodo(accessToken, userId, id, content) {
    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('todos')
      .update({ content })
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Nenhum dado retornado após atualização');
    }
    return data[0];
  },

  /**
   * Exclui uma tarefa
   * @param {string} accessToken - Token de acesso do usuário
   * @param {string} userId - ID do usuário
   * @param {number} id - ID da tarefa
   * @returns {Promise<void>}
   */
  async deleteTodo(accessToken, userId, id) {
    const supabase = await getSupabase(accessToken);
    const { error } = await supabase
      .from('todos')
      .delete()
      .match({ id, user_id: userId });

    if (error) throw error;
  }
}; 