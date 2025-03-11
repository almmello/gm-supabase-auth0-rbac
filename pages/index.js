import { useState } from 'react';
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { getSupabase } from '../utils/supabase';
import Link from 'next/link';

const TodoList = ({ todos, isAdmin, onDelete }) => (
  <div className="space-y-4">
    {todos.length > 0 ? (
      todos.map(todo => (
        <div key={todo.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
          <span>{todo.content}</span>
          {isAdmin && (
            <button
              className="text-red-400 hover:text-red-300"
              onClick={() => onDelete(todo.id)}
            >
              Excluir
            </button>
          )}
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-center">Você completou todas as tarefas!</p>
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        onChange={(e) => setContent(e.target.value)}
        value={content}
        placeholder="Adicione uma nova tarefa..."
        className="flex-1 p-2 border rounded bg-gray-800 text-white"
      />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
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
    
    const { data, error } = await supabase
      .from('todos')
      .insert({ content, user_id: user.sub })
      .select();

    if (!error && data) {
      setAllTodos([...allTodos, data[0]]);
    } else {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

const handleDelete = async (id) => {
  const supabase = await getSupabaseClient();

  const { data: delData, error: delError } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .select("*");

  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log("[handleDelete] Delete response =>", {
      delData,
      delError,
    });
  }

  if (delError) {
    console.error("[handleDelete] Erro ao excluir:", delError);
    return;
  }

  setAllTodos(allTodos.filter((todo) => todo.id !== id));
};

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-2xl space-y-6">
        <p className="text-lg flex items-center justify-between">
          <span>
            Bem-vindo {user.name}! ({isAdmin ? 'Admin' : 'Usuário'})
          </span>
          <Link href="/api/auth/logout" className="text-blue-400 underline ml-2">
            Sair
          </Link>
        </p>

        <TodoForm onSubmit={handleAddTodo} />
        <TodoList todos={allTodos} isAdmin={isAdmin} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const session = await getSession(req, res);
    const supabase = await getSupabase(session.user.accessToken);
    const { data: todos } = await supabase.from('todos').select('*');
    const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE;

    return {
      props: {
        user: {
          ...session.user,
          roles: session.user[`${namespace}/roles`] || [],
          accessToken: session.user.accessToken
        },
        todos,
      }
    };
  },
});

export default Index;
