// funcion para capitalizar una cadena
export const capitalizeFirstLetter = (str: string) => {
    if (!str) return str; // Maneja el caso de cadena vacía
    return str.charAt(0).toUpperCase() + str.slice(1);
};


export const capitalizeWords = (str :  string) => {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
