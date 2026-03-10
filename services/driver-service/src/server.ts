import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '8080');
const app = createApp();

app.listen(PORT, () => {
  console.log(`lmdr-driver-service listening on port ${PORT}`);
});
