import "dotenv/config";
import { app, initializeDatabaseConnection } from "./app.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initializeDatabaseConnection();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
