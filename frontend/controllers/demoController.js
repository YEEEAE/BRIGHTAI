const { runDemoExperience } = require('../services/demoExperienceService');
const { DEMO_KEYS, DEMO_PROMPTS } = require('../services/demoPromptRegistry');

async function runDemoController(req, res) {
  try {
    const result = await runDemoExperience(req.body || {});
    if (result.ok === false) {
      return res.status(503).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.userMessage || 'تعذر تشغيل تجربة الديمو',
      errorCode: error?.code || 'DEMO_RUN_ERROR'
    });
  }
}

async function listDemosController(_req, res) {
  return res.status(200).json({
    ok: true,
    demos: DEMO_KEYS.map(key => ({
      key,
      title: DEMO_PROMPTS[key].title,
      schemaName: DEMO_PROMPTS[key].schemaName
    }))
  });
}

module.exports = {
  runDemoController,
  listDemosController
};
