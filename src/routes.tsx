import type { RouteObject } from 'react-router-dom';
import { PaymentsOpsDashboard } from './views/dashboard/PaymentsOpsDashboard';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: () => <PaymentsOpsDashboard view="view1" />,
  },
  {
    path: '/view1',
    Component: () => <PaymentsOpsDashboard view="view1" />,
  },
  {
    path: '/view2',
    Component: () => <PaymentsOpsDashboard view="view2" />,
  },
];

