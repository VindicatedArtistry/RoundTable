// Suppress custom element re-registration errors in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalCustomElementDefine = window.customElements.define;
  
  window.customElements.define = function(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    if (window.customElements.get(name)) {
      console.warn(`Custom element ${name} already defined, skipping re-registration`);
      return;
    }
    
    try {
      originalCustomElementDefine.call(this, name, constructor, options);
    } catch (error) {
      console.warn(`Failed to define custom element ${name}:`, error);
    }
  };
}

export {};