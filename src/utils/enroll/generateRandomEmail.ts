
/**
 * Shuffles an array.
 * 
 * @param {string[]} array - The array to shuffle.
 * @returns {string[]} - The shuffled array.
 */
export function shuffleArray(array: string[]): string[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function makeUserMethodSingle(partsName: string[]): string {
    let newPartsName : string[] = []
    let modifiedUsername = '';
    const indexSelected = Math.floor(Math.random() * partsName.length)
    const [firstElement] = partsName.splice(indexSelected, 1)
 
    newPartsName.push(firstElement)
    console.log(partsName)
    console.log(firstElement)

    for (let i = 0; i < partsName.length; i++) {
        let element = Math.random() > 0.4 ? partsName[i].replace(/ /g, '')[0] : partsName[i].replace(/ /g, '')
        if(Math.random() > 0.8 && !newPartsName.join('').includes('.')){
            element += '.'
        }
        newPartsName.push(element)
    }

    modifiedUsername = newPartsName.join('')

    return modifiedUsername;
}

export function insertRandomDots(username: string): string {
    let modifiedUsername = '';
    for (const char of username) {
      modifiedUsername += char;
      if (Math.random() > 0.5 && !modifiedUsername.endsWith('.') && !modifiedUsername.includes('.')) {
        modifiedUsername += '.';
      }
    }
    return modifiedUsername.toLowerCase();
  }