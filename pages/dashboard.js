import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import { useTodos } from '../hooks/useTodos';
import BaseLayout from '../components/layouts/BaseLayout';

function Dashboard({ user: serverUser }) {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const { todos, loading, error, addTodo, editTodo, deleteTodo } = useTodos();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-burgundy">
        {error}
      </div>
    );
  }

  const currentUser = user || serverUser;
  const isAdmin = currentUser['gm-supabase-tutorial.us.auth0.com/roles']?.includes('admin');

  return (
    <BaseLayout>
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <Image
                src="/images/goalmoon-logo.png"
                alt="Goalmoon"
                width={120}
                height={40}
                priority
              />
            </div>
            <div className="header-center">
              <h1 className="header-title">TODO</h1>
            </div>
            <div className="header-right">
              <span className="user-badge">{currentUser.name}</span>
              <span className={isAdmin ? 'user-badge badge-admin' : 'user-badge badge-user'}>
                {isAdmin ? 'Admin' : 'Usuário'}
              </span>
              <a
                href="/api/auth/logout"
                className="action-button button-danger"
              >
                Sair
              </a>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <TodoForm onSubmit={addTodo} />
          
          {error && (
            <div className="bg-burgundy/20 border border-burgundy/30 rounded-2xl p-4 text-burgundy">
              {error}
            </div>
          )}

          <TodoList
            todos={todos}
            onEdit={editTodo}
            onDelete={deleteTodo}
            isAdmin={isAdmin}
          />
        </main>

        <footer className="dashboard-footer">
          <p>&copy; {new Date().getFullYear()} Goalmoon. Todos os direitos reservados.</p>
        </footer>
      </div>
    </BaseLayout>
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

export default Dashboard; 