

export enum UserRole {
  EMPRESARIO = 'Empresário',
  CONTADOR = 'Contador',
  ADVOGADO = 'Advogado',
  GESTOR_FINANCEIRO = 'Gestor Financeiro'
}

export type AuthView = 'login' | 'signup' | 'forgot-password' | 'pricing';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: UserRole;
}

export interface NewsItem {
  title: string;
  summary: string;
  impactLevel: 'Alto' | 'Médio' | 'Baixo';
  date: string;
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface SimulationInput {
  cnae: string; // activity that is the main one
  sector: string; // sector
  regime: 'Simples Nacional' | 'Simples Nacional Híbrido' | 'Lucro Presumido' | 'Lucro Real'; // tax regime
  annualRevenue: number; // current revenue
  annualPayroll: number; // payroll
  annualCosts: number; // purchases made
  creditGenerationPercentage: number; // how much credit they generate vs do not generate
  locationState: string; // federal unit of the headquarters
  
  // Operational Profile
  customerProfile: 'B2B_CREDIT' | 'B2B_NO_CREDIT' | 'B2C'; // who are my main clients / regime of clients
  supplierRegime: 'Simples Nacional' | 'Simples Nacional Híbrido' | 'Lucro Presumido' | 'Lucro Real'; // regime of the suppliers
  supplierSector: 'Indústria' | 'Comércio' | 'Serviços';
}

export interface TransitionYear {
  year: number;
  phase: string;
  currentSystemLoad: number; // PIS/COFINS/ICMS/ISS
  reformSystemLoad: number;  // CBS/IBS
  totalLoad: number;
  description: string;
}

export interface PurchaseAnalysis {
  current: {
    grossValue: number;
    taxesInside: number;
    netValue: number;
    creditTaken: number;
  };
  reform: {
    netValue: number;
    ivaOutside: number;
    newGrossValue: number;
    creditFuture: number;
  };
  creditLossIfSimples: number;
}

export interface SimulationResult {
  currentLoad: {
    total: number;
    percentage: number;
    breakdown: { name: string; value: number }[];
  };
  reformLoad: {
    total: number;
    percentage: number;
    breakdown: { name: string; value: number }[];
  };
  marginAnalysis?: {
    currentMarginPercent: number;
    newMarginPercent: number;
    costImpactDescription: string;
    isB2C: boolean; 
  };
  transitionProjection: TransitionYear[];
  purchaseAnalysis: PurchaseAnalysis;
  creditEfficiency: {
    grossPurchaseValue: number;
    supplierTaxCredit: number;
    netAcquisitionCost: number;
    costWithoutCredit: number; 
    efficiencyGain: number; 
    taxLiabilityOnSale: number; 
    netTaxPayable: number; 
    cashFlowDescription: string; 
  };
  negotiationStrategy: {
    requiredSupplierDiscount: number; 
    requiredPriceIncrease: number; 
    creditLossValue: number; 
    explanation: string;
  };
  analysis: string;
  cashFlowImpact: string;
  strategicAlerts: string[];
  roleSpecificInsights: {
    empresario: string[];
    contador: string[];
    advogado: string[];
    financeiro: string[];
  };
}

export type TaxRegime = 'Simples Nacional' | 'Simples Dual (Híbrido)' | 'Lucro Presumido' | 'Lucro Real';
export type SectorType = 'Indústria' | 'Serviços' | 'Comércio';
export type CustomerType = 
  | 'B2C (Consumidor Final)' 
  | 'B2B (Recupera Crédito)' 
  | 'B2B (Não Recupera Crédito)';

export interface SupplyChainInput {
  // Stage 1: Supplier
  supplierSector: SectorType;
  supplierRegime: TaxRegime;
  // Stage 2: The Company
  companySector: SectorType;
  companyRegime: TaxRegime;
  // Stage 3: Customer
  customerType: CustomerType;
}

export interface RegimeComparison {
  regime: string;
  taxBurden: string;
  creditGenerated: string;
  netResult: string;
  recommendation: string;
}

export interface SupplyChainSimulationRow {
  etapa: string;
  valorVenda: string;
  ibsCbsDebito: string;
  creditoSplit: string;
  impostoLiquido: string;
}

export interface ConceptualSimulationRow {
  etapa: string;
  atual: string;
  reforma: string;
}

export interface SupplyChainResult {
  currentScenario: {
    taxResiduePercent: number;
    recoverableTaxPercent: number;
    description: string;
    inefficiencyAlert: string;
  };
  reformScenario: {
    taxResiduePercent: number;
    recoverableTaxPercent: number;
    description: string;
    creditGain: string;
  };
  impactSummary: {
    buyerCostReductionPercent: number;
    priceCompetitiveness: 'Aumenta' | 'Mantém' | 'Diminui';
    strategicAdvice: string;
  };
  flowAnalysis: {
    step1_supplier_impact: string;
    step2_company_impact: string;
    step3_customer_impact: string;
  };
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  companyRegimeComparisons: RegimeComparison[];
  simulationTable?: SupplyChainSimulationRow[];
  conceptualSimulation?: ConceptualSimulationRow[];
  chainEfficiency?: {
    currentFinalCost: string;
    reformFinalCost: string;
    efficiencyGain: string;
    description: string;
  };
}

export interface AccountantGuideData {
  profileShift: {
    from: string;
    to: string;
    description: string;
  };
  competencies: {
    title: string;
    description: string;
    icon: string;
  }[];
  actionPlan: {
    phase: string;
    actions: string[];
  }[];
  consultancyTips: string[];
}

// --- Supabase Database Definitions ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: string | null
          company_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          company_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          company_name?: string | null
          created_at?: string
        }
      }
      simulations: {
        Row: {
          id: string
          user_id: string
          input_data: Json
          result_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_data: Json
          result_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_data?: Json
          result_data?: Json
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          messages: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          messages: Json
          created_at?: string
        }
      }
      supply_chain_analyses: {
        Row: {
          id: string
          user_id: string
          input_data: Json
          result_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_data: Json
          result_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_data?: Json
          result_data?: Json
          created_at?: string
        }
      }
      legal_interpretations: {
        Row: {
          id: string
          user_id: string
          original_text: string | null
          interpreted_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_text?: string | null
          interpreted_text?: string | null
          created_at?: string
        }
      }
    }
  }
}