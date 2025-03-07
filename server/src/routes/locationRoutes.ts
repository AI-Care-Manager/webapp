import express from "express";
import { createLocation, deleteLocation, getLocationByUserId, getLocations, updateLocation } from "../controllers/locationContoller";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);
router.get("/user/:userId", getLocationByUserId);
        export default router;
