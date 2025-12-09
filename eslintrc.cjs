/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals"],
  plugins: ["simple-import-sort"],
  rules: {
    // סדר ייבוא אוטומטי (למעלה ספריות, אח״כ קבצי פרויקט)
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",

    // אופציונלי: פחות רעש
    "@next/next/no-img-element": "off",
  },
};
