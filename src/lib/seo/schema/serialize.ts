/**
 * JSON do <script type="application/ld+json">. Zwykły JSON.stringify przepuszcza „</script>”
 * z treści (np. w tytule czy opisie) i zamyka skrypt przedwcześnie — znaki, które HTML lub JS
 * mógłby zinterpretować, zamieniamy na sekwencje \uXXXX (dalej poprawny JSON).
 */
const UNSAFE = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, 'g');
const escape = (char: string) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;

export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(UNSAFE, escape);
