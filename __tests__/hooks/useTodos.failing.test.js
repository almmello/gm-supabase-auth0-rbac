import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodos } from '../../hooks/useTodos';
import { todoService } from '../../services/todoService';
import { UserProvider } from '@auth0/nextjs-auth0/client';

/**
 * Suite de testes para o hook useTodos
 * Contém os testes que ainda precisam ser corrigidos
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

describe('useTodos hooks - testes que falham', () => {
  let mockTodosState;
  
  const initialMockTodos = [
    { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
    { id: 2, content: 'Test todo 2', user_id: 'test-user-id' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTodosState = [...initialMockTodos];
    console.log('\n=== Iniciando novo teste ===');
    console.log('Cenário:', expect.getState().currentTestName);
    console.log('Estado inicial:', mockTodosState);
  });

  const wrapper = ({ children }) => (
    <UserProvider>{children}</UserProvider>
  );

  /**
   * Teste: Erro ao buscar todos
   * Objetivo: Garantir que o hook lida corretamente com erros na busca
   * Verifica: Se o estado de erro é atualizado corretamente
   */
  test('lida com erro ao buscar todos', async () => {
    console.log('Testando erro na busca de todos...');
    
    // Configura o mock para lançar um erro
    todoService.getTodos.mockImplementation(() => 
      Promise.reject(new Error('Erro ao buscar todos'))
    );
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado de erro
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe('Erro ao buscar todos');
    });
    console.log('Erro capturado:', result.current.error);

    // Verifica se o estado de loading foi atualizado
    expect(result.current.loading).toBe(false);
    console.log('✓ Estado de loading atualizado corretamente');
    console.log('✓ Teste de erro na busca concluído com sucesso');
  });

  /**
   * Teste: Erro ao adicionar todo
   * Objetivo: Garantir que o hook lida corretamente com erros na adição
   * Verifica: Se o estado de erro é atualizado e se a lista não é modificada
   */
  test('lida com erro ao adicionar todo', async () => {
    console.log('Testando erro na adição de todo...');
    
    // Configura o mock para buscar todos corretamente
    todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
    
    // Configura o mock para lançar um erro na criação
    todoService.createTodo.mockImplementation(() => 
      Promise.reject(new Error('Erro ao adicionar todo'))
    );
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Tenta adicionar um todo
    await act(async () => {
      await result.current.addTodo('New todo');
    });
    console.log('Tentativa de adição falhou');

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe('Erro ao adicionar todo');
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('✓ Erro capturado e lista não modificada');
    console.log('✓ Teste de erro na adição concluído com sucesso');
  });

  /**
   * Teste: Erro ao editar todo
   * Objetivo: Garantir que o hook lida corretamente com erros na edição
   * Verifica: Se o estado de erro é atualizado e se a lista não é modificada
   */
  test('lida com erro ao editar todo', async () => {
    console.log('Testando erro na edição de todo...');
    
    // Configura o mock para buscar todos corretamente
    todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
    
    // Configura o mock para lançar um erro na edição
    todoService.updateTodo.mockImplementation(() => 
      Promise.reject(new Error('Erro ao editar todo'))
    );
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Tenta editar um todo
    await act(async () => {
      await result.current.editTodo(1, 'Updated todo');
    });
    console.log('Tentativa de edição falhou');

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe('Erro ao editar todo');
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('✓ Erro capturado e lista não modificada');
    console.log('✓ Teste de erro na edição concluído com sucesso');
  });

  /**
   * Teste: Erro ao deletar todo
   * Objetivo: Garantir que o hook lida corretamente com erros na deleção
   * Verifica: Se o estado de erro é atualizado e se a lista não é modificada
   */
  test('lida com erro ao deletar todo', async () => {
    console.log('Testando erro na deleção de todo...');
    
    // Configura o mock para buscar todos corretamente
    todoService.getTodos.mockImplementation(() => Promise.resolve(mockTodosState));
    
    // Configura o mock para lançar um erro na deleção
    todoService.deleteTodo.mockImplementation(() => 
      Promise.reject(new Error('Erro ao deletar todo'))
    );
    
    // Renderiza o hook
    const { result } = renderHook(() => useTodos(), { wrapper });
    console.log('Hook renderizado');

    // Aguarda o estado inicial carregar
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('Estado inicial carregado:', result.current.todos);

    // Tenta deletar um todo
    await act(async () => {
      await result.current.deleteTodo(1);
    });
    console.log('Tentativa de deleção falhou');

    // Verifica o estado final
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe('Erro ao deletar todo');
      expect(result.current.todos).toEqual(initialMockTodos);
    });
    console.log('✓ Erro capturado e lista não modificada');
    console.log('✓ Teste de erro na deleção concluído com sucesso');
  });

  // Após todos os testes
  afterAll(() => {
    console.log('\n=== Todos os testes foram executados! ===');
  });
}); 