import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { getSupabase } from '../utils/supabase';
import logger from '../utils/logger';

export const useFetchTodos = () => {
  const { user } = useUser();
  const router = useRouter();

  const fetchTodos = async () => {
    try {
      const supabase = await getSupabase(user.accessToken);
      
      logger.apiCall('Supabase', 'select', { table: 'todos' });
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.sub);

      if (error) {
        if (error.message.includes('JWT')) {
          router.push('/api/auth/login');
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar tarefas', error);
      throw error;
    }
  };

  return { fetchTodos };
};

export const useAddTodo = () => {
  const { user } = useUser();
  const router = useRouter();

  const addTodo = async (content) => {
    try {
      const supabase = await getSupabase(user.accessToken);
      
      logger.apiCall('Supabase', 'insert', { table: 'todos', content });
      
      const { data, error } = await supabase
        .from('todos')
        .insert({ content, user_id: user.sub })
        .select();

      if (error) {
        if (error.message.includes('JWT')) {
          router.push('/api/auth/login');
          return null;
        }
        throw error;
      }

      logger.info('Tarefa adicionada com sucesso');
      return data[0];
    } catch (error) {
      logger.error('Erro ao adicionar tarefa', error);
      throw error;
    }
  };

  return { addTodo };
};

export const useEditTodo = () => {
  const { user } = useUser();
  const router = useRouter();

  const editTodo = async (id, content) => {
    try {
      const supabase = await getSupabase(user.accessToken);
      
      logger.apiCall('Supabase', 'update', { table: 'todos', id, content });
      
      const { data, error } = await supabase
        .from('todos')
        .update({ content })
        .eq('id', id)
        .eq('user_id', user.sub)
        .select();

      if (error) {
        if (error.message.includes('JWT')) {
          router.push('/api/auth/login');
          return null;
        }
        throw error;
      }

      logger.info('Tarefa atualizada com sucesso');
      return data[0];
    } catch (error) {
      logger.error('Erro ao atualizar tarefa', error);
      throw error;
    }
  };

  return { editTodo };
};

export const useDeleteTodo = () => {
  const { user } = useUser();
  const router = useRouter();

  const deleteTodo = async (id) => {
    try {
      const supabase = await getSupabase(user.accessToken);
      
      logger.apiCall('Supabase', 'delete', { table: 'todos', id });
      
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.sub);

      if (error) {
        if (error.message.includes('JWT')) {
          router.push('/api/auth/login');
          return;
        }
        throw error;
      }

      logger.info('Tarefa excluída com sucesso');
    } catch (error) {
      logger.error('Erro ao excluir tarefa', error);
      throw error;
    }
  };

  return { deleteTodo };
}; 