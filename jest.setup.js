import '@testing-library/jest-dom';

// Mock do next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock do useRouter
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock do Auth0
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: {
      sub: 'test-user-id',
      name: 'Test User',
      'gm-supabase-tutorial.us.auth0.com/roles': ['user'],
    },
    error: null,
    isLoading: false,
  }),
})); 