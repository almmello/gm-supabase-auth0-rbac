import { renderHook, act } from '@testing-library/react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useFetchTodos, useAddTodo, useEditTodo, useDeleteTodo } from '../../hooks/useTodos';

// Mock do useUser
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));

// Mock do router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock da função getSupabase
jest.mock('../../utils/supabase', () => ({
  getSupabase: jest.fn(),
}));

describe('useTodos hooks', () => {
  const mockUser = {
    sub: 'test-user-id',
    accessToken: 'test-token',
    'gm-supabase-tutorial.us.auth0.com/roles': ['user'],
  };

  // Mock do Supabase client com todos os métodos necessários
  const createSupabaseMock = () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockDelete = jest.fn().mockReturnThis();
    const mockInsert = jest.fn().mockReturnThis();
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();

    const mockFrom = jest.fn().mockReturnValue({
      select: () => ({
        eq: (field, value) => ({
          data: [],
          error: null,
        }),
      }),
      delete: () => ({
        match: (conditions) => ({
          data: null,
          error: null,
        }),
      }),
      insert: (data) => ({
        select: () => ({
          data: [{ ...data, id: 1 }],
          error: null,
        }),
      }),
      update: (data) => ({
        eq: (field, value) => ({
          eq: (field2, value2) => ({
            select: () => ({
              data: [{ ...data, id: value, user_id: value2 }],
              error: null,
            }),
          }),
        }),
      }),
    });

    return {
      from: mockFrom,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue({ user: mockUser });
    // Configurar o mock do getSupabase para cada teste
    require('../../utils/supabase').getSupabase.mockResolvedValue(createSupabaseMock());
  });

  describe('useFetchTodos', () => {
    it('busca todos corretamente', async () => {
      const mockTodos = [
        { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
        { id: 2, content: 'Test todo 2', user_id: 'test-user-id' },
      ];

      const supabaseMock = createSupabaseMock();
      supabaseMock.from().select = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockTodos, error: null }),
      });

      require('../../utils/supabase').getSupabase.mockResolvedValueOnce(supabaseMock);

      const { result } = renderHook(() => useFetchTodos());

      await act(async () => {
        const todos = await result.current.fetchTodos();
        expect(todos).toEqual(mockTodos);
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('todos');
    });

    it('lida com erros na busca', async () => {
      const supabaseMock = createSupabaseMock();
      supabaseMock.from().select = jest.fn().mockReturnValue({
        eq: jest.fn().mockRejectedValue(new Error('Erro ao buscar')),
      });

      require('../../utils/supabase').getSupabase.mockResolvedValueOnce(supabaseMock);

      const { result } = renderHook(() => useFetchTodos());

      await act(async () => {
        try {
          await result.current.fetchTodos();
          fail('Deveria ter lançado um erro');
        } catch (error) {
          expect(error.message).toBe('Erro ao buscar');
        }
      });
    });
  });

  describe('useAddTodo', () => {
    it('adiciona todo corretamente', async () => {
      const newTodo = { id: 1, content: 'New todo', user_id: 'test-user-id' };
      
      const supabaseMock = createSupabaseMock();
      supabaseMock.from().insert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [newTodo], error: null }),
      });

      require('../../utils/supabase').getSupabase.mockResolvedValueOnce(supabaseMock);

      const { result } = renderHook(() => useAddTodo());

      await act(async () => {
        const todo = await result.current.addTodo('New todo');
        expect(todo).toEqual(newTodo);
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('todos');
    });
  });

  describe('useEditTodo', () => {
    it('edita todo corretamente', async () => {
      const updatedTodo = { id: 1, content: 'Updated todo', user_id: 'test-user-id' };
      
      const supabaseMock = createSupabaseMock();
      supabaseMock.from().update = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: [updatedTodo], error: null }),
          }),
        }),
      });

      require('../../utils/supabase').getSupabase.mockResolvedValueOnce(supabaseMock);

      const { result } = renderHook(() => useEditTodo());

      await act(async () => {
        const todo = await result.current.editTodo(1, 'Updated todo');
        expect(todo).toEqual(updatedTodo);
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('todos');
    });
  });

  describe('useDeleteTodo', () => {
    it('deleta todo corretamente', async () => {
      const supabaseMock = createSupabaseMock();
      supabaseMock.from().delete = jest.fn().mockReturnValue({
        match: jest.fn().mockResolvedValue({ error: null }),
      });

      require('../../utils/supabase').getSupabase.mockResolvedValueOnce(supabaseMock);

      const { result } = renderHook(() => useDeleteTodo());

      await act(async () => {
        await result.current.deleteTodo(1);
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('todos');
      expect(supabaseMock.from().delete).toHaveBeenCalled();
      expect(supabaseMock.from().delete().match).toHaveBeenCalledWith({
        id: 1,
        user_id: mockUser.sub,
      });
    });
  });
}); 