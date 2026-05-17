import type { ComplianceFramework, ControlMapping } from './types.js';
import { controlMappingSchema } from './types.js';

/**
 * Predefined SOC 2 control mappings for VitaOS components.
 * Maps Vita packages/features to relevant compliance controls.
 */
const SOC2_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  {
    framework: 'soc2',
    controlId: 'CC1.1',
    title: 'COSO Principle 1: Integrity and Ethical Values',
    description: 'The entity demonstrates a commitment to integrity and ethical values.',
    vitaComponent: '@vita/auth',
  },
  {
    framework: 'soc2',
    controlId: 'CC6.1',
    title: 'Logical and Physical Access Controls',
    description: 'The entity implements logical access security measures to protect against unauthorized access.',
    vitaComponent: '@vita/auth',
  },
  {
    framework: 'soc2',
    controlId: 'CC6.3',
    title: 'Access Authorization',
    description: 'Access is authorized based on roles and least privilege.',
    vitaComponent: '@vita/policy',
  },
  {
    framework: 'soc2',
    controlId: 'CC7.1',
    title: 'Change Management',
    description: 'The entity uses change management processes for system changes.',
    vitaComponent: '@vita/core',
  },
  {
    framework: 'soc2',
    controlId: 'CC8.1',
    title: 'Risk Assessment',
    description: 'The entity identifies risks that threaten the achievement of system objectives.',
    vitaComponent: '@vita/security',
  },
  {
    framework: 'soc2',
    controlId: 'PII.1',
    title: 'PII Identification and Classification',
    description: 'PII is identified and classified to apply appropriate controls.',
    vitaComponent: '@vita/anonymization',
  },
  {
    framework: 'soc2',
    controlId: 'PII.3',
    title: 'Data Minimization',
    description: 'Only PII necessary for the specified purpose is collected and retained.',
    vitaComponent: '@vita/anonymization',
  },
  {
    framework: 'soc2',
    controlId: 'C1.1',
    title: 'Confidential Information Identification',
    description: 'Confidential information is identified and maintained.',
    vitaComponent: '@vita/key-custody',
  },
];

const GDPR_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  {
    framework: 'gdpr',
    controlId: 'Art.5.1(c)',
    title: 'Data Minimisation',
    description: 'Personal data shall be adequate, relevant and limited to what is necessary.',
    vitaComponent: '@vita/anonymization',
  },
  {
    framework: 'gdpr',
    controlId: 'Art.5.1(e)',
    title: 'Storage Limitation',
    description: 'Data kept no longer than necessary for purposes.',
    vitaComponent: '@vita/policy',
  },
  {
    framework: 'gdpr',
    controlId: 'Art.5.1(f)',
    title: 'Integrity and Confidentiality',
    description: 'Appropriate security of personal data.',
    vitaComponent: '@vita/key-custody',
  },
  {
    framework: 'gdpr',
    controlId: 'Art.15-22',
    title: 'Data Subject Rights',
    description: 'Rights of access, rectification, erasure, restriction, portability, objection.',
    vitaComponent: '@vita/security',
  },
  {
    framework: 'gdpr',
    controlId: 'Art.25',
    title: 'Data Protection by Design and by Default',
    description: 'Implement appropriate technical and organisational measures.',
    vitaComponent: '@vita/anonymization',
  },
  {
    framework: 'gdpr',
    controlId: 'Art.32',
    title: 'Security of Processing',
    description: 'Appropriate technical and organisational measures to ensure a level of security.',
    vitaComponent: '@vita/key-custody',
  },
];

const HIPAA_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  {
    framework: 'hipaa',
    controlId: '164.312(a)(1)',
    title: 'Access Control',
    description: 'Implement technical policies and procedures for electronic information systems.',
    vitaComponent: '@vita/auth',
  },
  {
    framework: 'hipaa',
    controlId: '164.312(a)(2)(iv)',
    title: 'Encryption and Decryption',
    description: 'Implement a mechanism to encrypt and decrypt electronic protected health information.',
    vitaComponent: '@vita/key-custody',
  },
  {
    framework: 'hipaa',
    controlId: '164.312(c)(1)',
    title: 'Integrity',
    description: 'Implement policies and procedures to protect ePHI from improper alteration or destruction.',
    vitaComponent: '@vita/key-custody',
  },
  {
    framework: 'hipaa',
    controlId: '164.514(a)',
    title: 'De-identification Standard',
    description: 'Health information is not individually identifiable (Safe Harbor method — 18 identifiers).',
    vitaComponent: '@vita/anonymization',
  },
];

