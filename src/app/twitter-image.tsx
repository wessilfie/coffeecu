// Twitter/X uses twitter:image meta tag, which Next.js serves from this file.
// Re-export everything from opengraph-image so both use the same design.
export { default, runtime, alt, size, contentType } from './opengraph-image';
