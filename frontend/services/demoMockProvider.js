const { getDemoPrompt } = require('./demoPromptRegistry');

function createMockDemoResponse({ demoType, input, model }) {
  const prompt = getDemoPrompt(demoType);
  const response = prompt.fallbackResponse(input, {
    scenario: input?.scenarioId,
    message: input?.message,
    metadata: input?.metadata
  });
  return {
    ...response,
    model
  };
}

async function runMockDemo(payload) {
  return createMockDemoResponse(payload);
}

async function* streamMockDemo(payload) {
  const response = createMockDemoResponse(payload);
  yield { type: 'start', demoType: payload.demoType, model: payload.model };
  yield { type: 'chunk', delta: response.summary };
  yield { type: 'result', data: response };
  yield { type: 'done' };
}

module.exports = {
  createMockDemoResponse,
  runMockDemo,
  streamMockDemo
};
