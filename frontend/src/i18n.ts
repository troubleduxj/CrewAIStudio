import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({locale}) => {
  // 确保 locale 有默认值
  const validLocale = locale || 'en';
  
  try {
    return {
      locale: validLocale,
      messages: (await import(`../messages/${validLocale}.json`)).default
    };
  } catch (error) {
    // 如果指定的语言文件不存在，回退到英文
    console.warn(`Failed to load messages for locale: ${validLocale}, falling back to 'en'`);
    return {
      locale: 'en',
      messages: (await import(`../messages/en.json`)).default
    };
  }
});
