import './src/instrumentation.js';
import 'dotenv/config';
import { createApp } from './src/app.js';

const PORT = process.env.PORT || 8080;
const app = createApp();

app.listen(PORT, () => {
  console.log(`LMDR API listening on :${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
