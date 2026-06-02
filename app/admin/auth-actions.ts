'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { sendAdminOtpEmail } from '@/lib/email/actions';

export async function requestAdminOtpAction(email: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const db = getFirestore(adminApp);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Clean email for document ID
    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Store in Firestore with an expiration time of 10 minutes
    await db.collection('admin_otps').doc(docId).set({
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      email
    });

    // Send the email
    const emailResult = await sendAdminOtpEmail(email, otp);
    if (!emailResult.success) {
      throw new Error(emailResult.error as string);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in requestAdminOtpAction:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyAdminOtpAction(email: string, code: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const db = getFirestore(adminApp);
    
    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const otpRef = db.collection('admin_otps').doc(docId);
    const otpDoc = await otpRef.get();
    
    if (!otpDoc.exists) {
      return { success: false, error: 'OTP not found. Please request a new one.' };
    }
    
    const data = otpDoc.data();
    
    if (data?.expiresAt < Date.now()) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }
    
    if (data?.otp !== code) {
      return { success: false, error: 'Invalid verification code.' };
    }
    
    // Valid OTP - clean it up
    await otpRef.delete();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in verifyAdminOtpAction:', error);
    return { success: false, error: error.message };
  }
}
