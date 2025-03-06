import express from "express";
import {
    createInvitation,
    acceptInvitation,
    verifyInvitation,
    getUserInvitations,
    cancelInvitation,
    getInvitationsByEmail
} from "../controllers/invitationController";

const router = express.Router();

// Invitation routes
router.post("/", createInvitation);
router.post("/accept", acceptInvitation);
router.get("/verify/:token", verifyInvitation);
router.get("/user/:inviterId", getUserInvitations);
router.put("/cancel/:invitationId", cancelInvitation);
router.get("/email/:email", getInvitationsByEmail);

export default router;
