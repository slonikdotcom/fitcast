/* ============================================================
   FitCast — React SSR хелпер
   Рендерить React-компоненти у HTML-рядок через ReactDOMServer.
   ============================================================ */

const React = require('react');
const ReactDOMServer = require('react-dom/server');

/**
 * Рендерить React-елемент у статичний HTML без зайвих react-маркерів.
 * (Ми не плануємо гідрацію — просто вставляємо HTML у DOM клієнта.)
 */
function renderToHtml(element) {
  return ReactDOMServer.renderToStaticMarkup(element);
}

/**
 * Визначає тему за серверним часом.
 * Темна — з 22:00 до 06:00.
 */
function getThemeByTime(date) {
  const hour = (date || new Date()).getHours();
  return (hour >= 22 || hour < 6) ? 'dark' : 'light';
}

module.exports = { React, renderToHtml, getThemeByTime };
