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
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        {error}
      </div>
    );
  }

  const currentUser = user || serverUser;
  const isAdmin = currentUser['gm-supabase-tutorial.us.auth0.com/roles']?.includes('admin');

  return (
    <BaseLayout>
      <div className="dashboard-container bg-deep-navy">
        <header className="dash-header">
          <div className="dash-header-grid">
            <div className="dash-logo-wrapper">
              <div className="dashboard-logo-desktop">
                <Image
                  src="/images/goalmoon-logo.png"
                  alt="Goalmoon"
                  width={120}
                  height={40}
                  priority
                />
              </div>
              <div className="dashboard-logo-mobile" 
                   role="img" 
                   aria-label="Goalmoon Logo" 
              />
            </div>
            
            <div className="dash-flex-center">
              <h1 className="dash-title">TODO</h1>
            </div>
            
            <div className="dash-flex-end">
              <div className="dashboard-nav-user">
                <span className="text-white">{currentUser.name}</span>
                <span className={`dashboard-badge ${isAdmin ? 'dashboard-badge-admin' : 'dashboard-badge-user'}`}>
                  {isAdmin ? 'Admin' : 'Usuário'}
                </span>
              </div>
              <a
                href="/api/auth/logout"
                className="dashboard-logout-button"
              >
                Sair
              </a>
            </div>
          </div>
        </header>

        <div className="dashboard-mobile-info">
          <div className="dash-flex">
            <span className="dashboard-user-email">
              {currentUser.email}
            </span>
            <span className={`dashboard-mobile-badge ${isAdmin ? 'dashboard-badge-admin' : 'dashboard-badge-user'}`}>
              {isAdmin ? 'Admin' : 'Usuário'}
            </span>
          </div>
        </div>

        <main className="dashboard-main">
          <TodoForm onSubmit={addTodo} />
          
          {error && (
            <div className="error-message">
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