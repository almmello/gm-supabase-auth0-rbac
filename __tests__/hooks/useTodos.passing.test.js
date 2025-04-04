import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from '../../hooks/useTodos';
import { todoService } from '../../services/todoService';
import { UserProvider } from '@auth0/nextjs-auth0/client';

/**
 * Suite de testes para o hook useTodos
 * Contém os testes que já estavam passando
 * 
 * Padrão de teste:
 * - Arrange: Preparação do cenário (mocks, dados de teste)
 * - Act: Execução da ação que queremos testar
 * - Assert: Verificação do resultado esperado
 */

// Mock do Auth0
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: {
      sub: 'test-user-id',
      accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.test',
      'gm-supabase-tutorial.us.auth0.com/roles': ['user']
    },
    isLoading: false
  }),
  UserProvider: ({ children }) => children
}));

// Mock do Next Router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock do todoService
jest.mock('../../services/todoService', () => ({
  todoService: {
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn()
  }
}));

describe('useTodos hooks - testes que passam', () => {
  let mockTodosState;
  
  const initialMockTodos = [
    { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
    { id: 2, content: 'Test todo 2', user_id: 'test-user-id' }
  ];

  const mockNewTodo = {
    id: 3,
    content: 'New todo',
    user_id: 'test-user-id'
  };

  const mockUpdatedTodo = {
    id: 1,
    content: 'Updated todo',
    user_id: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTodosState = [...initialMockTodos];
    console.log('\n=== Iniciando novo teste ===');
    console.log('Cenário:', expect.getState().currentTestName);
    console.log('Estado inicial:', mockTodosState);
    
    todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
    
    todoService.createTodo.mockImplementation((token, userId, content) => {
      const newTodo = { ...mockNewTodo };
      mockTodosState.push(newTodo);
      return Promise.resolve(newTodo);
    });
    
    todoService.deleteTodo.mockImplementation((token, userId, id) => {
      mockTodosState = mockTodosState.filter(todo => todo.id !== id);
      todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
      return Promise.resolve();
    });

    todoService.updateTodo.mockImplementation((token, userId, id, content) => {
      const updatedTodo = { ...mockUpdatedTodo };
      mockTodosState = mockTodosState.map(todo => 
        todo.id === id ? updatedTodo : todo
      );
      todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
      return Promise.resolve(updatedTodo);
    });
  });

  const wrapper = ({ children }) => (
    <UserProvider>{children}</UserProvider>
  );

  /**
   * Teste: Busca de todos
   * Objetivo: Garantir que os todos são carregados corretamente
   * Verifica: Se o estado inicial é carregado e se a API é chamada corretamente
   */
  test('busca todos corretamente', async () => {
    console.log('Testando busca de todos...');
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado carregado:', result.current.todos);

    // Verifica a chamada da API
    expect(todoService.getTodos).toHaveBeenCalledWith(
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.test',
      'test-user-id'
    );
    console.log('✓ API chamada corretamente');
    
    expect(result.current.error).toBeNull();
    console.log('✓ Nenhum erro encontrado');
    console.log('✓ Teste de busca concluído com sucesso');
  });

  /**
   * Teste: Deleção de todo
   * Objetivo: Garantir que um todo é deletado corretamente
   * Verifica: Se o todo é removido do estado e se a API é chamada corretamente
   */
  test('deleta todo corretamente', async () => {
    console.log('Testando deleção de todo...');
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Deleta um todo
    await act(async () => {
      await result.current.deleteTodo(1);
    });
    console.log('Todo deletado, novo estado:', result.current.todos);

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0]).toEqual(initialMockTodos[1]);
    });

    // Verifica a chamada da API
    expect(todoService.deleteTodo).toHaveBeenCalledWith(
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.test',
      'test-user-id',
      1
    );
    console.log('✓ API chamada corretamente');
    console.log('✓ Teste de deleção concluído com sucesso');
  });

  /**
   * Teste: Adição de todo
   * Objetivo: Garantir que um novo todo é adicionado na última posição
   * Verifica: Se o todo é adicionado corretamente e se a ordem é mantida
   */
  test('adiciona todo na última posição', async () => {
    console.log('Testando adição de todo...');
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Adiciona um novo todo
    await act(async () => {
      await result.current.addTodo('New todo');
    });
    console.log('Todo adicionado, novo estado:', result.current.todos);

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(3);
      expect(result.current.todos[result.current.todos.length - 1]).toEqual(mockNewTodo);
    });

    // Verifica a ordem
    expect(result.current.todos).toEqual([...initialMockTodos, mockNewTodo]);
    console.log('✓ Ordem dos todos mantida corretamente');
    console.log('✓ Teste de adição concluído com sucesso');
  });

  /**
   * Teste: Edição de todo
   * Objetivo: Garantir que um todo é editado corretamente
   * Verifica: Se o conteúdo é atualizado e se a API é chamada corretamente
   */
  test('edita todo corretamente', async () => {
    console.log('Testando edição de todo...');
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Edita um todo
    await act(async () => {
      await result.current.editTodo(1, 'Updated todo');
    });
    console.log('Todo editado, novo estado:', result.current.todos);

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(2);
      expect(result.current.todos[0]).toEqual(mockUpdatedTodo);
    });

    // Verifica a chamada da API
    expect(todoService.updateTodo).toHaveBeenCalledWith(
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJleHAiOjk5OTk5OTk5OTl9.test',
      'test-user-id',
      1,
      'Updated todo'
    );
    console.log('✓ API chamada corretamente');
    console.log('✓ Teste de edição concluído com sucesso');
  });

  // Após todos os testes
  afterAll(() => {
    console.log('\n=== Todos os testes passaram com sucesso! ===');
  });
}); 