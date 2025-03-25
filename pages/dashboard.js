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
      <div className="dashboard-container bg-[#374161]">
        <header className="dashboard-header mb-0">
          <div className="header-content flex justify-between items-center px-0 py-3 md:px-8">
            <div className="header-left md:w-[120px] pl-4 md:pl-0">
              <div className="hidden md:block">
                <Image
                  src="/images/goalmoon-logo.png"
                  alt="Goalmoon"
                  width={120}
                  height={40}
                  priority
                />
              </div>
              <div className="md:hidden h-20 w-20 bg-logo-small bg-no-repeat bg-contain bg-center" 
                   role="img" 
                   aria-label="Goalmoon Logo" 
              />
            </div>
            
            <div className="header-center">
              <h1 className="text-white text-xl font-bold">TODO</h1>
            </div>
            
            <div className="header-right flex items-center gap-4 pr-4 md:pr-0">
              <div className="hidden md:flex items-center gap-4">
                <span className="text-white">{currentUser.name}</span>
                <span className={`px-4 py-1 rounded-md ${isAdmin ? 'bg-[#71b399]' : 'bg-[#6374AD]'} text-white`}>
                  {isAdmin ? 'Admin' : 'Usuário'}
                </span>
              </div>
              <a
                href="/api/auth/logout"
                className="md:bg-[#E6E0D3] md:text-[#374161] bg-[#E6E0D3] text-[#374161] rounded-full md:rounded-2xl px-6 py-1.5 text-sm font-medium hover:bg-[#E2DBCD] transition-colors"
              >
                Sair
              </a>
            </div>
          </div>
        </header>

        <div className="md:hidden bg-[#293047] border-t border-[#3F4A6E] px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[#dbe2ea] text-sm truncate max-w-[60%]">
              {currentUser.email}
            </span>
            <span className={`px-4 py-1 rounded-full text-sm ${isAdmin ? 'bg-[#71b399]' : 'bg-[#6374AD]'} text-white`}>
              {isAdmin ? 'Admin' : 'Usuário'}
            </span>
          </div>
        </div>

        <main className="dashboard-content px-4 md:px-8 mt-6 md:mt-0">
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