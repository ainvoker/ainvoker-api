import { env } from "./config/env.js";
import app from "./app.js";
app.listen(env.PORT, () => {
    console.log(`AInvoker API running on port ${env.PORT}`);
});
//# sourceMappingURL=server.js.map