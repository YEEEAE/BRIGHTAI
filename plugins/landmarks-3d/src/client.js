import { createUI } from './ui.js';

window.__ModuleLoader__.load({
  id: '@local/landmarks-3d',
  factory(require) {
    return createUI(require('react'));
  },
});
