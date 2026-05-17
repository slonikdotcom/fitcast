// POST /api/auth/logout — очищує cookie сесії.
const { clearAuthCookie } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Метод не дозволений' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ ok: true });
};
