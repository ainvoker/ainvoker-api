import env from "./config/env.js";
import app from "./app.js";

class Server {
    start() {
        app.express.listen(env.PORT, () => {
            console.log(`AInvoker API running on port ${env.PORT}`);
        });
    }
}

new Server().start();
