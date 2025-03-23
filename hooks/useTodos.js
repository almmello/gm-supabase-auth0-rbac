import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { getSupabase } from '../utils/supabase';
import logger from '../utils/logger';
import { useCallback } from 'react';

export const useFetchTodos = () => {
  const { user } = useUser();
  const router = useRouter();

  const fetchTodos = useCallback(async () => {
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
  }, [user?.accessToken, user?.sub, router]);

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

      if (error) {
        logger.error('Erro ao atualizar tarefa:', {
          error,
          user_id: user.sub,
          todo_id: id
        });
        if (error.message.includes('JWT')) {
          router.push('/api/auth/login');
          return null;
        }
        throw error;
      }

      if (!data || data.length === 0) {
        logger.error('Nenhum dado retornado após atualização', {
          user_id: user.sub,
          todo_id: id
        });
        throw new Error('Nenhum dado retornado após atualização');
      }

      logger.info('Tarefa atualizada com sucesso:', data[0]);
      return data[0];
    } catch (error) {
      logger.error('Erro ao atualizar tarefa:', error);
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