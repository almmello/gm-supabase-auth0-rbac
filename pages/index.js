import { useState } from 'react';
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { getSupabase } from '../utils/supabase';
import Link from 'next/link';
import logger from '../utils/logger';

const TodoList = ({ todos, isAdmin, onDelete }) => (
  <div className="todo-list">
    {todos.length > 0 ? (
      todos.map(todo => (
        <div key={todo.id} className="todo-item">
          <span className="todo-content">{todo.content}</span>
          {isAdmin && (
            <button
              className="todo-delete-button"
              onClick={() => onDelete(todo.id)}
            >
              Excluir
            </button>
          )}
        </div>
      ))
    ) : (
      <p className="todo-empty-message">Você completou todas as tarefas!</p>
    )}
  </div>
);

const TodoForm = ({ onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        type="text"
        onChange={(e) => setContent(e.target.value)}
        value={content}
        placeholder="Adicione uma nova tarefa..."
        className="todo-input"
      />
      <button type="submit" className="todo-button">
        Adicionar
      </button>
    </form>
  );
};

const Index = ({ user, todos }) => {
  const [allTodos, setAllTodos] = useState(todos || []);
  const isAdmin = user.roles.includes('admin');

  const getSupabaseClient = async () => {
    return await getSupabase(user.accessToken);
  };

  const handleAddTodo = async (content) => {
    const supabase = await getSupabaseClient();
    
    logger.apiCall('Supabase', 'insert', { table: 'todos', content });
    
    const { data, error } = await supabase
      .from('todos')
      .insert({ content, user_id: user.sub })
      .select();

    if (!error && data) {
      setAllTodos([...allTodos, data[0]]);
      logger.info('Tarefa adicionada com sucesso');
    } else {
      logger.error('Erro ao adicionar tarefa', error);
    }
  };

  const handleDelete = async (id) => {
    const supabase = await getSupabaseClient();

    logger.apiCall('Supabase', 'delete', { table: 'todos', id });

    const { data: delData, error: delError } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .select("*");

    if (delError) {
      logger.error('Erro ao excluir tarefa', delError);
      return;
    }

    logger.info('Tarefa excluída com sucesso');
    setAllTodos(allTodos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="main-container">
      <div className="content-wrapper">
        <div className="header">
          <div className="user-info">
            <span>Bem-vindo {user.name}!</span>
            <span className={`role-badge ${isAdmin ? 'role-badge-admin' : 'role-badge-user'}`}>
              {isAdmin ? 'Admin' : 'Usuário'}
            </span>
          </div>
          <Link href="/api/auth/logout" className="logout-link">
            Sair
          </Link>
        </div>

        <TodoForm onSubmit={handleAddTodo} />
        <TodoList todos={allTodos} isAdmin={isAdmin} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    try {
      const session = await getSession(req, res);
      const supabase = await getSupabase(session.user.accessToken);
      
      logger.apiCall('Supabase', 'select', { table: 'todos' });
      
      const { data: todos, error } = await supabase.from('todos').select('*');
      
      if (error) {
        logger.error('Erro ao buscar tarefas', error);
        return {
          props: {
            user: {
              ...session.user,
              roles: session.user[`${process.env.NEXT_PUBLIC_AUTH0_NAMESPACE}/roles`] || [],
              accessToken: session.user.accessToken
            },
            todos: [],
          }
        };
      }

      return {
        props: {
          user: {
            ...session.user,
            roles: session.user[`${process.env.NEXT_PUBLIC_AUTH0_NAMESPACE}/roles`] || [],
            accessToken: session.user.accessToken
          },
          todos,
        }
      };
    } catch (error) {
      logger.error('Erro ao carregar dados da página', error);
      return {
        props: {
          user: null,
          todos: [],
        }
      };
    }
  },
});

export default Index;
