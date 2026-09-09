/**
 * Cross-Browser & Device Compatibility Polyfills and Resiliency Layer
 * Ensures Educate MW runs reliably on all modern and legacy browsers,
 * including older Safari (iOS 12+), older Android Chrome/WebViews,
 * Samsung Internet, UC Browser, Firefox, Opera, and private browsing modes.
 */

// 1. globalThis polyfill for Safari < 12.1, Chrome < 71, Firefox < 65
if (typeof globalThis === 'undefined') {
  (function () {
    if (typeof self !== 'undefined') {
      (self as any).globalThis = self;
    } else if (typeof window !== 'undefined') {
      (window as any).globalThis = window;
    } else if (typeof global !== 'undefined') {
      (global as any).globalThis = global;
    }
  })();
}

// 2. window.global alias for node-style libraries
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

// 3. Resilient LocalStorage & SessionStorage Proxy
// Prevents app crashes in Safari Private Mode or browsers where storage is disabled
(function setupSafeStorage() {
  if (typeof window === 'undefined') return;

  function createMemoryStorage(): Storage {
    const memory = new Map<string, string>();
    return {
      getItem(key: string): string | null {
        return memory.has(String(key)) ? memory.get(String(key))! : null;
      },
      setItem(key: string, value: string): void {
        memory.set(String(key), String(value));
      },
      removeItem(key: string): void {
        memory.delete(String(key));
      },
      clear(): void {
        memory.clear();
      },
      get length(): number {
        return memory.size;
      },
      key(index: number): string | null {
        const keys = Array.from(memory.keys());
        return keys[index] ?? null;
      },
    };
  }

  // Test and patch localStorage
  try {
    const testKey = '__emw_compat_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    console.warn('[Compat] localStorage is unavailable or restricted in this browser. Using in-memory fallback.');
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
    } catch {
      // If defineProperty is blocked, fallback silently
    }
  }

  // Test and patch sessionStorage
  try {
    const testKey = '__emw_compat_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
  } catch {
    console.warn('[Compat] sessionStorage is unavailable or restricted in this browser. Using in-memory fallback.');
    try {
      Object.defineProperty(window, 'sessionStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
    } catch {
      // If defineProperty is blocked, fallback silently
    }
  }
})();

// 4. crypto.randomUUID polyfill for Safari < 15.4, older Android WebViews, and non-HTTPS contexts
(function setupCryptoRandomUUID() {
  if (typeof window === 'undefined') return;

  if (!window.crypto) {
    (window as any).crypto = {};
  }

  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function (): `${string}-${string}-${string}-${string}-${string}` {
      try {
        if (typeof window.crypto.getRandomValues === 'function') {
          return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
            (
              c ^
              (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
            ).toString(16)
          ) as `${string}-${string}-${string}-${string}-${string}`;
        }
      } catch {
        // Fall through to Math.random
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
})();

// 5. navigator.clipboard.writeText polyfill using execCommand fallback
(function setupClipboardFallback() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  if (!navigator.clipboard) {
    (navigator as any).clipboard = {};
  }

  const originalWriteText = navigator.clipboard.writeText;
  navigator.clipboard.writeText = async function (text: string): Promise<void> {
    if (originalWriteText && typeof originalWriteText === 'function') {
      try {
        await originalWriteText.call(navigator.clipboard, text);
        return;
      } catch {
        // If native clipboard fails (e.g. permission denied or non-HTTPS), try fallback
      }
    }

    // Classic execCommand fallback
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (!successful) {
        throw new Error('execCommand copy was unsuccessful');
      }
    } catch (err) {
      console.warn('[Compat] Clipboard copy fallback failed:', err);
    }
  };
})();

