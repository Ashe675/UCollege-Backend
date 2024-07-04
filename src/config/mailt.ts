import nodemailer from 'nodemailer'
import colors from 'colors';

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.PASSWORD_MAIL,
    },
  });

transporter.verify().then(() => {
    console.log(colors.blue.bold('Ready for send emails'))
})