const CCPA_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  {
    framework: 'ccpa',
    controlId: '1798.100',
    title: 'Right to Know',
    description: 'Consumer right to request disclosure of personal information collected.',
    vitaComponent: '@vita/security',
  },
  {
    framework: 'ccpa',
    controlId: '1798.105',
    title: 'Right to Delete',
    description: 'Consumer right to request deletion of personal information.',
    vitaComponent: '@vita/security',
  },
  {
    framework: 'ccpa',
    controlId: '1798.110',
    title: 'Right to Opt-Out',
    description: 'Consumer right to opt-out of sale of personal information.',
    vitaComponent: '@vita/anonymization',
  },
];

const ISO27001_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  {
    framework: 'iso27001',
    controlId: 'A.8.3',
    title: 'Information Access Restriction',
    description: 'Access to information and application system functions shall be restricted.',
    vitaComponent: '@vita/policy',
  },
  {
    framework: 'iso27001',
    controlId: 'A.10.1',
    title: 'Cryptographic Controls',
    description: 'Policy on the use of cryptographic controls for protection of information.',
    vitaComponent: '@vita/key-custody',
  },
  {
    framework: 'iso27001',
    controlId: 'A.14.2',
    title: 'Security in Development',
    description: 'Information security shall be designed and implemented within the development lifecycle.',
    vitaComponent: '@vita/security',
  },
];

/**
 * All control mappings across frameworks.
 */
const ALL_CONTROLS: Omit<ControlMapping, 'implementationStatus'>[] = [
  ...SOC2_CONTROLS,
  ...GDPR_CONTROLS,
  ...HIPAA_CONTROLS,
  ...CCPA_CONTROLS,
  ...ISO27001_CONTROLS,
];

/**
 * ComplianceMapper provides SOC 2 and other compliance control references.
 * Maps framework controls to VitaOS components.
 */
export class ComplianceMapper {
  private controls: ControlMapping[];

  constructor(overrides: Partial<ControlMapping>[] = []) {
    this.controls = ALL_CONTROLS.map((c) => {
      const override = overrides.find(
        (o) => o.framework === c.framework && o.controlId === c.controlId,
      );
      return controlMappingSchema.parse({
        ...c,
        implementationStatus: 'implemented',
        ...override,
      });
    });
  }

  /**
   * Get all controls for a framework.
   */
  getByFramework(framework: ComplianceFramework): ControlMapping[] {
    return this.controls.filter((c) => c.framework === framework);
  }

  /**
   * Get all controls mapped to a specific Vita component.
   */
  getByComponent(vitaComponent: string): ControlMapping[] {
    return this.controls.filter(
      (c) =>
        c.vitaComponent === vitaComponent ||
        c.vitaComponent.startsWith(`${vitaComponent}/`),
    );
  }

  /**
   * Get all mapped controls.
   */
  getAll(): ControlMapping[] {
    return [...this.controls];
  }

  /**
   * Get summary counts per framework.
   */
  getSummary(): Record<ComplianceFramework, { total: number; implemented: number }> {
    const frameworks: ComplianceFramework[] = [
      'soc2',
      'gdpr',
      'ccpa',
      'hipaa',
      'iso27001',
    ];

    const summary = {} as Record<
      ComplianceFramework,
      { total: number; implemented: number }
    >;

    for (const fw of frameworks) {
      const controls = this.getByFramework(fw);
      summary[fw] = {
        total: controls.length,
        implemented: controls.filter(
          (c) => c.implementationStatus === 'implemented',
        ).length,
      };
    }

    return summary;
  }
}
