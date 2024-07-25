/**
 * Genera una contraseña aleatoria que contiene números y caracteres.
 * La longitud de la contraseña es aleatoria, entre 12 y 100 caracteres.
 * 
 * @returns {string} - Una contraseña aleatoria.
 */
export async function generatePasswordUser(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@';
    const minLength = 12;
    const maxLength = 20;
    const passwordLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    
    let password = '';
    
    for (let i = 0; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters[randomIndex];
    }
    
    return password;
}