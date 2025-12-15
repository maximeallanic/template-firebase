/**
 * Simple name generator without external dependencies
 * Uses predefined lists of first and last names
 */

const FIRST_NAMES = [
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica', 'sarah', 'karen',
  'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle',
  'dorothy', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
  'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen',
];

const LAST_NAMES = [
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez',
  'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin',
  'lee', 'perez', 'thompson', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson',
  'walker', 'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores',
  'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell', 'carter', 'roberts',
  'gomez', 'phillips', 'evans', 'turner', 'diaz', 'parker', 'cruz', 'edwards', 'collins', 'reyes',
  'stewart', 'morris', 'morales', 'murphy', 'cook', 'rogers', 'gutierrez', 'ortiz', 'morgan', 'cooper',
  'peterson', 'bailey', 'reed', 'kelly', 'howard', 'ramos', 'kim', 'cox', 'ward', 'richardson',
];

/**
 * Generates a unique email address using random names
 * Format: firstname.lastname@domain
 */
export function generateUniqueEmailAddress(domain: string): {
  emailAddress: string;
  displayName: string;
} {
  // Use timestamp + random for better uniqueness
  const seed = Date.now() + Math.floor(Math.random() * 1000000);

  // Select random first and last names
  const firstIndex = seed % FIRST_NAMES.length;
  const lastIndex = Math.floor(seed / FIRST_NAMES.length) % LAST_NAMES.length;

  const firstName = FIRST_NAMES[firstIndex];
  const lastName = LAST_NAMES[lastIndex];

  // Clean names (already lowercase, no special chars)
  const cleanFirstName = firstName.replace(/[^a-z0-9]/g, '');
  const cleanLastName = lastName.replace(/[^a-z0-9]/g, '');

  const emailAddress = `${cleanFirstName}.${cleanLastName}@${domain}`;
  const displayName = `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${
    lastName.charAt(0).toUpperCase() + lastName.slice(1)
  }`;

  return {
    emailAddress,
    displayName,
  };
}

/**
 * Generates a random seed for name generation to ensure uniqueness
 */
export function generateSeedFromTimestamp(): number {
  return Date.now() + Math.floor(Math.random() * 1000000);
}
