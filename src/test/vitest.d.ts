/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// Extend Vitest's expect with jest-dom matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = unknown> extends jest.Matchers<void, T> {}
  }
}

export {}
