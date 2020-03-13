import {
  createIntegration
} from '../src/index.js';

describe('createIntegration()', () => {
  it('should throw an error if no params are passed', () => {
    expect(() => { createIntegration(); }).toThrow();
  });
  
  it('should throw an error if the createContext param is not passed', () => {
    const Component = {}
    expect(() => {
      createIntegration({
        Component
      });
    }).toThrow();
  });

  it('should throw an error if the createContext param is not a function', () => {
    const Component = {};
    const createContext = {};
    expect(() => {
      createIntegration({
        Component, 
        createContext
      });
    }).toThrow();
  });

    it('should throw an error if the createContext function returns undefined', () => {
      const Component = {};
      const createContext = () => {};
      expect(() => {
        createIntegration({
          Component,
          createContext
        });
      }).toThrow();
    });
  
  it('should return an object with the useStore, Provider, connect properties', () => {
    const Component = {};
    const createContext = () => ({});
    
    const integration = createIntegration({
      Component,
      createContext
    });

    expect(integration).toHaveProperty("useStore");
    expect(integration).toHaveProperty("Provider");
    expect(integration).toHaveProperty("connect");
  });
});
