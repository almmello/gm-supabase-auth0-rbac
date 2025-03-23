import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from '../../components/todos/TodoList';

describe('TodoList', () => {
  const mockTodos = [
    { id: 1, content: 'Test todo 1', user_id: 'test-user-id' },
    { id: 2, content: 'Test todo 2', user_id: 'test-user-id' },
  ];

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza mensagem quando não há tarefas', () => {
    render(<TodoList todos={[]} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />);
    expect(screen.getByText('Nenhuma tarefa encontrada. Adicione uma nova tarefa acima.')).toBeInTheDocument();
  });

  test('renderiza lista de tarefas corretamente', () => {
    render(<TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />);
    expect(screen.getByText('Test todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test todo 2')).toBeInTheDocument();
  });

  test('botão de edição está disponível para todos os usuários', () => {
    render(<TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />);
    const editButtons = screen.getAllByText('Editar');
    expect(editButtons).toHaveLength(2);
  });

  test('botão de exclusão só aparece para admin', () => {
    const { rerender } = render(
      <TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />
    );
    expect(screen.queryAllByText('Excluir')).toHaveLength(0);

    rerender(
      <TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="admin" />
    );
    expect(screen.getAllByText('Excluir')).toHaveLength(2);
  });

  test('chama onEdit quando editar é clicado', () => {
    window.prompt = jest.fn().mockReturnValue('Updated todo');
    render(<TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="user" />);
    
    const editButton = screen.getAllByText('Editar')[0];
    fireEvent.click(editButton);
    
    expect(window.prompt).toHaveBeenCalledWith('Editar tarefa:', 'Test todo 1');
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(1, 'Updated todo');
  });

  test('chama onDelete quando excluir é clicado (apenas admin)', () => {
    window.confirm = jest.fn().mockReturnValue(true);
    render(<TodoList todos={mockTodos} onEdit={mockHandlers.onEdit} onDelete={mockHandlers.onDelete} userRole="admin" />);
    
    const deleteButton = screen.getAllByText('Excluir')[0];
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta tarefa?');
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(1);
  });
}); 