export const environment = {
  production: true,
  apiUrl: 'https://medisupply.hectorfranco.dev',
  apiEndpoints: {
    orders: '/orders',
    customers: '/customers',
    products: '/products',
    routes: '/routes',
    warehouses: '/warehouses',
    visits: '/visits',
    logistics: '/logistics',
    health: '/health',
    inventory: '/inventory',
    authentication: '/auth',
    sellers: '/sellers'
  },
  firebaseApiKey: 'AIzaSyAEcWSpsJOLVQ9lVH5tP1m8XaSq7zIpk5Q',
  firebaseAuthBase: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
};
