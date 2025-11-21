function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockTxHash(): string {
  return '0x' + Math.random().toString(16).slice(2).padEnd(64, '0');
}

export interface Quote {
  dex: 'Raydium' | 'Meteora';
  price: number;
  fee: number;
}

export interface ExecuteResult {
  txHash: string;
  executedPrice: number;
}

export class MockDexRouter {
  private basePrice = 1; 

  async getRaydiumQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<Quote> {
    await sleep(200);

    const variance = 0.98 + Math.random() * 0.04;
    const price = this.basePrice * variance;

    return {
      dex: 'Raydium',
      price,
      fee: 0.003
    };
  }

  async getMeteoraQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<Quote> {
    await sleep(200);

    const variance = 0.97 + Math.random() * 0.05;
    const price = this.basePrice * variance;

    return {
      dex: 'Meteora',
      price,
      fee: 0.002
    };
  }

  async executeSwap(dex: string): Promise<ExecuteResult> {
    await sleep(2000 + Math.random() * 1000);

    const finalPrice =
      this.basePrice * (0.99 + Math.random() * 0.02);

    return {
      txHash: generateMockTxHash(),
      executedPrice: finalPrice
    };
  }
}
