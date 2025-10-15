import {
  SideNavInterface
} from '../../interfaces/side-nav.type';

export const ROUTES: SideNavInterface[] = [
  {
    path: '/providers',
    title: 'Proveedores',
    iconType: 'nzIcon',
    icon: 'car',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/products',
    title: 'Productos',
    iconType: 'nzIcon',
    icon: 'shop',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/sellers',
    title: 'Vendedores',
    iconType: 'nzIcon',
    icon: 'dollar',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/reports',
    title: 'Reportes',
    iconType: 'nzIcon',
    icon: 'bar-chart',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/warehouses',
    title: 'Bodegas',
    iconType: 'nzIcon',
    icon: 'home',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/routes',
    title: 'Rutas de Entrega',
    iconType: 'nzIcon',
    icon: 'environment',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '',
    title: 'Dashboard',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'appstore-add',
    submenu: [{
      path: '/dashboard/blank-page',
      title: 'Blank Page',
      iconType: '',
      icon: '',
      iconTheme: '',
      submenu: []
    },
    ]
  },
  {
    path: '',
    title: 'Authentication',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'lock',
    submenu: [{
      path: '/authentication/login-1',
      title: 'Log In',
      iconType: '',
      icon: '',

      iconTheme: '',
      submenu: []
    },
      {
        path: '/authentication/sign-up-1',
        title: 'Sign Up',
        iconType: '',
        icon: '',

        iconTheme: '',
        submenu: []
      },
      {
        path: '/authentication/forget-pass',
        title: 'Forget password',
        iconType: '',
        icon: '',
        iconTheme: '',
        submenu: []
      }
    ]
  }
];
