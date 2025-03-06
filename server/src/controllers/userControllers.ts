import { Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    const users = await prisma.user.findMany();
    res.json(users);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cognitoId, email, firstName, lastName, role } = req.body;
        console.log("cognitoId", cognitoId);
        console.log("email", email);
        const user = await prisma.user.create({
            data: { 
                cognitoId, 
                email, 
                firstName, 
                lastName, 
                role: role as Role 
            },
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error });
    }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const { cognitoId } = req.params;
    console.log("cognitoId", cognitoId);
    const user = await prisma.user.findUnique({
        where: { cognitoId },
    });

    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    res.json(user);
};
