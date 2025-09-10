import { redirect } from 'next/navigation';

export default function HomePage() {
  // 重定向到默认语言的仪表板
  redirect('/en/dashboard');
}