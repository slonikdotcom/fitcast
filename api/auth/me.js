/* ============================================================
   GET /api/auth/me
   Повертає поточного користувача (за cookie-сесією) або 401.
   ============================================================ */

const { getUserFromRequest } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Не авторизовано' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error('[me] error:', err);
    return res.status(500).json({ error: 'Помилка сервера' });
  }
};
