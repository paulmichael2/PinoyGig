import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const adminUserId = process.env.ADMIN_USER_ID || '';
const adminName = process.env.ADMIN_NAME || 'PinoyGig Admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@pinoygig.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

const seedAdmin = async () => {
    try {
        await connectDB();

        const demotionFilter = adminUserId ? { _id: { $ne: adminUserId }, isWalletAdmin: true } : { email: { $ne: adminEmail }, isWalletAdmin: true };

        await User.updateMany(demotionFilter, { $set: { isWalletAdmin: false } });

        if (adminUserId) {
            const existingUser = await User.findById(adminUserId).select('+password');

            if (!existingUser) {
                throw new Error(`User not found for ADMIN_USER_ID=${adminUserId}`);
            }

            existingUser.role = 'admin';
            existingUser.isWalletAdmin = true;

            if (process.env.ADMIN_NAME) {
                existingUser.name = adminName;
            }

            if (process.env.ADMIN_EMAIL) {
                existingUser.email = adminEmail;
            }

            if (process.env.ADMIN_PASSWORD) {
                existingUser.password = adminPassword;
            }

            await existingUser.save();

            console.log(`Wallet admin promoted: ${existingUser.email} (${existingUser._id})`);
            process.exit(0);
        }

        const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');

        if (existingAdmin) {
            existingAdmin.name = adminName;
            existingAdmin.role = 'admin';
            existingAdmin.isWalletAdmin = true;

            if (process.env.ADMIN_PASSWORD) {
                existingAdmin.password = adminPassword;
            }

            await existingAdmin.save();

            console.log(`Wallet admin updated: ${existingAdmin.email}`);
        } else {
            const createdAdmin = await User.create({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                isWalletAdmin: true,
            });

            console.log(`Wallet admin created: ${createdAdmin.email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Failed to seed wallet admin:', error);
        process.exit(1);
    }
};

seedAdmin();