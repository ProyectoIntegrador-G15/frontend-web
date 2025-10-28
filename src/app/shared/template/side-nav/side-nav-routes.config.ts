import {
  SideNavInterface
} from '../../interfaces/side-nav.type';

export const ROUTES: SideNavInterface[] = [
  {
    path: '/providers',
    title: 'navigation.providers',
    iconType: 'nzIcon',
    icon: 'car',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/products',
    title: 'navigation.products',
    iconType: 'nzIcon',
    icon: 'shop',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/sellers',
    title: 'navigation.sellers',
    iconType: 'nzIcon',
    icon: 'dollar',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/reports',
    title: 'navigation.reports',
    iconType: 'nzIcon',
    icon: 'bar-chart',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/warehouses',
    title: 'navigation.warehouses',
    iconType: 'nzIcon',
    icon: 'home',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/routes',
    title: 'navigation.routes',
    iconType: 'nzIcon',
    icon: 'environment',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '',
    title: 'navigation.dashboard',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'appstore-add',
    submenu: [{
      path: '/dashboard/blank-page',
      title: 'navigation.blankPage',
      iconType: '',
      icon: '',
      iconTheme: '',
      submenu: []
    },
    ]
  },
  {
    path: '',
    title: 'navigation.authentication',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'lock',
    submenu: [{
      path: '/authentication/login-1',
      title: 'navigation.login',
      iconType: '',
      icon: '',

      iconTheme: '',
      submenu: []
    },
      {
        path: '/authentication/sign-up-1',
        title: 'navigation.signup',
        iconType: '',
        icon: '',

        iconTheme: '',
        submenu: []
      },
      {
        path: '/authentication/forget-pass',
        title: 'navigation.forgotPassword',
        iconType: '',
        icon: '',
        iconTheme: '',
        submenu: []
      }
    ]
  }
];
