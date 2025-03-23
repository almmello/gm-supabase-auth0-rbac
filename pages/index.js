import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Image from 'next/image';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import { useTodos } from '../hooks/useTodos';

function Home({ user: serverUser }) {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();
  const { todos, loading, error, addTodo, editTodo, deleteTodo } = useTodos();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <a
          href="/api/auth/login"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </a>
      </div>
    );
  }

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
              <span className={`role-badge ${isAdmin ? 'role-badge-admin' : 'role-badge-user'}`}>
                {isAdmin ? 'Admin' : 'Usuário'}
              </span>
            </div>
            <a href="/api/auth/logout" className="logout-link">
              Sair
            </a>
          </header>
        </div>

        <TodoForm onSubmit={addTodo} />
        
        {error && (
          <div className="bg-[#374161] rounded-2xl p-4 text-center text-[#562632] border border-[#3F4A6E]/30">
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
