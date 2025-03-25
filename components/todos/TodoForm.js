import { useState } from 'react';

export default function TodoForm({ onSubmit }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <div className="todo-input-wrapper">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Adicione uma nova tarefa..."
          className="todo-input"
          autoComplete="off"
        />
        {/* Botão Desktop */}
        <button type="submit" className="action-button button-primary hidden md:block md:py-1.5">
          Adicionar
        </button>
        {/* Botão Mobile */}
        <button
          type="submit"
          className="md:hidden bg-[#71b399] hover:bg-[#5ea386] text-white rounded-full p-2 transition-colors"
          aria-label="Adicionar tarefa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </form>
  );
} 