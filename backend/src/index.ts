import { env } from './config/env';
import app from './app';

const PORT = env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SEAL-HMS Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});
