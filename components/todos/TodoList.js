export default function TodoList({ todos, onEdit, onDelete, isAdmin }) {
  if (!todos || todos.length === 0) {
    return (
      <div className="todo-empty">
        Nenhuma tarefa encontrada. Adicione uma nova tarefa acima.
      </div>
    );
  }

  const handleEdit = (todo) => {
    if (!todo.content) {
      alert('Não é possível editar uma tarefa sem conteúdo');
      return;
    }
    const newContent = prompt('Editar tarefa:', todo.content);
    if (newContent && newContent !== todo.content) {
      onEdit(todo.id, newContent);
    }
  };

  const handleDelete = (todoId) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      onDelete(todoId);
    }
  };

  return (
    <div className="todo-list">
      {todos.map((todo) => {
        if (!todo || !todo.id) {
          console.error('Todo inválido:', todo);
          return null;
        }

        return (
          <div key={todo.id} className="todo-item">
            <div className="todo-content">
              {todo.content || 'Tarefa sem conteúdo'}
            </div>
            <div className="todo-actions">
              {/* Botões Desktop */}
              <div className="todo-list-buttons-desktop">
                <button
                  className="todo-list-button-edit"
                  onClick={() => handleEdit(todo)}
                >
                  Editar
                </button>
                {isAdmin && (
                  <button
                    className="todo-list-button-delete"
                    onClick={() => handleDelete(todo.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
              
              {/* Botões Mobile */}
              <div className="todo-list-buttons-mobile">
                <button
                  onClick={() => handleEdit(todo)}
                  className="todo-list-button-edit-mobile"
                  aria-label="Editar tarefa"
                />
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="todo-list-button-delete-mobile"
                    aria-label="Excluir tarefa"
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 