import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllAgencies = async (req: Request, res: Response): Promise<void> => {
    try {
        const agencies = await prisma.agency.findMany();
        res.json(agencies);
    } catch (error) {
        res.status(500).json({ message: "Error fetching agencies", error: error });
    }
};

// get agency by id
export const getAgencyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const agency = await prisma.agency.findUnique({
            where: { id },
        });
        
        if (!agency) {
            res.status(404).json({ message: "Agency not found" });
            return;
        }
        
        res.json(agency);
    } catch (error) {
        res.status(500).json({ message: "Error fetching agency", error: error });
    }
};

// create agency
export const createAgency = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, isActive, hasScheduleV2, hasEMAR, hasFinance } = req.body;
        const agency = await prisma.agency.create({
            data: { 
                name,
                isActive: isActive ?? true,
                hasScheduleV2: hasScheduleV2 ?? true,
                hasEMAR: hasEMAR ?? false,
                hasFinance: hasFinance ?? false
            },
        });
        res.status(201).json(agency);
    } catch (error) {
        res.status(500).json({ message: "Error creating agency", error: error });
    }
};

// update agency
export const updateAgency = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const agency = await prisma.agency.update({
            where: { id },
            data: updateData,
        });
        
        res.json(agency);
    } catch (error) {
        res.status(500).json({ message: "Error updating agency", error: error });
    }
};

// delete agency
export const deleteAgency = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.agency.delete({
            where: { id },
        });
        res.json({ message: "Agency deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting agency", error: error });
    }
};

// get all users by agency id
export const getAllUsersByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const users = await prisma.user.findMany({
            where: { agencyId: id },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error });
    }
};

// get all schedules by agency id
export const getAllSchedulesByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const schedules = await prisma.schedule.findMany({
            where: { agencyId: id },
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: "Error fetching schedules", error: error });
    }
};

// get all clients by agency id
export const getAllClientsByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const clients = await prisma.client.findMany({
            where: { agencyId: id },
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: "Error fetching clients", error: error });
    }
};

// get all invoices by agency id
export const getAllInvoicesByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const invoices = await prisma.invoice.findMany({
            where: { agencyId: id },
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: "Error fetching invoices", error: error });
    }
};

// get all mileage records by agency id
export const getAllMileageRecordsByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const mileageRecords = await prisma.mileageRecord.findMany({
            where: { agencyId: id },
        });
        res.json(mileageRecords);
    } catch (error) {
        res.status(500).json({ message: "Error fetching mileage records", error: error });
    }
};

// get all incident reports by agency id
export const getAllIncidentReportsByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const incidentReports = await prisma.incidentReport.findMany({
            where: { agencyId: id },
        });
        res.json(incidentReports);
    } catch (error) {
        res.status(500).json({ message: "Error fetching incident reports", error: error });
    }
};

// get all medication records by agency id
export const getAllMedicationRecordsByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const medicationRecords = await prisma.medicationRecord.findMany({
            where: { 
                client: {
                    agencyId: id
                }
            },
        });
        res.json(medicationRecords);
    } catch (error) {
        res.status(500).json({ message: "Error fetching medication records", error: error });
    }
};

// get all documents by agency id
export const getAllDocumentsByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const documents = await prisma.document.findMany({
            where: { agencyId: id },
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching documents", error: error });
    }
};

// get all medication database links by agency id
export const getAllMedicationDatabaseLinksByAgencyId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const medicationDatabaseLinks = await prisma.medicationDatabaseLink.findMany({
            where: { agencyId: id },
        });
        res.json(medicationDatabaseLinks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching medication database links", error: error });
    }
};
