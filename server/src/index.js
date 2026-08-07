import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, config.host, () => {
  // eslint-disable-next-line no-console
  console.log(`EquiCheck API listening on http://${config.host}:${config.port}`);
});
