const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');

dotenv.config();

const emailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
  });
};



exports.sendWelcomeEmail = async (email, username) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/welcome.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username);

    let mailOptions = {
      from: process.env.ACCOUNT_EMAIL,
      to: email,
      subject: 'Welcome to 433tips',
      html: personalizedTemplate,
    };


    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Welcome email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the welcome email.');
  }
};

exports.sendVipSubcriptionEmail = async (email, username, duration, plan, activation, expire) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/vipSubcriptionActive.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{duration}}', duration).replace('{{plan}}', plan).replace('{{activation}}', activation).replace('{{expire}}', expire);


    let mailOptions = {
      from: process.env.PAYMENT_EMAIL,
      to: email,
      subject: 'VIP Activated',
      html: personalizedTemplate,
    };


    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Vip activation email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the vip activation email.');
  }
};

exports.sendVipExpiration = async (email, username, expire) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/vipExpires.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{expiryDate}}', expire);

    let mailOptions = {
      from: process.env.PAYMENT_EMAIL,
      to: email,
      subject: 'VIP Expired',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Vip expiration email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send vip expiration email.');
  }
};

exports.sendVerificationCodeEmail = async (email, username, verificationCode) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/verification.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{verificationCode}}', verificationCode);

    let mailOptions = {
      from: process.env.ACCOUNT_EMAIL,
      to: email,
      subject: 'Your Verification Code',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Vip verification email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the verification email.');
  }
};

exports.contactEmail = async (email, username, message) => {
  if (!email || !username || !message) {
    throw new Error('Email, username and message are required to send a contact email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/contact.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{email}}', email).replace('{{message}}', message);

    let mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      subject: 'Contact Us',
      html: personalizedTemplate,
    };


    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Contact email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the verification email.');
  }
};

exports.sendNewsletterEmails = async (emails, subject, message) => {
  const emailPath = path.join(__dirname, '../client/newsletters.html');
  const template = fs.readFileSync(emailPath, 'utf-8');
  const batchSize = 10;
  const batchDelay = 10000;
  const successfulEmails = [];

  if (Array.isArray(emails)) {
    for (let i = 0; i < emails.length; i += batchSize) {
      const batchEmails = emails.slice(i, i + batchSize);
      const promises = batchEmails.map(email => {
        const username = email.split('@')[0];
        const personalizedTemplate = template.replace('{{username}}', username).replace('{{message}}', message).replace('{{subject}}', subject);

        let mailOptions = {
          from: process.env.INFO_EMAIL,
          to: email,
          subject,
          html: personalizedTemplate,
        };

        return transporter.sendMail(mailOptions);
      });

      const results = await Promise.all(promises);
      successfulEmails.push(...results.filter(result => result.accepted.length > 0).map(result => result.accepted[0]));
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  } else {
    const username = emails.split('@')[0];
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{content}}', text);

    let mailOptions = {
      from: process.env.INFO_EMAIL,
      to: emails,
      subject,
      html: personalizedTemplate,
    };
    const result = await transporter.sendMail(mailOptions);
    successfulEmails.push(result.accepted[0]);
  }

  return successfulEmails;
}

exports.sendVipRemainder = async (email, username, duration) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const emailPath = path.join(__dirname, '../client/remainder.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{duration}}', duration);

    let mailOptions = {
      from: process.env.PAYMENT_EMAIL,
      to: email,
      subject: 'Your Vip Remainder',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Vip remainder email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the remainder email.');
  }
};

exports.sendPasswordResetEmail = async (username, email, resetToken) => {

  try {
    const emailPath = path.join(__dirname, '../client/passwordEmailReset.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const resetUrl = `${process.env.WEBSITE_LINK}/authentication/reset/${resetToken}`;
    const personalizedTemplate = template.replace('{{username}}', username).replace('{{resetUrl}}', resetUrl);


    let mailOptions = {
      from: process.env.ACCOUNT_EMAIL,
      to: email,
      subject: 'Password Reset Request',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
  }
};

exports.sendResetSucessfulEmail = async (username, email) => {

  try {
    const emailPath = path.join(__dirname, '../client/passwordResetSuccesful.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template.replace('{{username}}', username);


    let mailOptions = {
      from: process.env.ACCOUNT_EMAIL,
      to: email,
      subject: 'Password Reset Successful',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending successful reset email:', error);
  }
};


exports.deleteAccountEmail = async (email, username, details) => {
  const subject = details.deletedByAdmin
    ? 'Your Account Has Been Deleted by Administrator'
    : 'Account Deletion Successful';

  const deletionDate = new Date(details.deletionDate).toLocaleString();

  let message = ``;

  if (details.deletedByAdmin) {
    message += `Your account has been deleted by an administrator (admin@433tips.com) on ${deletionDate}.`;
    if (details.bulkDeletion) {
      message += '\nThis action was part of a bulk account cleanup process.';
    }
  } else {
    message += `As requested, your account has been successfully deleted on ${deletionDate}.`;
  }


  try {
    const emailPath = path.join(__dirname, '../client/accountDeleted.html');
    const template = fs.readFileSync(emailPath, 'utf-8');
    const personalizedTemplate = template
      .replace('{{username}}', username)
      .replace('{{message}}', message);

    let mailOptions = {
      from: process.env.SUPPORT_ADMIN_EMAIL,
      to: email,
      subject: subject,
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error('Error sending account deletion email:', error);
  }
};



module.exports = exports;