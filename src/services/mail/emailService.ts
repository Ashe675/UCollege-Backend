import { transporter } from "../../config/mailt";

export async function sendEmailResults(email : string) {
    const info = await transporter.sendMail({
        from: '"UCOLLEGE 👻" <no-reply@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Resultados de Examen de Admisión UCollege", // Subject line
        html: `
            <b>Holaaa</b>
        ` 
      });
      console.log(info)
}