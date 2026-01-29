declare namespace SystemStore {
  // lang
  type TLang = 'zh-CN' | 'en-US' | 'original';
  interface IClear {
    reset: () => void;
  }
  interface IBreadcrumb {
    /**唯一值 */
    key: string;
    /**标题 */
    title: string;
    /**路由路径 */
    routePath: string;
    /**每一个路由前的 icon */
    icon?: React.ReactNode | JSX.Element;
  }
  interface IPlatformState {
    lang: TLang;
    collapse: boolean;
    breadcrumbList: IBreadcrumb[];
    isShowHeader: boolean;
    isShowHeaderLine: boolean;
  }
  interface IPlatformActions extends IClear {
    setLang: (lang: TLang) => void;
    setCollapse: (collapse: boolean) => void;
    setBreadcrumb: (breadcrumbList: IBreadcrumb[], isShowHeaderLine?: boolean) => void;
    setIsShowHeader: (isShowHeader: boolean) => void;
  }

  // user
  type TUser =
    | {
        id: string;
        username: string;
        nickname: string;
      }
    | undefined;
  type TAuth = Record<
    string,
    {
      activate: boolean;
      type?: string;
      limit: number;
      remaining: number;
    }
  >;
  interface IUserState {
    isLogin: boolean;
    user: TUser | undefined;
    token: string | undefined;
    company: string;
    companyId: string;
    auth: TAuth;
  }
  interface IUserActions extends IClear {
    setIsLogin: (login: boolean) => void;
    setToken: (token: string) => void;
    setUser: (user: TUser | undefined) => void;
    setAuth: (auth: TAuth) => void;
    setCompany: (company: string) => void;
    setCompanyId: (companyId: string) => void;
  }
}
