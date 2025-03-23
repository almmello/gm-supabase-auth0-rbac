import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { todoService } from '../services/todoService';
import logger from '../utils/logger';

export function useTodos() {
  const { user, error: userError } = useUser();
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = async () => {
    try {
      if (!user) return;
      const data = await todoService.getTodos(user.accessToken, user.sub);
      setTodos(data);
    } catch (error) {
      logger.error('Erro ao buscar tarefas:', error);
      setError('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (content) => {
    try {
      if (!user) return;
      const newTodo = await todoService.createTodo(user.accessToken, user.sub, content);
      setTodos(prev => [...prev, newTodo]);
      return newTodo;
    } catch (error) {
      logger.error('Erro ao adicionar tarefa:', error);
      setError('Erro ao adicionar tarefa');
    }
  };

  const editTodo = async (id, content) => {
    try {
      if (!user) return;
      const updatedTodo = await todoService.updateTodo(user.accessToken, user.sub, id, content);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
      return updatedTodo;
    } catch (error) {
      logger.error('Erro ao editar tarefa:', error);
      setError('Erro ao editar tarefa');
    }
  };

  const deleteTodo = async (id) => {
    try {
      if (!user) return;
      await todoService.deleteTodo(user.accessToken, user.sub, id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      logger.error('Erro ao excluir tarefa:', error);
      setError('Erro ao excluir tarefa');
    }
  };

  useEffect(() => {
    if (userError) {
      setError('Erro ao carregar usuário');
      setLoading(false);
      return;
    }

    fetchTodos();
  }, [user]);

  return {
    todos,
    loading,
    error,
    addTodo,
    editTodo,
    deleteTodo,
    refreshTodos: fetchTodos
  };
} 