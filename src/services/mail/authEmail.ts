import { transporter } from "../../config/mailt"

interface IEmail {
    email: string
    name: string
    token: string
}

interface IEmail2 {
    email: string;
    password: string;
    name: string;
    newEmail
  }

export class AuthEmail {
    static sendPasswordResendToken = async (user: IEmail, isTeacher : boolean) => {
        const htmlContent =
            `<!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Restablecer Contraseña</title>
                </head>
                <body style="font-family: sans-serif">
                    <div
                    style="
                        background-color: #eee;
                        padding: 20px;
                        border-radius: 8px;
                        max-width: 600px;
                        margin: auto;
                    "
                    >
                    <h1
                        style="
                        color: #242323;
                        padding: 5px;
                        text-align: center;
                        display: flex;
                        justify-content: center;
                        "
                    >
                        Restablecer Contraseña
                    </h1>
                    <p style="color: #444; font-size: 24px">
                        Hola <span style="color: #730dd9; font-weight: 900">${user.name}</span>,
                        hiciste una petición para restablecer tu contraseña.
                    </p>
                    <p style="color: #444; font-size: 18px">Visita el siguiente link:</p>
                    <a
                        href="${process.env.FRONTEND_URL}/auth/new-password/${user.token}"
                        style="
                        color: #730dd9;
                        font-weight: 900;
                        font-size: 18px;
                        "
                    >
                        Restablecer Contraseña
                    </a>
                    <p style="color: #444; font-size: 18px">
                        E ingresa el siguiente código:
                        <b style="color: #2a2929; font-weight: 700">${user.token}</b>
                    </p>
                    <p style="color: #444; font-size: 18px">
                        ${isTeacher ? 'Este enlace expira en 2 minutos.' : 'Este token expira en 15 minutos.'}
                    </p>
                    </div>
                </body>
                </html>`


        await transporter.sendMail({
            from: '"UCOLLEGE 👻" <no-reply@gmail.com>',
            to: user.email,
            subject: 'UCollege - Restablece tu contraseña',
            text: 'UCollege - Restablece tu contraseña',
            html: htmlContent
        })
    }

    static sendPasswordAndEmail = async (user: IEmail2, isTeacher: boolean) => {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Información de Usuario</title>
          </head>
          <body style="font-family: sans-serif">
              <div
                  style="
                      background-color: #eee;
                      padding: 20px;
                      border-radius: 8px;
                      max-width: 600px;
                      margin: auto;
                  "
              >
                  <h1
                      style="
                          color: #242323;
                          padding: 5px;
                          text-align: center;
                          display: flex;
                          justify-content: center;
                      "
                  >
                      Información de Usuario
                  </h1>
                  <p style="color: #444; font-size: 24px">
                      Hola <span style="color: #730dd9; font-weight: 900">${user.name}</span>,
                  </p>
                  <p style="color: #444; font-size: 18px">
                      Aquí están tus credenciales de acceso:
                  </p>
                  <p style="color: #444; font-size: 18px">
                      <b>Email:</b> ${user.newEmail}
                  </p>
                  <p style="color: #444; font-size: 18px">
                      <b>Contraseña:</b> ${user.password}
                  </p>
                  <p style="color: #444; font-size: 18px">
                      ${isTeacher ? 'Recuerda cambiar tu contraseña después de iniciar sesión por primera vez.' : ''}
                  </p>
              </div>
          </body>
          </html>`;
    
        
    
        await transporter.sendMail({
            from: '"UCOLLEGE 👻" <no-reply@gmail.com>',
            to: user.email,
            subject: 'UCollege - Información de Usuario',
            text: `UCollege - Información de Usuario
        
            Email: ${user.email}
            Contraseña: ${user.password}
            `,
            html: htmlContent,
        });
    };
}