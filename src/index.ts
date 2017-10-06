import Stats = require('stats.js');
import './three/extensions.ts';

import App from './App.ts';
import config from './config.ts';

function main() {
  const container = document.getElementById('emitter3d')!;
  const app = new App(container);
  window.addEventListener('resize', app.updateSize.bind(app));

  const stats = new Stats();
  stats.showPanel(0);

  config.toggle('show stats', true, show => {
    if (show) {
      document.body.appendChild(stats.dom);
    } else {
      document.body.removeChild(stats.dom);
    }
  });

  function animate() {
    stats.begin();
    app.update();
    app.render();
    stats.end();

    requestAnimationFrame(animate);
  }

  animate();
}

export = main;

