// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Request/Response/Headers in test environment (for API route tests)
// These are available in jsdom but may need explicit globals
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this._body = init.body
    }
    async json() {
      return JSON.parse(this._body)
    }
    async text() {
      return this._body
    }
  }
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this._body = body
      this.status = init.status || 200
      this.statusText = init.statusText || ''
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
    static json(data, init = {}) {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers }
      })
      response._jsonData = data
      response.json = async () => data
      return response
    }
    static redirect(url, status = 302) {
      return new Response(null, { status, headers: { Location: url } })
    }
  }
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {}
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value
        })
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }
    has(name) {
      return name.toLowerCase() in this._headers
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// MSW setup is optional - tests can run with or without it
// Individual test files can import and setup MSW as needed

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: validateDOMNesting'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
