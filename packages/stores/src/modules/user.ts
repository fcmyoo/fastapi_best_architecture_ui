import { ref } from 'vue';

import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;
  /**
   * 头像
   */
  avatar: string;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 用户角色
   */
  roles?: string[];
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', () => {
  const userInfo = ref<BasicUserInfo | null>(null);
  const userRoles = ref<string[]>([]);

  function setUserRoles(roles: string[]) {
    userRoles.value = roles;
  }

  function setUserInfo(info: BasicUserInfo | null) {
    // 设置用户信息
    userInfo.value = info;
    // 设置角色信息
    const roles = info?.roles ?? [];
    setUserRoles(roles);
  }

  return {
    setUserInfo,
    setUserRoles,
    userInfo,
    userRoles,
  };
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
