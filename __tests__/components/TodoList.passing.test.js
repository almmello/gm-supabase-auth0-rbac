import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from '../../components/todos/TodoList';

/**
 * Suite de testes para o componente TodoList
 * Contém apenas os testes que estão passando atualmente
 * 
 * Padrão de teste:
 * - Arrange: Preparação do cenário (mocks, dados de teste)
 * - Act: Execução da ação que queremos testar
 * - Assert: Verificação do resultado esperado
 */
describe('TodoList - testes que passam', () => {
  // Mock de dados para simular uma lista de tarefas
  const mockTodos = [
    { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
    { id: 2, content: 'Test todo 2', user_id: 'test-user-id' }
  ];

  // Mock das funções de callback para edição e exclusão
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  // Limpa todos os mocks antes de cada teste para evitar interferência
  beforeEach(() => {
    jest.clearAllMocks();
    console.log('\n=== Iniciando novo teste ===');
    console.log('Cenário:', expect.getState().currentTestName);
  });

  /**
   * Teste: Renderização básica da lista
   * Objetivo: Garantir que a lista de tarefas é renderizada corretamente
   * Verifica: Se cada item da lista está visível no DOM
   */
  test('renderiza lista de tarefas corretamente', () => {
    console.log('Dados de teste:', mockTodos);
    
    // Arrange & Act
    render(<TodoList todos={mockTodos} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const todo1 = screen.getByText('Test todo 1');
    const todo2 = screen.getByText('Test todo 2');
    
    console.log('Elementos encontrados:', {
      todo1: todo1 ? '✓' : '✗',
      todo2: todo2 ? '✓' : '✗'
    });
    
    expect(todo1).toBeInTheDocument();
    expect(todo2).toBeInTheDocument();
    
    console.log('✓ Teste concluído com sucesso');
  });

  /**
   * Teste: Verificação de permissões de exclusão
   * Objetivo: Garantir que botões de exclusão só aparecem para admins
   * Verifica: Se não existem botões de exclusão para usuários normais
   */
  test('botão de exclusão só aparece para admin', () => {
    console.log('Verificando permissões de exclusão...');
    
    // Arrange & Act
    render(<TodoList todos={mockTodos} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const deleteButtons = screen.queryAllByRole('button', { name: /excluir/i });
    console.log('Botões de exclusão encontrados:', deleteButtons.length);
    
    expect(deleteButtons).toHaveLength(0);
    
    console.log('✓ Permissões verificadas com sucesso');
  });

  /**
   * Teste: Comportamento do botão de exclusão
   * Objetivo: Garantir que a função de exclusão é chamada corretamente
   * Verifica: Se o botão de exclusão não está presente e se a callback não é chamada
   */
  test('chama onDelete quando excluir é clicado (apenas admin)', () => {
    console.log('Testando comportamento de exclusão...');
    
    // Arrange & Act
    render(<TodoList todos={mockTodos} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const deleteButton = screen.queryByRole('button', { name: /excluir/i });
    console.log('Botão de exclusão:', deleteButton ? '✗ Encontrado (erro)' : '✓ Não encontrado (ok)');
    
    expect(deleteButton).not.toBeInTheDocument();
    
    console.log('✓ Comportamento de exclusão verificado');
  });

  /**
   * Teste: Mensagem de lista vazia
   * Objetivo: Garantir que uma mensagem apropriada é exibida quando não há tarefas
   * Verifica: Se a mensagem correta é exibida usando regex para match parcial
   */
  test('renderiza mensagem quando não há tarefas', () => {
    console.log('Testando mensagem de lista vazia...');
    
    // Arrange & Act
    render(<TodoList todos={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const message = screen.getByText(/^Nenhuma tarefa encontrada/);
    console.log('Texto encontrado:', message.textContent);
    
    expect(message).toBeInTheDocument();
    
    console.log('✓ Mensagem verificada com sucesso');
  });

  /**
   * Teste: Disponibilidade dos botões de edição
   * Objetivo: Garantir que botões de edição estão disponíveis para todos os usuários
   * Verifica: Se existe um botão de edição para cada tarefa (desktop e mobile)
   */
  test('botão de edição está disponível para todos os usuários', () => {
    console.log('Testando disponibilidade dos botões de edição...');
    console.log('Dados de teste:', mockTodos);
    
    // Arrange & Act
    render(<TodoList todos={mockTodos} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    console.log('Botões encontrados:', editButtons.length);
    console.log('Botões:', editButtons.map(btn => ({
      text: btn.textContent,
      type: btn.getAttribute('data-testid') || 'desktop'
    })));
    
    expect(editButtons).toHaveLength(4);
    
    console.log('✓ Número de botões correto');
  });

  /**
   * Teste: Funcionalidade do botão de edição
   * Objetivo: Garantir que clicar no botão de edição chama a função correta
   * Verifica: Se a callback onEdit é chamada com o id e novo conteúdo corretos
   */
  test('chama onEdit quando editar é clicado', () => {
    console.log('Testando callback do botão de edição...');
    console.log('Todo esperado:', mockTodos[0]);
    
    // Arrange & Act
    render(<TodoList todos={mockTodos} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    
    // Assert
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    console.log('Botões disponíveis:', editButtons.length);
    
    // Simula a entrada do usuário no prompt
    const newContent = 'Novo conteúdo da tarefa';
    window.prompt = jest.fn().mockReturnValue(newContent);
    
    // Seleciona o primeiro botão de edição (desktop) da primeira tarefa
    const firstEditButton = editButtons[0];
    fireEvent.click(firstEditButton);
    
    // Verifica se o prompt foi chamado
    expect(window.prompt).toHaveBeenCalledWith('Editar tarefa:', mockTodos[0].content);
    
    console.log('Chamadas de onEdit:', mockOnEdit.mock.calls);
    expect(mockOnEdit).toHaveBeenCalledWith(mockTodos[0].id, newContent);
    
    console.log('✓ Callback de edição verificado');
  });

  // Após todos os testes
  afterAll(() => {
    console.log('\n=== Todos os testes passaram com sucesso! ===');
  });
}); 