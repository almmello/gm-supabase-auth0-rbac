import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { todoService } from '../services/todoService';
import logger from '../utils/logger';

export function useTodos() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(async () => {
    try {
      if (authLoading || !user?.sub) return;
      
      // Verifica se o token está próximo de expirar (5 minutos)
      const tokenExp = user.accessToken ? JSON.parse(atob(user.accessToken.split('.')[1])).exp : 0;
      const now = Math.floor(Date.now() / 1000);
      
      if (tokenExp - now < 300) { // 5 minutos
        logger.warn('Token próximo de expirar, redirecionando para login');
        router.push('/api/auth/logout');
        return;
      }

      const data = await todoService.getTodos(user.accessToken, user.sub);
      setTodos(data);
      setError(null);
    } catch (err) {
      logger.error('Erro ao buscar tarefas:', err);
      
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/api/auth/logout');
        return;
      }
      
      setError('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (content) => {
    try {
      const newTodo = await todoService.createTodo(user.accessToken, user.sub, content);
      setTodos(prevTodos => [...prevTodos, newTodo]);
      setError(null);
      return newTodo;
    } catch (err) {
      logger.error('Erro ao adicionar tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/api/auth/logout');
        return;
      }
      setError('Erro ao adicionar tarefa');
      throw err;
    }
  };

  const editTodo = async (id, content) => {
    try {
      const updatedTodo = await todoService.updateTodo(user.accessToken, user.sub, id, content);
      setTodos(prevTodos => prevTodos.map(todo => todo.id === id ? updatedTodo : todo));
      setError(null);
      return updatedTodo;
    } catch (err) {
      logger.error('Erro ao editar tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/api/auth/logout');
        return;
      }
      setError('Erro ao editar tarefa');
      throw err;
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(user.accessToken, user.sub, id);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      setError(null);
    } catch (err) {
      logger.error('Erro ao excluir tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/api/auth/logout');
        return;
      }
      setError('Erro ao excluir tarefa');
      throw err;
    }
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    editTodo,
    deleteTodo,
    refetch: fetchTodos
  };
} 