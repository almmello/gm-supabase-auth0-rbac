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
        <button type="submit" className="todo-form-button-desktop">
          Adicionar
        </button>
        {/* Botão Mobile */}
        <button
          type="submit"
          className="todo-form-button-mobile"
          aria-label="Adicionar tarefa"
        />
      </div>
    </form>
  );
} 