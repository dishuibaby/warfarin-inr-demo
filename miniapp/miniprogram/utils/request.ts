import type { AppInstance } from '../types/wechat';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
}

export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const app = getApp<AppInstance>();
  const url = `${app.globalData.apiBaseUrl}${path}`;

  return new Promise<T>((resolve, reject) => {
    wx.request<T>({
      url,
      method: options.method ?? 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json'
      },
      success(result) {
        if (result.statusCode >= 200 && result.statusCode < 300) {
          resolve(result.data);
          return;
        }
        reject(new Error(`Request failed: ${result.statusCode}`));
      },
      fail(error) {
        reject(new Error(error.errMsg));
      }
    });
  });
}
