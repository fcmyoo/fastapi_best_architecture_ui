import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

const ensureDetectiveCreditCardRoutes = (
  routes: RouteRecordStringComponent[],
) => {
  const findRoute = (
    nodes: RouteRecordStringComponent[],
    predicate: (route: RouteRecordStringComponent) => boolean,
  ): RouteRecordStringComponent | undefined => {
    for (const route of nodes) {
      if (predicate(route)) {
        return route;
      }
      if (route.children?.length) {
        const found = findRoute(route.children, predicate);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  const creditCardRoute = findRoute(
    routes,
    (route) =>
      route.name === 'DetectiveCreditCard' ||
      route.path === '/detective/credit-card',
  );

  if (!creditCardRoute) {
    return routes;
  }

  creditCardRoute.children ??= [];
  const children = creditCardRoute.children;
  const upsertChild = (child: RouteRecordStringComponent) => {
    const index = children.findIndex(
      (item) => item.name === child.name || item.path === child.path,
    );

    if (index === -1) {
      children.push(child);
      return;
    }

    const exist = children[index];

    children[index] = {
      ...exist,
      ...child,
      children: exist.children,
      meta: { ...exist.meta, ...child.meta },
    };
  };

  upsertChild({
    name: 'DetectiveCreditCardBills',
    path: '/detective/credit-card/:bankCode/:cardLast4/bills',
    component: '/plugins/detective/views/credit-card/bills.vue',
    meta: {
      title: $t('detective.creditCard.billHistory'),
      hideInMenu: true,
      activePath: '/detective/credit-card',
    },
  });

  upsertChild({
    name: 'DetectiveCreditCardBillDetail',
    path: '/detective/credit-card/bill-detail/:billId',
    component: '/plugins/detective/views/credit-card/detail.vue',
    meta: {
      title: $t('detective.creditCard.billDetail'),
      hideInMenu: true,
      activePath: '/detective/credit-card',
    },
  });

  return routes;
};

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const rawPageMap: ComponentRecordType = {
    ...import.meta.glob('../views/**/*.vue'),
    ...import.meta.glob('../plugins/**/*.vue'),
  };

  // 标准化 pageMap 的 key，将 '../views/xxx.vue' 转换为 '/xxx.vue'，'../plugins/xxx.vue' 转换为 '/plugins/xxx.vue'
  const pageMap: ComponentRecordType = {};
  for (const [key, value] of Object.entries(rawPageMap)) {
    const normalizedKey = key.replace('../views/', '/').replace('../', '/');
    pageMap[normalizedKey] = value;
  }

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      const menus = await getAllMenusApi();
      return ensureDetectiveCreditCardRoutes(menus);
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
