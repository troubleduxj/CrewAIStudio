import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import '../styles/globals.css';

/**
 * Next.js App组件，配置了next-i18next的多语言支持
 * @param Component - 当前页面组件
 * @param pageProps - 页面属性
 * @returns JSX元素
 */
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// 使用appWithTranslation包装App组件以启用多语言功能
export default appWithTranslation(MyApp);