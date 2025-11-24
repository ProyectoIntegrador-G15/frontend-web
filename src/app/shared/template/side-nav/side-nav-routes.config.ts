import {
  SideNavInterface
} from '../../interfaces/side-nav.type';

export const ROUTES: SideNavInterface[] = [
  {
    path: '/dashboard/products',
    title: 'navigation.products',
    iconType: 'nzIcon',
    icon: 'shop',
    iconTheme: 'outline',
    submenu: []
  },
  {
    path: '/dashboard/suppliers',
    title: 'navigation.providers',
    iconType: 'nzIcon',
    icon: 'car',
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
  }
];
