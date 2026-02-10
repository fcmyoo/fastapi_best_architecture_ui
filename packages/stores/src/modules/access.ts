import type { RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw } from '@vben-core/typings';

import { ref } from 'vue';

import { acceptHMRUpdate, defineStore } from 'pinia';

type AccessToken = null | string;

/**
 * @zh_CN 访问权限相关
 */
export const useAccessStore = defineStore(
  'core-access',
  () => {
    const accessCodes = ref<string[]>([]);
    const accessMenus = ref<MenuRecordRaw[]>([]);
    const accessRoutes = ref<RouteRecordRaw[]>([]);
    const accessSessionUuid = ref<AccessToken>(null);
    const accessToken = ref<AccessToken>(null);
    const captchaUuid = ref<null | string>(null);
    const isAccessChecked = ref(false);
    const isLockScreen = ref(false);
    const lockScreenPassword = ref<string | undefined>(undefined);
    const loginExpired = ref(false);
    const refreshToken = ref<AccessToken>(null);

    function getMenuByPath(path: string) {
      function findMenu(
        menus: MenuRecordRaw[],
        path: string,
      ): MenuRecordRaw | undefined {
        for (const menu of menus) {
          if (menu.path === path) {
            return menu;
          }
          if (menu.children) {
            const matched = findMenu(menu.children, path);
            if (matched) {
              return matched;
            }
          }
        }
      }
      return findMenu(accessMenus.value, path);
    }

    function lockScreen(password: string) {
      isLockScreen.value = true;
      lockScreenPassword.value = password;
    }

    function setCaptchaUuid(uuid: string) {
      captchaUuid.value = uuid;
    }

    function setAccessCodes(codes: string[]) {
      accessCodes.value = codes;
    }

    function setAccessMenus(menus: MenuRecordRaw[]) {
      accessMenus.value = menus;
    }

    function setAccessRoutes(routes: RouteRecordRaw[]) {
      accessRoutes.value = routes;
    }

    function setAccessSessionUuid(uuid: AccessToken) {
      accessSessionUuid.value = uuid;
    }

    function setAccessToken(token: AccessToken) {
      accessToken.value = token;
    }

    function setIsAccessChecked(checked: boolean) {
      isAccessChecked.value = checked;
    }

    function setLoginExpired(expired: boolean) {
      loginExpired.value = expired;
    }

    function setRefreshToken(token: AccessToken) {
      refreshToken.value = token;
    }

    function unlockScreen() {
      isLockScreen.value = false;
      lockScreenPassword.value = undefined;
    }

    return {
      accessCodes,
      accessMenus,
      accessRoutes,
      accessSessionUuid,
      accessToken,
      captchaUuid,
      getMenuByPath,
      isAccessChecked,
      isLockScreen,
      lockScreen,
      lockScreenPassword,
      loginExpired,
      refreshToken,
      setAccessCodes,
      setAccessMenus,
      setAccessRoutes,
      setAccessSessionUuid,
      setAccessToken,
      setCaptchaUuid,
      setIsAccessChecked,
      setLoginExpired,
      setRefreshToken,
      unlockScreen,
    };
  },
  {
    persist: {
      // 持久化
      pick: [
        'accessSessionUuid',
        'accessToken',
        'refreshToken',
        'accessCodes',
        'isLockScreen',
        'lockScreenPassword',
      ],
    },
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAccessStore, hot));
}
