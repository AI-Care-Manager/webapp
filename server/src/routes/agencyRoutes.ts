import express from "express";
import {
    getAllAgencies,
    getAgencyById,
    createAgency,
    updateAgency,
    deleteAgency,
    getAllUsersByAgencyId,
    getAllSchedulesByAgencyId,
    getAllClientsByAgencyId,
    getAllInvoicesByAgencyId,
    getAllMileageRecordsByAgencyId,
    getAllIncidentReportsByAgencyId,
    getAllMedicationRecordsByAgencyId,
    getAllDocumentsByAgencyId,
    getAllMedicationDatabaseLinksByAgencyId
} from "../controllers/agencyController";

const router = express.Router();

// Agency CRUD routes
router.get("/", getAllAgencies);
router.get("/:id", getAgencyById);
router.post("/", createAgency);
router.put("/:id", updateAgency);
router.delete("/:id", deleteAgency);

// Agency relationship routes
router.get("/:id/users", getAllUsersByAgencyId);
router.get("/:id/schedules", getAllSchedulesByAgencyId);
router.get("/:id/clients", getAllClientsByAgencyId);
router.get("/:id/invoices", getAllInvoicesByAgencyId);
router.get("/:id/mileage-records", getAllMileageRecordsByAgencyId);
router.get("/:id/incident-reports", getAllIncidentReportsByAgencyId);
router.get("/:id/medication-records", getAllMedicationRecordsByAgencyId);
router.get("/:id/documents", getAllDocumentsByAgencyId);
router.get("/:id/medication-database-links", getAllMedicationDatabaseLinksByAgencyId);

export default router;
