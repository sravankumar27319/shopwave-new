import type { PaymentProvider } from "../payment.interface.js";
import { MockPaymentProvider, mockPaymentProvider } from "./mock.provider.js";

class PaymentProviderRegistry {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.register("mock", mockPaymentProvider);
    this.register("test", mockPaymentProvider);
  }

  public register(name: string, provider: PaymentProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  public getProvider(name?: string): PaymentProvider {
    const providerName = (name || process.env["PAYMENT_PROVIDER"] || "mock").toLowerCase();
    const provider = this.providers.get(providerName);
    if (!provider) {
      // Fallback to mock provider with warning
      return mockPaymentProvider;
    }
    return provider;
  }
}

export const providerRegistry = new PaymentProviderRegistry();

export function getPaymentProvider(name?: string): PaymentProvider {
  return providerRegistry.getProvider(name);
}

export { MockPaymentProvider };
