
export const KeyManager = {
  getAPIKeys: (): string[] => {
    const raw = process.env.API_KEY || "";
    return raw.includes(',') 
      ? raw.split(',').map(k => k.trim()).filter(k => k.length > 0)
      : [raw];
  },

  currentIndex: 0,

  getCurrentKey: function(): string {
    const keys = this.getAPIKeys();
    if (keys.length === 0) return "";
    // Ensure index is safe
    if (this.currentIndex >= keys.length) {
      this.currentIndex = 0;
    }
    return keys[this.currentIndex];
  },

  rotateKey: function(): void {
    const keys = this.getAPIKeys();
    if (keys.length <= 1) return;
    
    const prev = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % keys.length;
    console.warn(`[KeyManager] Rotating API Key: #${prev + 1} -> #${this.currentIndex + 1}`);
  },

  hasMultipleKeys: function(): boolean {
    return this.getAPIKeys().length > 1;
  }
};
