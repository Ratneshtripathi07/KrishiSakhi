module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'ml', 'pa'],
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  localePath: 'public/locales',
};
