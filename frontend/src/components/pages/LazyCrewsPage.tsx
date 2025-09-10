import { createLazyPage } from '../shared/LazyPageWrapper';

// 懒加载 Crews 页面
export const LazyCrewsIndexPage = createLazyPage(
  () => import('../../pages/crews/CrewsIndexPage')
);

export const LazyCrewsCreatePage = createLazyPage(
  () => import('../../pages/crews/CrewsCreatePage')
);

export const LazyCrewsDetailPage = createLazyPage(
  () => import('../../pages/crews/CrewsDetailPage')
);