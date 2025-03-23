export default function TodoList({ todos, onEdit, onDelete, isAdmin }) {
  if (!todos || todos.length === 0) {
    return (
      <div className="todo-empty">
        Nenhuma tarefa encontrada. Adicione uma nova tarefa acima.
      </div>
    );
  }

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
              <button
                className="action-button button-secondary"
                onClick={() => {
                  if (!todo.content) {
                    alert('Não é possível editar uma tarefa sem conteúdo');
                    return;
                  }
                  const newContent = prompt('Editar tarefa:', todo.content);
                  if (newContent && newContent !== todo.content) {
                    onEdit(todo.id, newContent);
                  }
                }}
              >
                Editar
              </button>
              {isAdmin && (
                <button
                  className="action-button button-danger"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                      onDelete(todo.id);
                    }
                  }}
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 