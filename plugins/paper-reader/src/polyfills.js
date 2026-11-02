/**
 * Small compatibility layer for the PDF.js 6 runtime.
 *
 * The reader may be opened in any browser supported by the Harness, while
 * PDF.js assumes a handful of very recent built-ins. The implementations below
 * are only installed when the native method is missing.
 */

(() => {
  const define = (target, name, value) => {
    if (typeof target[name] === 'function') return;
    Object.defineProperty(target, name, {
      value,
      configurable: true,
      writable: true,
    });
  };

  define(Promise, 'withResolvers', function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  });

  define(Promise, 'try', function tryFn(callback, ...args) {
    return new Promise((resolve) => resolve(callback(...args)));
  });

  define(URL, 'parse', function parse(url, base) {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  });

  define(Map.prototype, 'getOrInsert', function getOrInsert(key, value) {
    if (this.has(key)) return this.get(key);
    this.set(key, value);
    return value;
  });

  define(Map.prototype, 'getOrInsertComputed', function getOrInsertComputed(key, callback) {
    if (this.has(key)) return this.get(key);
    const value = callback.call(this, key);
    this.set(key, value);
    return value;
  });

  define(Uint8Array.prototype, 'toHex', function toHex() {
    let output = '';
    for (const byte of this) output += byte.toString(16).padStart(2, '0');
    return output;
  });

  define(Uint8Array, 'fromHex', function fromHex(hex) {
    const value = String(hex);
    if (value.length % 2 !== 0) throw new SyntaxError('Invalid hex string');
    const result = new Uint8Array(value.length / 2);
    for (let index = 0; index < result.length; index += 1) {
      const pair = value.slice(index * 2, index * 2 + 2);
      if (!/^[0-9a-f]{2}$/i.test(pair)) throw new SyntaxError('Invalid hex string');
      result[index] = Number.parseInt(pair, 16);
    }
    return result;
  });

  define(Uint8Array.prototype, 'toBase64', function toBase64() {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < this.length; index += chunkSize) {
      binary += String.fromCharCode(...this.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  });

  define(Uint8Array, 'fromBase64', function fromBase64(value) {
    const binary = atob(String(value));
    const result = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      result[index] = binary.charCodeAt(index);
    }
    return result;
  });
})();
