import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export const getLocations = async (req: Request, res: Response): Promise<void> => {
    const locations = await prisma.location.findMany();
    res.json(locations);
};

export const createLocation = async (req: Request, res: Response): Promise<void> => {
    const { name, address, agencyId } = req.body;
    const location = await prisma.location.create({
        data: { name, address, agencyId },
    });
    res.json(location);
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
    const { id, name, address, agencyId } = req.body;
    const location = await prisma.location.update({
        where: { id },
        data: { name, address, agencyId },
    });
};

export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;
    await prisma.location.delete({
        where: { id },
    });
};


export const getLocationByUserId = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const location = await prisma.location.findMany({
        where: {
            users: {
                some: {
                    id: userId
                }
            }
        },
        include: {
            agency: true,
        },
    });
    res.json(location);
};