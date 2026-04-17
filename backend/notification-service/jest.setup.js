// Increase timeout for async notification dispatching
jest.setTimeout(15000);

// Silence console.log during tests (keep errors visible)
global.console.log = jest.fn();
