// export function numberToWordsFr(number: number): string {
//   const units = [
//     '',
//     'un',
//     'deux',
//     'trois',
//     'quatre',
//     'cinq',
//     'six',
//     'sept',
//     'huit',
//     'neuf',
//   ];
//   const teens = [
//     'dix',
//     'onze',
//     'douze',
//     'treize',
//     'quatorze',
//     'quinze',
//     'seize',
//     'dix-sept',
//     'dix-huit',
//     'dix-neuf',
//   ];
//   const tens = [
//     '',
//     '',
//     'vingt',
//     'trente',
//     'quarante',
//     'cinquante',
//     'soixante',
//     'soixante-dix',
//     'quatre-vingt',
//     'quatre-vingt-dix',
//   ];
//   const thousands = ['', 'mille', 'million', 'milliard'];

//   function convertLessThanThousand(num: number): string {
//     if (num === 0) return '';
//     if (num < 10) return units[num];
//     if (num < 20) return teens[num - 10];
//     if (num < 100) {
//       const ten = Math.floor(num / 10);
//       const unit = num % 10;
//       return `${tens[ten]}${unit > 0 ? '-' + units[unit] : ''}`;
//     }
//     const hundred = Math.floor(num / 100);
//     const rest = num % 100;
//     return `${hundred > 1 ? units[hundred] + ' ' : ''}cent${rest > 0 ? ' ' + convertLessThanThousand(rest) : ''}`;
//   }

//   if (number === 0) return 'zéro';
//   let parts: string[] = [];
//   let index = 0;

//   while (number > 0) {
//     const chunk = number % 1000;
//     if (chunk > 0) {
//       const chunkStr = convertLessThanThousand(chunk);
//       parts.unshift(
//         `${chunkStr}${thousands[index] ? ' ' + thousands[index] : ''}`,
//       );
//     }
//     number = Math.floor(number / 1000);
//     index++;
//   }

//   return parts.join(' ').trim();
// }

export function numberToWordsFr(num: number): string {
  if (num === 0) return 'zéro';

  const unites = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
  ];

  const dizaines = [
    '',
    '',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante-dix',
    'quatre-vingt',
    'quatre-vingt-dix',
  ];

  function convertirMoinsDeMillle(n: number): string {
    if (n === 0) return '';
    if (n < 20) return unites[n];
    if (n < 100) {
      const diz = Math.floor(n / 10);
      const un = n % 10;
      if (diz === 7 || diz === 9) {
        return dizaines[diz - 1] + (un === 0 ? '-dix' : '-' + unites[10 + un]);
      }
      if (diz === 8) {
        return un === 0
          ? dizaines[diz] + 's'
          : dizaines[diz] + '-' + unites[un];
      }
      return (
        dizaines[diz] +
        (un > 0 ? (un === 1 && diz < 8 ? ' et un' : '-' + unites[un]) : '')
      );
    }

    const cent = Math.floor(n / 100);
    const reste = n % 100;
    let result = cent === 1 ? 'cent' : unites[cent] + ' cent';
    if (cent > 1 && reste === 0) result += 's';
    if (reste > 0) result += ' ' + convertirMoinsDeMillle(reste);
    return result;
  }

  function convertirNombre(n: number): string {
    if (n === 0) return 'zéro';
    if (n < 1000) return convertirMoinsDeMillle(n);

    const milliards = Math.floor(n / 1000000000);
    const millions = Math.floor((n % 1000000000) / 1000000);
    const milliers = Math.floor((n % 1000000) / 1000);
    const reste = n % 1000;

    let result = '';

    if (milliards > 0) {
      result += convertirMoinsDeMillle(milliards) + ' milliard';
      if (milliards > 1) result += 's';
    }

    if (millions > 0) {
      if (result) result += ' ';
      result += convertirMoinsDeMillle(millions) + ' million';
      if (millions > 1) result += 's';
    }

    if (milliers > 0) {
      if (result) result += ' ';
      result +=
        milliers === 1 ? 'mille' : convertirMoinsDeMillle(milliers) + ' mille';
    }

    if (reste > 0) {
      if (result) result += ' ';
      result += convertirMoinsDeMillle(reste);
    }

    return result;
  }

  // Séparer la partie entière et décimale
  const partieEntiere = Math.floor(num);
  const partieDecimale = Math.round((num - partieEntiere) * 100);

  let resultat = convertirNombre(partieEntiere);

  // Ajouter les centimes si > 0
  if (partieDecimale > 0) {
    resultat += ' virgule ' + convertirNombre(partieDecimale);
  }

  return resultat;
}
