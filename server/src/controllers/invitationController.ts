import { Request, Response } from "express";
import { PrismaClient, Role, InvitationStatus } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

console.log(process.env.EMAIL_HOST);
console.log(process.env.EMAIL_PORT);
console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASSWORD);

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },

});

// Encryption functions for URL parameters
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'S7fDIbAS4BDuhreXPufDWPwJT8hsEaae';
const IV_LENGTH = 16;

function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}


// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.error("SMTP server connection error:", error);
    } else {
        console.log("SMTP server connection successful");
    }
});

export const createInvitation = async (req: Request, res: Response): Promise<void> => {
    const { inviterUserId, email, role, expirationDays = 7 } = req.body;
    const inviter = await prisma.user.findUnique({
        where: { id: inviterUserId },
    });

    if (!inviter) {
        res.status(404).json({ error: "Inviter not found" });
        return;
    }

    // Verify inviter has permission to invite users
    if (![Role.ADMIN, Role.SOFTWARE_OWNER].includes(inviter.role as any)) {
        res.status(403).json({ error: "You do not have permission to invite users" });
        return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findUnique({
        where: { email },
    });

    if (existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
        res.status(400).json({ error: "An invitation has already been sent to this email" });
        return;
    }

    // Create expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create the invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
        data: {
            email,
            token,
            role,
            expiresAt,
            inviterId: inviterUserId,
        },
    });

   
    // Create payload to encrypt
    const payload = JSON.stringify({
        token,
        role,
        inviterId: inviterUserId,
        email
    });
    
    // Encrypt the payload
    const encryptedData = encrypt(payload);
    
    // Generate invitation URL with encrypted data
    const inviteUrl = `${process.env.FRONTEND_URL}/signup/${encodeURIComponent(encryptedData)}`;
  
    // Send email using nodemailer
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            to: email,
            subject: `You've been invited to join our platform`,
            html: `
                <h1>You've been invited to join ${process.env.APP_NAME}.</h1>
                <p>${inviter.email} has invited you to join 
                   our platform as a ${role.replace('_', ' ').toLowerCase()}.</p>
                <p>Click the link below to create your account:</p>
                <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000000; color: white; text-decoration: none; border-radius: 4px;">
                  Accept Invitation
                </a>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: "Failed to send invitation email", details: error });
        return;
    }

    res.status(201).json(invitation);
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitationId, userId } = req.body;
        
        // Start a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Verify the invitation
            const invitation = await tx.invitation.findUnique({
                where: { id: invitationId },
            });

            if (!invitation || invitation.status !== InvitationStatus.PENDING || new Date() > invitation.expiresAt) {
                throw new Error('Invalid or expired invitation');
            }

            // Update invitation status
            await tx.invitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.ACCEPTED },
            });

            // Update user with proper information
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { 
                    invitedById: invitation.inviterId,
                
                    role: invitation.role
                },
            });

            if (!updatedUser) {
                throw new Error('User not found');
            }

            return { invitation, user: updatedUser };
        });

        res.status(200).json({ message: "Invitation accepted successfully", data: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

// Verify an invitation token
export const verifyInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { inviter: true },
        });

        if (!invitation) {
            res.status(404).json({ error: 'Invalid invitation token' });
            return;
        }

        if (invitation.status !== InvitationStatus.PENDING) {
            res.status(400).json({ error: 'This invitation has already been used or canceled' });
            return;
        }

        if (new Date() > invitation.expiresAt) {
            // Update invitation status to expired
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: InvitationStatus.EXPIRED },
            });
            res.status(400).json({ error: 'This invitation has expired' });
            return;
        }

        res.status(200).json(invitation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all invitations created by a user
export const getUserInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { inviterId } = req.params;
        const { status } = req.query;
        
        const where: any = { inviterId };
        
        if (status) {
            where.status = status as InvitationStatus;
        }
        
        const invitations = await prisma.invitation.findMany({
            where,
            include: {
                inviter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        
        res.status(200).json(invitations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get invitations sent to a specific email
export const getInvitationsByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.params;
        
        const invitations = await prisma.invitation.findMany({
            where: { 
                email,
                status: InvitationStatus.PENDING
            },
            include: {
                inviter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        
        res.status(200).json(invitations);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel an invitation
export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { invitationId } = req.params;
        const { userId } = req.body;
        
        // Check if user has permission
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || ![Role.ADMIN, Role.SOFTWARE_OWNER].includes(user.role as any)) {
            res.status(403).json({ error: 'You do not have permission to cancel invitations' });
            return;
        }

        // Get the invitation
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
        });

        if (!invitation) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }

        // Check if user is the one who created the invitation
        if (invitation.inviterId !== userId) {
            res.status(403).json({ error: 'You do not have permission to cancel this invitation' });
            return;
        }

        // Update invitation status
        const updatedInvitation = await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: InvitationStatus.CANCELED },
        });
        
        res.status(200).json(updatedInvitation);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
