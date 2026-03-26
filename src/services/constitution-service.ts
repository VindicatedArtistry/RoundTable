import { ConstitutionFoundationService } from './constitution-foundation';

/**
 * Constitution Service Wrapper
 * Provides a simplified interface for constitutional compliance checking
 */
export class ConstitutionService {
  private foundationService: ConstitutionFoundationService;

  constructor() {
    this.foundationService = new ConstitutionFoundationService();
  }

  async checkCompliance(
    action: string,
    context: Record<string, any>
  ): Promise<{
    aligned: boolean;
    violations: string[];
    guidance: string[];
    enforcementLevel: string;
  }> {
    const result = await this.foundationService.checkConstitutionalCompliance(action, context);
    return { ...result, aligned: result.compliant };
  }

  async checkConstitutionalCompliance(
    action: string,
    context: Record<string, any>
  ): Promise<{
    aligned: boolean;
    violations: string[];
    guidance: string[];
    enforcementLevel: string;
  }> {
    const result = await this.foundationService.checkConstitutionalCompliance(action, context);
    return { ...result, aligned: result.compliant };
  }
}