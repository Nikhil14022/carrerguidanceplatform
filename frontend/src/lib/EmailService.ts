import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configure the transport layer using SMTP
// For production, environment variables should be set (e.g., SendGrid, AWS SES)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email', // Fallback to Ethereal for testing
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export class EmailService {
    /**
     * Send a Welcome Email to a new user
     */
    static async sendWelcomeEmail(to: string, name: string) {
        const subject = 'Welcome to Career Path!';
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4f46e5;">Welcome to Career Path, ${name}!</h1>
                <p>We are thrilled to have you onboard. Career Path is designed to help you discover, track, and achieve your professional goals.</p>
                <p>To get started, please log in to your dashboard and complete your initial questionnaires.</p>
                <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">Go to Dashboard</a>
                <p style="margin-top: 30px; font-size: 12px; color: #888;">If you did not create this account, please ignore this email.</p>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send an email notifying a user that their Module Review was approved
     */
    static async sendModuleApprovedEmail(to: string, name: string, moduleTitle: string) {
        const subject = 'Module Completed & Approved!';
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10b981;">Great job, ${name}!</h2>
                <p>Your submission for the module <strong>"${moduleTitle}"</strong> has been reviewed and approved by our expert team.</p>
                <p>You can now proceed to the next step in your career roadmap.</p>
                <a href="${process.env.NEXTAUTH_URL}/dashboard/modules" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Next Steps</a>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send an email notifying a user that their Final Career Report is ready
     */
    static async sendReportReadyEmail(to: string, name: string, reportUrl: string) {
        const subject = 'Your Career Analysis Report is Ready';
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #6366f1;">Your AI Career Analysis is complete!</h2>
                <p>Hi ${name},</p>
                <p>Your personalized career report, including top recommended trajectories and action plans, has been generated.</p>
                <p>You can view and download your PDF report directly from your dashboard.</p>
                <a href="${process.env.NEXTAUTH_URL}${reportUrl}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Report</a>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send an Appointment Confirmation
     */
    static async sendAppointmentConfirmation(to: string, name: string, date: string, time: string, expertName: string) {
        const subject = 'Expert Appointment Confirmed';
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #f59e0b;">Appointment Confirmed</h2>
                <p>Hi ${name},</p>
                <p>Your 1-on-1 session with <strong>${expertName}</strong> is confirmed.</p>
                <ul>
                    <li><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</li>
                    <li><strong>Time:</strong> ${time}</li>
                </ul>
                <p>Please ensure you are logged into the platform 5 minutes before the scheduled time.</p>
                <a href="${process.env.NEXTAUTH_URL}/dashboard/appointments" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">Manage Appointments</a>
            </div>
        `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Base sender function
     */
    private static async sendEmail(to: string, subject: string, html: string) {
        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Career Path Team" <noreply@careerpath.com>',
                to,
                subject,
                html,
            });
            console.log('Message sent: %s', info.messageId);

            // Log to local file for preview
            try {
                const logPath = path.join(process.cwd(), 'email-logs.json');
                const existing = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
                existing.unshift({
                    id: info.messageId,
                    date: new Date().toISOString(),
                    to, subject, html
                });
                fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
            } catch (fsErr) {
                console.error("Failed to log email locally", fsErr);
            }

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            // In a production environment, you might want to log this to a monitoring service
            return { success: false, error };
        }
    }
}
