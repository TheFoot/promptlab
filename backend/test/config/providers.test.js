import { describe, it } from 'node:test';
import assert from 'node:assert';
import providers from '../../src/config/providers.js';

describe('Providers Configuration', () => {
  it('should define available providers', () => {
    assert.ok(Array.isArray(providers.available));
    assert.ok(providers.available.includes('openai'));
    assert.ok(providers.available.includes('anthropic'));
  });

  it('should define a default provider', () => {
    assert.ok(providers.default);
    assert.ok(providers.available.includes(providers.default));
  });

  it('should have UI display names for each provider', () => {
    assert.ok(providers.ui);
    assert.ok(providers.ui.displayNames);

    // Check display names for all available providers
    providers.available.forEach((provider) => {
      assert.ok(
          providers.ui.displayNames[provider],
          `Display name missing for provider: ${provider}`,
      );
    });
  });
});
