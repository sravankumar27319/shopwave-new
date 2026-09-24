import app from "./app.js";
import config from "./config/index.js";

app.listen(config.port, () => {
  console.log(`ShopWave server running on port ${config.port} in ${config.nodeEnv} mode`);
});
