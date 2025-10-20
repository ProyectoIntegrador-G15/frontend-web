// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://35.190.67.42',
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
    authentication: '/auth'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
