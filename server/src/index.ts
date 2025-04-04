import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import agencyRoutes from "./routes/agencyRoutes";
//import { authMiddleware } from "./middleware/authMiddleware";
import invitationRoutes from "./routes/invitationRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import dashboardRoutes from "./routes/dashboardRoutes"


/* CONFIGURATIONS */
dotenv.config();

const PORT = process.env.PORT || 3001 ;
const app = express();

/* MIDDLEWARES */
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */

app.get("/", (req, res) => {
  res.send("This is the home route");
});

app.use("/users", userRoutes);
app.use("/agencies", agencyRoutes);
app.use("/invitations", invitationRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/api/users", userRoutes)
app.use("/api/invitations", invitationRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/dashboard", dashboardRoutes)

/* SERVER */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
