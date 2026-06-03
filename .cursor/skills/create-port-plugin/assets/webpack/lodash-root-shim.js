/**
 * Drop-in replacement for lodash/_root.js without Function("return this").
 * Port plugin upload rejects bundles that use the Function constructor.
 */
module.exports =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof self !== "undefined"
      ? self
      : typeof window !== "undefined"
        ? window
        : {};
