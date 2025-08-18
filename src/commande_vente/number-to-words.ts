export function numberToWordsFr(number: number): string {
  const units = [
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
  ];
  const teens = [
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
  const tens = [
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
  const thousands = ['', 'mille', 'million', 'milliard'];

  function convertLessThanThousand(num: number): string {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return `${tens[ten]}${unit > 0 ? '-' + units[unit] : ''}`;
    }
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    return `${hundred > 1 ? units[hundred] + ' ' : ''}cent${rest > 0 ? ' ' + convertLessThanThousand(rest) : ''}`;
  }

  if (number === 0) return 'zéro';
  let parts: string[] = [];
  let index = 0;

  while (number > 0) {
    const chunk = number % 1000;
    if (chunk > 0) {
      const chunkStr = convertLessThanThousand(chunk);
      parts.unshift(
        `${chunkStr}${thousands[index] ? ' ' + thousands[index] : ''}`,
      );
    }
    number = Math.floor(number / 1000);
    index++;
  }

  return parts.join(' ').trim();
}
