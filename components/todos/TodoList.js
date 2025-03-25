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
              {/* Botões Desktop */}
              <div className="hidden md:block md:space-x-2">
                <button
                  className="action-button button-secondary md:py-1.5"
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
                    className="action-button button-danger md:py-1.5"
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
              
              {/* Botões Mobile */}
              <div className="md:hidden flex gap-2">
                <button
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
                  className="bg-[#6374AD] hover:bg-[#566294] text-white rounded-full p-2 transition-colors"
                  aria-label="Editar tarefa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                        onDelete(todo.id);
                      }
                    }}
                    className="bg-[#E6E0D3] hover:bg-[#E2DBCD] text-[#374161] rounded-full p-2 transition-colors"
                    aria-label="Excluir tarefa"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 