import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

/**
 * 首页组件
 * 自动重定向到对应语言的仪表板页面
 * @returns JSX元素
 */
export default function HomePage() {
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    // 重定向到dashboard页面
    router.push('/dashboard');
  }, [router]);

  return (
    <div>
      <p>Redirecting...</p>
    </div>
  );
}

/**
 * 获取静态属性，用于服务端渲染时的多语言支持
 * @param context - Next.js上下文对象
 * @returns 包含翻译文件的props
 */
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};