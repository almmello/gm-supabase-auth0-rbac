import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchTodos = async () => {
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
        if (isMounted) {
          setTodos(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          logger.error('Erro ao buscar tarefas:', err);
          
          if (err.message?.includes('JWT') || err.status === 401) {
            if (retryCount < maxRetries) {
              retryCount++;
              logger.info(`Tentativa ${retryCount} de ${maxRetries} de renovar o token`);
              // Aguarda 1 segundo antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 1000));
              fetchTodos();
            } else {
              logger.error('Número máximo de tentativas atingido, redirecionando para login');
              router.push('/api/auth/logout');
            }
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
  }, [user, router, authLoading]);

  const addTodo = async (content) => {
    try {
      const newTodo = await todoService.createTodo(user.accessToken, user.sub, content);
      setTodos([...todos, newTodo]);
      setError(null);
    } catch (err) {
      logger.error('Erro ao adicionar tarefa:', err);
      if (err.message?.includes('JWT') || err.status === 401) {
        router.push('/api/auth/logout');
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
        router.push('/api/auth/logout');
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
        router.push('/api/auth/logout');
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