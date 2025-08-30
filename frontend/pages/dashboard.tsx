import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ResearchAnalystDemo from '../src/components/dashboard/research-analyst-demo';
import MainLayout from '@/components/layout/main-layout';

/**
 * 仪表板页面组件
 * 显示研究分析师演示组件
 * @returns JSX元素
 */
export default function DashboardPage() {
  const { t } = useTranslation('common');

  return (
    <MainLayout>
      <div>
        <h1>{t('dashboard')}</h1>
        <ResearchAnalystDemo />
      </div>
    </MainLayout>
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