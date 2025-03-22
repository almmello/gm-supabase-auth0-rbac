export default function TodoList({ todos, onEdit, onDelete }) {
  if (!todos || todos.length === 0) {
    return (
      <div className="todo-empty-message">
        Nenhuma tarefa encontrada. Adicione uma nova tarefa acima.
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <div key={todo.id} className="todo-item">
          <div className="flex justify-between items-center">
            <span className="todo-content">{todo.content}</span>
            <div className="todo-actions">
              <button
                className="todo-edit-button"
                onClick={() => {
                  const newContent = prompt('Editar tarefa:', todo.content);
                  if (newContent && newContent !== todo.content) {
                    onEdit(todo.id, newContent);
                  }
                }}
              >
                Editar
              </button>
              <button
                className="todo-delete-button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                    onDelete(todo.id);
                  }
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 