// 6. requestIdleCallback polyfill for Safari < 16.4 and older mobile browsers
(function setupRequestIdleCallback() {
  if (typeof window === 'undefined') return;

  if (!window.requestIdleCallback) {
    (window as any).requestIdleCallback = function (cb: (deadline: any) => void) {
      const start = Date.now();
      return setTimeout(() => {
        cb({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
  }

  if (!window.cancelIdleCallback) {
    (window as any).cancelIdleCallback = function (id: number) {
      clearTimeout(id);
    };
  }
})();

// 7. Array.prototype.flat and flatMap polyfills for older Safari / Android WebViews
if (!Array.prototype.flat) {
  Array.prototype.flat = function (this: any, depth = 1): any[] {
    const flatRecursively = (arr: any[], currentDepth: number): any[] => {
      return arr.reduce((acc, val) => {
        if (Array.isArray(val) && currentDepth > 0) {
          acc.push(...flatRecursively(val, currentDepth - 1));
        } else {
          acc.push(val);
        }
        return acc;
      }, []);
    };
    return flatRecursively(Array.from(this as any), depth);
  };
}

if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function (this: any, callback: any, thisArg: any): any[] {
    return (this as any[]).map(callback, thisArg).flat();
  };
}


// 8. Object.fromEntries polyfill
if (!Object.fromEntries) {
  Object.fromEntries = function (entries: Iterable<readonly [any, any]>): any {
    const obj: Record<string, any> = {};
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    return obj;
  };
}

// 9. String.prototype.replaceAll polyfill
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (searchValue: any, replaceValue: any): string {
    if (Object.prototype.toString.call(searchValue).toLowerCase() === '[object regexp]') {
      return this.replace(searchValue, replaceValue);
    }
    return this.replace(
      new RegExp(String(searchValue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      replaceValue
    );
  };
}

// 10. Promise.allSettled polyfill
if (!Promise.allSettled) {
  Promise.allSettled = function <T>(
    promises: Iterable<T | PromiseLike<T>>
  ): Promise<PromiseSettledResult<Awaited<T>>[]> {
    return Promise.all(
      Array.from(promises).map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: 'fulfilled', value } as PromiseFulfilledResult<Awaited<T>>),
          (reason) => ({ status: 'rejected', reason } as PromiseRejectedResult)
        )
      )
    );
  };
}

// 11. structuredClone polyfill using JSON fallback
if (typeof window !== 'undefined' && typeof window.structuredClone === 'undefined') {
  (window as any).structuredClone = function <T>(obj: T): T {
    if (obj === undefined) return undefined as any;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  };
}

// 12. AbortController and AbortSignal polyfill for Chrome < 66 / Android 6.0.1
if (typeof window !== 'undefined' && typeof (window as any).AbortController === 'undefined') {
  class MockAbortSignal {
    aborted = false;
    onabort: ((this: any, ev: any) => any) | null = null;
    private listeners = new Map<string, Array<any>>();

    addEventListener(type: string, listener: any) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, []);
      }
      this.listeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: any) {
      if (this.listeners.has(type)) {
        const arr = this.listeners.get(type)!;
        const idx = arr.indexOf(listener);
        if (idx !== -1) arr.splice(idx, 1);
      }
    }

    dispatchEvent(event: any) {
      if (this.onabort) this.onabort.call(this, event);
      const arr = this.listeners.get('abort') || [];
      for (const listener of arr) {
        if (typeof listener === 'function') listener.call(this, event);
        else if (listener && typeof listener.handleEvent === 'function') listener.handleEvent(event);
      }
      return true;
    }
  }

  class MockAbortController {
    signal = new MockAbortSignal();
    abort() {
      this.signal.aborted = true;
      this.signal.dispatchEvent({ type: 'abort', target: this.signal });
    }
  }

  (window as any).AbortController = MockAbortController;
  (window as any).AbortSignal = MockAbortSignal;
}

// 13. matchMedia compatibility fallback for Android 6.0.1
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    (window as any).matchMedia = function () {
      return {
        matches: false,
        media: '',
        onchange: null,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () { return false; },
      };
    };
  } else {
    try {
      const mql = window.matchMedia('(min-width: 0px)') as any;
      if (mql && !mql.addEventListener && mql.addListener) {
        const proto = Object.getPrototypeOf(mql) || mql;
        proto.addEventListener = function (type: string, fn: any) {
          if (this.addListener) this.addListener(fn);
        };
        proto.removeEventListener = function (type: string, fn: any) {
          if (this.removeListener) this.removeListener(fn);
        };
      }
    } catch {
      // Safe ignore
    }
  }
}

// 14. IntersectionObserver and ResizeObserver safe stubs for older Android
if (typeof window !== 'undefined') {
  if (!(window as any).IntersectionObserver) {
    (window as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

// 15. Global resilience: Prevent uncaught unhandledrejection crashes
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Gracefully absorb benign background connection or offline failures
    if (
      event.reason?.name === 'AbortError' ||
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('NetworkError') ||
      event.reason?.message?.includes('network')
    ) {
      // Prevent console red banner on flaky connections
      event.preventDefault();
      console.warn('[Resilience] Network operation interrupted or offline handled gracefully.');
    }
  });
}

export const isBrowserCompatible = true;

