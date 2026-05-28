const { runDemoController, listDemosController } = require('../controllers/demoController');

function canHandleDemoRoute(method, url) {
  return (
    (method === 'POST' && url === '/api/demo/run') ||
    (method === 'GET' && url === '/api/demo/registry')
  );
}

async function demoRouteHandler(req, res, method, url) {
  if (method === 'POST' && url === '/api/demo/run') {
    return runDemoController(req, res);
  }
  if (method === 'GET' && url === '/api/demo/registry') {
    return listDemosController(req, res);
  }
  return res.status(404).json({
    ok: false,
    error: 'مسار الديمو غير موجود',
    errorCode: 'DEMO_ROUTE_NOT_FOUND'
  });
}

module.exports = {
  canHandleDemoRoute,
  demoRouteHandler
};
