import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Investment Dashboard",
  version: packageJson.version,
  copyright: `© ${currentYear}, Investment Dashboard.`,
  meta: {
    title: "Investment Dashboard",
    description: "Investment Dashboard demo.",
  },
};
