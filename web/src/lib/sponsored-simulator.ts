import { 
  SponsoredTransactionData, 
  SponsoredSimulationResult,
  TransactionData 
} from '@/types/aptos';
import { transactionSimulator } from './simulator';
import { aptosClient } from './aptos-client';

export class SponsoredTransactionSimulator {
  async simulateSponsored(sponsoredData: SponsoredTransactionData): Promise<SponsoredSimulationResult> {
    const startTime = performance.now();
    
    try {
      const { transaction, sponsorAddress } = sponsoredData;
      
      // First, simulate the original transaction
      const originalResult = await transactionSimulator.simulateTransaction(transaction);
      
      // Check sponsor account balance
      const sponsorBalance = await this.getSponsorBalance(sponsorAddress);
      
      // Calculate costs
      const transactionCost = originalResult.totalGasCost;
      const senderSavings = transactionCost; // Sender saves full cost
      const sponsorCost = transactionCost; // Sponsor pays full cost
      
      // Verify sponsor can afford the transaction
      const canSponsor = sponsorBalance >= sponsorCost;
      
      if (!canSponsor) {
        return this.createInsufficientSponsorResult(
          originalResult,
          sponsorBalance,
          sponsorCost,
          senderSavings,
          performance.now() - startTime
        );
      }
      
      // Create sponsored simulation result
      const executionTime = performance.now() - startTime;
      
      return {
        ...originalResult,
        vmStatus: originalResult.success 
          ? `Sponsored transaction successful - Sponsor pays ${(sponsorCost / 100000000).toFixed(6)} APT`
          : originalResult.vmStatus,
        executionTime,
        sponsorCost,
        senderSavings,
        sponsorBalance,
        costComparison: {
          withSponsorship: 0, // Sender pays nothing
          withoutSponsorship: transactionCost,
        },
      };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return this.createErrorResult(error, executionTime);
    }
  }

  private async getSponsorBalance(sponsorAddress: string): Promise<number> {
    try {
      return await aptosClient.getAccountBalance(sponsorAddress);
    } catch (error) {
      console.warn('Failed to get sponsor balance:', error);
      return 0;
    }
  }

  private createInsufficientSponsorResult(
    originalResult: any,
    sponsorBalance: number,
    requiredCost: number,
    senderSavings: number,
    executionTime: number
  ): SponsoredSimulationResult {
    return {
      ...originalResult,
      success: false,
      vmStatus: `Sponsor has insufficient balance. Required: ${(requiredCost / 100000000).toFixed(6)} APT, Available: ${(sponsorBalance / 100000000).toFixed(6)} APT`,
      executionTime,
      sponsorCost: requiredCost,
      senderSavings,
      sponsorBalance,
      costComparison: {
        withSponsorship: 0,
        withoutSponsorship: requiredCost,
      },
      error: {
        code: 'INSUFFICIENT_SPONSOR_BALANCE',
        message: 'Sponsor does not have sufficient balance to cover transaction fees',
        suggestion: 'Choose a different sponsor or add funds to the sponsor account',
      },
    };
  }

  private createErrorResult(error: unknown, executionTime: number): SponsoredSimulationResult {
    const errorMessage = error instanceof Error ? error.message : 'Sponsored simulation failed';
    
    return {
      success: false,
      gasUsed: 0,
      gasUnitPrice: 100,
      totalGasCost: 0,
      totalGasCostAPT: 0,
      vmStatus: errorMessage,
      executionTime,
      sponsorCost: 0,
      senderSavings: 0,
      sponsorBalance: 0,
      costComparison: {
        withSponsorship: 0,
        withoutSponsorship: 0,
      },
      error: {
        code: 'SPONSORED_SIMULATION_ERROR',
        message: errorMessage,
        suggestion: 'Please check sponsor address and transaction parameters',
      },
    };
  }

  async validateSponsor(sponsorAddress: string, estimatedCost: number): Promise<{
    valid: boolean;
    balance: number;
    canAfford: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let balance = 0;
    
    try {
      // Validate address format
      if (!sponsorAddress || sponsorAddress.length < 3) {
        errors.push('Invalid sponsor address format');
      }
      
      // Get balance
      balance = await this.getSponsorBalance(sponsorAddress);
      const canAfford = balance >= estimatedCost;
      
      if (!canAfford) {
        errors.push(`Sponsor balance insufficient. Required: ${(estimatedCost / 100000000).toFixed(6)} APT`);
      }
      
      // Check if account exists
      try {
        await aptosClient.getAccountInfo(sponsorAddress);
      } catch (accountError) {
        errors.push('Sponsor account does not exist or is inaccessible');
      }
      
      return {
        valid: errors.length === 0,
        balance,
        canAfford,
        errors,
      };
      
    } catch (error) {
      errors.push('Failed to validate sponsor account');
      return {
        valid: false,
        balance,
        canAfford: false,
        errors,
      };
    }
  }
}

export const sponsoredTransactionSimulator = new SponsoredTransactionSimulator();