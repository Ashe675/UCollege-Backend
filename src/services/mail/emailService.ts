import { transporter } from "../../config/mailt";

type GradesUser = {
    results: {
        message: string;
        score: number;
        admissionTest: {
            name: string;
            code: string;
        };
    }[];
    opinion: {
        message: string;
    };
    person: {
        email: string;
        firstName: string;
        lastName: string;
    };
}

export async function sendEmailResults(grade: GradesUser) {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Resultados</title>
      </head>
      <body style="font-family: sans-serif;">
        <div style="">
          <h1 style="color: #242323; padding: 5px; text-align: center; width: 100%; display: flex; justify-content: center;">Resultados de Admisión</h1>
          <p style="color: #444; font-size: 24px;">
            Hola ${grade.person.firstName} ${grade.person.lastName} te saludamos de parte de <span style="color: #730dd9; font-weight: 900;">UCollege</span>, tus resultados de las pruebas de admisión fueron los siguientes:
          </p>
          ${grade.results.map(result => (
            `<div style="background: #eee; padding: 5px;">
              <h2 style="font-size: 24px;">${result.admissionTest.name} - ${result.admissionTest.code}:</h2>
              <p style="color: #444; font-size: 18px;"><span style="color: #2a2929; font-size: 18px; font-weight: 700;">Nota:</span> ${result.score} puntos</p>
              <p style="color: #444; font-size: 18px;">
                <span style="color: #2a2929; font-size: 18px; font-weight: 700;">Dictamen:</span> ${result.message}
              </p>
            </div>`
          )).join('')}
          <h3 style="font-size: 24px; font-weight: 900; margin: 0;">Dictamen Final</h3>
          <h4 style="color: #730dd9; font-size: 24px; font-weight: 900; margin: 0;">${grade.opinion.message}</h4>
        </div>
      </body>
    </html>`;


    const info = await transporter.sendMail({
        from: '"UCOLLEGE 👻" <no-reply@gmail.com>', // sender address
        to: grade.person.email, // list of receivers
        subject: "Resultados de Examen de Admisión UCollege", // Subject line
        html: htmlContent
    });

    console.log(info)
}