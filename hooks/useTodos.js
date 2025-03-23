import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { todoService } from '../services/todoService';
import logger from '../utils/logger';

export function useTodos() {
  const { user } = useUser();
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTodos = async () => {
      try {
        if (!user?.sub) return;
        
        // Usa o token do Supabase que foi gerado no callback do Auth0
        const data = await todoService.getTodos(user.accessToken, user.sub);
        if (isMounted) {
          setTodos(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          logger.error('Erro ao buscar tarefas:', err);
          // Se o erro for de JWT expirado ou não autorizado, redireciona para a página inicial
          if (err.message?.includes('JWT') || err.status === 401) {
            router.push('/');
            return;
          }
          setError('Erro ao carregar tarefas');
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
  }, [user, router]);

  const addTodo = async (content) => {
    try {
      const newTodo = await todoService.createTodo(user.accessToken, user.sub, content);
      setTodos([...todos, newTodo]);
      setError(null);
    } catch (err) {
      logger.error('Erro ao adicionar tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/');
        return;
      }
      setError('Erro ao adicionar tarefa');
    }
  };

  const editTodo = async (id, content) => {
    try {
      const updatedTodo = await todoService.updateTodo(user.accessToken, user.sub, id, content);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      setError(null);
    } catch (err) {
      logger.error('Erro ao editar tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/');
        return;
      }
      setError('Erro ao editar tarefa');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(user.accessToken, user.sub, id);
      setTodos(todos.filter(todo => todo.id !== id));
      setError(null);
    } catch (err) {
      logger.error('Erro ao excluir tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/');
        return;
      }
      setError('Erro ao excluir tarefa');
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