declare global {
  const App: <T>(options: T) => void;
  const Page: <T>(options: T) => void;
  const getApp: <T>() => T;

  const wx: {
    request<T = unknown>(options: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: unknown;
      header?: Record<string, string>;
      success?: (result: { statusCode: number; data: T }) => void;
      fail?: (error: { errMsg: string }) => void;
    }): void;
    showToast(options: { title: string; icon?: 'success' | 'error' | 'loading' | 'none'; duration?: number }): void;
    showModal(options: {
      title: string;
      content: string;
      confirmText?: string;
      cancelText?: string;
      editable?: boolean;
      placeholderText?: string;
      success?: (result: { confirm: boolean; cancel: boolean; content?: string }) => void;
    }): void;
  };
}

export interface AppInstance {
  globalData: {
    apiBaseUrl: string;
  };
}
