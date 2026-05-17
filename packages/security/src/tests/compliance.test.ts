import { describe, expect, it } from 'vitest';
import { ComplianceMapper } from '../compliance.js';

describe('ComplianceMapper', () => {
  it('returns SOC 2 controls', () => {
    const mapper = new ComplianceMapper();
    const controls = mapper.getByFramework('soc2');
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every((c) => c.framework === 'soc2')).toBe(true);
  });

  it('returns GDPR controls', () => {
    const mapper = new ComplianceMapper();
    const controls = mapper.getByFramework('gdpr');
    expect(controls.length).toBeGreaterThan(0);
  });

  it('returns HIPAA controls', () => {
    const mapper = new ComplianceMapper();
    const controls = mapper.getByFramework('hipaa');
    expect(controls.length).toBeGreaterThan(0);
  });

  it('returns CCPA controls', () => {
    const mapper = new ComplianceMapper();
    const controls = mapper.getByFramework('ccpa');
    expect(controls.length).toBeGreaterThan(0);
  });

  it('returns ISO 27001 controls', () => {
    const mapper = new ComplianceMapper();
    const controls = mapper.getByFramework('iso27001');
    expect(controls.length).toBeGreaterThan(0);
  });

  it('filters by Vita component', () => {
    const mapper = new ComplianceMapper();
    const anonymizationControls = mapper.getByComponent('@vita/anonymization');
    expect(anonymizationControls.length).toBeGreaterThan(0);
    expect(
      anonymizationControls.every((c) =>
        c.vitaComponent.startsWith('@vita/anonymization'),
      ),
    ).toBe(true);
  });

  it('getAll returns all controls', () => {
    const mapper = new ComplianceMapper();
    const all = mapper.getAll();
    // At least 20 controls across all frameworks
    expect(all.length).toBeGreaterThanOrEqual(20);
  });

  it('getSummary returns per-framework counts', () => {
    const mapper = new ComplianceMapper();
    const summary = mapper.getSummary();

    expect(summary.soc2.total).toBeGreaterThan(0);
    expect(summary.gdpr.total).toBeGreaterThan(0);
    expect(summary.hipaa.total).toBeGreaterThan(0);
    expect(summary.ccpa.total).toBeGreaterThan(0);
    expect(summary.iso27001.total).toBeGreaterThan(0);

    // All should be marked as implemented by default
    expect(summary.soc2.implemented).toBe(summary.soc2.total);
    expect(summary.gdpr.implemented).toBe(summary.gdpr.total);
  });

  it('allows overriding implementation status', () => {
    const mapper = new ComplianceMapper([
      {
        framework: 'soc2',
        controlId: 'CC1.1',
        implementationStatus: 'partial',
        title: '',
        description: '',
        vitaComponent: '',
      },
    ]);

    const soc2Controls = mapper.getByFramework('soc2');
    const cc1 = soc2Controls.find((c) => c.controlId === 'CC1.1');
    expect(cc1).toBeDefined();
    expect(cc1!.implementationStatus).toBe('partial');

    // Other controls should still be implemented
    const cc6 = soc2Controls.find((c) => c.controlId === 'CC6.1');
    expect(cc6!.implementationStatus).toBe('implemented');
  });
});
