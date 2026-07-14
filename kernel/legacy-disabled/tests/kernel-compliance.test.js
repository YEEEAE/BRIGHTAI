import { describe, expect, it } from 'vitest';
import './setup.js';
import { loadKernelScript, mockJsonFetch } from './setup.js';

function loadCompliance() {
  loadKernelScript('kernel/assets/js/kernel-compliance.js');
  return window.KernelCompliance;
}

describe('KernelCompliance', () => {
  it('exports KernelCompliance on window', () => {
    const compliance = loadCompliance();

    expect(window.KernelCompliance).toBe(compliance);
    expect(compliance).toBeTruthy();
  });

  it('loads the built-in compliance packages', () => {
    const compliance = loadCompliance();
    const packages = compliance.getAllPackages();

    expect(packages.map((pkg) => pkg.id)).toEqual(
      expect.arrayContaining(['pdpl', 'gdpr', 'hipaa', 'pci', 'iso27001'])
    );
    expect(compliance.getPackage('pdpl')).toMatchObject({
      name: 'PDPL',
      region: 'المملكة العربية السعودية',
    });
    expect(compliance.shouldAutoBlock('pdpl', 'saudi_id')).toBe(true);
    expect(compliance.getRiskThreshold('unknown')).toBe(40);
  });

  it('calculates package coverage and review counts from state', () => {
    const compliance = loadCompliance();

    expect(compliance.calculateOverallScore()).toBeGreaterThanOrEqual(90);
    expect(compliance.calculateMetRequirements()).toMatchObject({
      total: 22,
      met: expect.any(Number),
    });
    expect(compliance.calculateNeedsReview()).toBeGreaterThanOrEqual(0);
  });

  it('refreshes compliance state from the API', async () => {
    const compliance = loadCompliance();
    mockJsonFetch({
      '/api/kernel/compliance': {
        state: {
          pdpl: {
            score: 88,
            status: 'partial',
            lastAudit: '2026-06-07T00:00:00.000Z',
            requirementScores: {
              consent: 90,
              access: 70,
              breach: 80,
              retention: 75,
              transfer: 85,
            },
          },
        },
      },
    });

    await compliance.refreshComplianceState();

    expect(fetch).toHaveBeenCalledWith('/api/kernel/compliance');
    expect(compliance.getComplianceState('pdpl')).toMatchObject({
      score: 88,
      status: 'partial',
    });
  });
});
