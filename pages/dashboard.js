import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  const currentUser = user || serverUser;
  const isAdmin = currentUser['gm-supabase-tutorial.us.auth0.com/roles']?.includes('admin');

  return (
    <BaseLayout>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image
                  src="/images/goalmoon-logo.png"
                  alt="Goalmoon"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="ml-3 text-xl font-semibold text-gray-900">Todo App</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{currentUser.name}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {isAdmin ? 'Admin' : 'Usuário'}
                </span>
                <a
                  href="/api/auth/logout"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sair
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <TodoForm onSubmit={addTodo} />
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
                {error}
              </div>
            )}

            <TodoList
              todos={todos}
              onEdit={editTodo}
              onDelete={deleteTodo}
              isAdmin={isAdmin}
            />
          </div>
        </main>
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