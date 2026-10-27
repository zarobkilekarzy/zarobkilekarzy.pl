/** Czy plik Markdown/MDX to treść angielska (src/content/en/) — wtyczki Markdownu wybierają po tym etykiety. */
export const isEnglishSource = (fileURL: URL | undefined) => Boolean(fileURL?.pathname.includes('/src/content/en/'));
