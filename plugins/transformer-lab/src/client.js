import { createUI } from './ui.js';

window.__ModuleLoader__.load({
  id: '@local/transformer-lab',
  factory(require) {
    return createUI(require('react'));
  },
});
