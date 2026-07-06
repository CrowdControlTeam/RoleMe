import { getRequestConfig } from "next-intl/server";

// Single locale for now; more locales can be added here later without
// changing how components consume translations.
const defaultLocale = "es";

export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
