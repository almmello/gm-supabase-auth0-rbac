import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Image from 'next/image';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import { useFetchTodos, useAddTodo, useEditTodo, useDeleteTodo } from '../hooks/useTodos';

function Home({ user: serverUser }) {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchTodos } = useFetchTodos();
  const { addTodo } = useAddTodo();
  const { editTodo } = useEditTodo();
  const { deleteTodo } = useDeleteTodo();

  useEffect(() => {
    let isMounted = true;

    const loadTodos = async () => {
      try {
        const data = await fetchTodos();
        if (isMounted) {
          setTodos(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (user?.accessToken) {
      loadTodos();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.accessToken, fetchTodos]);

  const handleAddTodo = async (content) => {
    try {
      const newTodo = await addTodo(content);
      setTodos([...todos, newTodo]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTodo = async (id, content) => {
    try {
      const updatedTodo = await editTodo(id, content);
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="main-container">
        <div className="content-wrapper">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="main-container">
        <div className="content-wrapper">
          <div className="bg-[#374161] rounded-xl p-6 text-center text-[#562632]">
            Erro ao carregar usuário: {authError.message}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="main-container">
        <div className="content-wrapper">
          <div className="bg-[#374161] rounded-xl p-6 text-center text-[#856968]">
            Por favor, faça login para continuar.
          </div>
        </div>
      </div>
    );
  }

  const currentUser = user || serverUser;

  return (
    <div className="main-container">
      <div className="content-wrapper">
        <div className="header-container">
          <div className="logo-container">
            <Image
              src="/logo.png"
              alt="Goalmoon Logo"
              width={192}
              height={192}
              className="object-contain"
              priority
            />
          </div>
          <header className="header">
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className={`role-badge ${currentUser.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
                {currentUser.role === 'admin' ? 'Admin' : 'Usuário'}
              </span>
            </div>
            <a href="/api/auth/logout" className="logout-link">
              Sair
            </a>
          </header>
        </div>

        <TodoForm onSubmit={handleAddTodo} />
        
        {error && (
          <div className="bg-[#374161] rounded-2xl p-4 text-center text-[#562632] border border-[#3F4A6E]/30">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <TodoList
            todos={todos}
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
          />
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const session = await getSession(req, res);
    return {
      props: {
        user: session?.user || null
      }
    };
  }
});

export default Home;
