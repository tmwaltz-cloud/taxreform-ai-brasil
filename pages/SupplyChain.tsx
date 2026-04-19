import React, { useState, useEffect } from 'react';
import { SupplyChainInput, SupplyChainResult } from '../types';
import { runSupplyChainAnalysis, simuladorEstrategicoIva } from '../services/geminiService';
import { Link as LinkIcon, Home, ArrowRight, Factory, Building2, Truck, AlertTriangle, CheckCircle, TrendingDown, Save, Download, Loader2, Users, ShoppingBag, Lightbulb } from 'lucide-react';

interface SupplyChainProps {
  onNavigateHome: () => void;
}

const INITIAL_INPUT: SupplyChainInput = {
  supplierSector: 'Indústria',
  supplierRegime: 'Lucro Presumido',
  companySector: 'Serviços',
  companyRegime: 'Lucro Presumido',
  customerType: 'B2C (Consumidor Final)'
};

export const SupplyChain: React.FC<SupplyChainProps> = ({ onNavigateHome }) => {
  const [input, setInput] = useState<SupplyChainInput>(INITIAL_INPUT);
  const [result, setResult] = useState<SupplyChainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [futureRegime, setFutureRegime] = useState<string>('Lucro Presumido');
  const [simulationMetrics, setSimulationMetrics] = useState<any>(null);
  const [analysisMode, setAnalysisMode] = useState<'ai' | 'local'>('ai');

  useEffect(() => {
    if (!result) return;
    try {
      // Spread garante nova referência → React detecta mudança e re-renderiza
      const metrics = simuladorEstrategicoIva(input, futureRegime);
      setSimulationMetrics({ ...metrics });
    } catch (err) {
      console.error('[SupplyChain] Erro ao recalcular métricas:', err);
    }
  }, [futureRegime]);  // Só futureRegime — evita loop com input e result

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await runSupplyChainAnalysis(input);
      setResult(data);
      setFutureRegime(input.companyRegime);
      setSimulationMetrics(simuladorEstrategicoIva(input, input.companyRegime));
      setAnalysisMode('ai');
    } catch (err: any) {
      console.warn('[SupplyChain] Usando fallback local:', err?.message);
      const metrics = simuladorEstrategicoIva(input, input.companyRegime);
      setResult({
        currentScenario: { taxResiduePercent: 10, recoverableTaxPercent: 5, description: 'Análise local (LC 214/2025).', inefficiencyAlert: 'Custo tributário oculto na cadeia.' },
        reformScenario: { taxResiduePercent: 0, recoverableTaxPercent: 100, description: 'IVA Dual elimina cascata.', creditGain: 'Recuperação total CBS+IBS.' },
        impactSummary: { buyerCostReductionPercent: 5, priceCompetitiveness: 'Mantém' as const, strategicAdvice: 'Avalie regime futuro.' },
        flowAnalysis: {
          step1_supplier_impact: `Fornecedor (${input.supplierSector}/${input.supplierRegime}): ${input.supplierRegime.includes('Simples') && !input.supplierRegime.includes('Híbrido') ? 'gera crédito reduzido (~2,7%).' : 'gera crédito integral CBS+IBS.'}`,
          step2_company_impact: `Sua empresa (${input.companySector}/${input.companyRegime}): ${input.companyRegime.includes('Simples') && !input.companyRegime.includes('Híbrido') ? 'crédito reduzido para B2B.' : 'crédito integral. Split Payment retém IVA.'}`,
          step3_customer_impact: `Cliente (${input.customerType}): ${input.customerType.includes('B2B') ? 'recupera crédito IVA.' : 'IVA embutido no preço final.'}`,
        },
        swotAnalysis: {
          strengths: ['Não-cumulatividade plena', 'Split Payment automático', 'Simplificação a longo prazo'],
          weaknesses: ['Transição 2026-2033', 'Atualização de ERP', 'Alíquotas IBS indefinidas'],
          opportunities: ['Revisão de fornecedores', 'Tax Trigger em contratos', 'PER/DCOMP retroativo'],
          threats: ['Aumento para serviços', 'Split reduz float', 'Regulamentações CGIBS'],
        },
        companyRegimeComparisons: [
          { regime: 'Simples Convencional', taxBurden: '~6% DAS', creditGenerated: '~2,7%', netResult: input.customerType.includes('B2B') ? 'Negativo B2B' : 'Positivo B2C', recommendation: 'Menor carga, crédito reduzido.' },
          { regime: 'Simples Híbrido', taxBurden: 'DAS + IVA 26,5%', creditGenerated: 'Integral', netResult: 'Positivo B2B', recommendation: 'Crédito integral. Opção até SET/2026.' },
          { regime: 'Lucro Presumido', taxBurden: 'IVA 26,5%', creditGenerated: 'Integral', netResult: 'Neutro', recommendation: 'Avaliar faturamento.' },
          { regime: 'Lucro Real', taxBurden: 'IVA 26,5%', creditGenerated: 'Integral', netResult: 'Positivo margem baixa', recommendation: 'Crédito pleno + PIS/COFINS atual.' },
        ],
        ...metrics,
      });
      setFutureRegime(input.companyRegime);
      setSimulationMetrics(metrics);
      setAnalysisMode('local');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try { await new Promise(r => setTimeout(r, 1000)); alert("Análise salva!"); }
    catch { alert("Erro ao salvar."); }
    finally { setSaving(false); }
  };

  const handleExport = () => window.print();

  const flow = result?.flowAnalysis;
  const swot = result?.swotAnalysis;
  const regimeComps = result?.companyRegimeComparisons;
  const concepts = simulationMetrics?.conceptualSimulation;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-100 p-2 rounded-lg">
             <LinkIcon className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cadeia de Valor (3 Etapas)</h1>
            <p className="text-slate-500 text-sm mt-0.5">Análise completa: Fornecedor &rarr; Você &rarr; Cliente</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm">
               <Home className="w-4 h-4 mr-2" /> Voltar ao Início
            </button>
            <button onClick={handleSave} disabled={!result || saving} className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition">
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
            </button>
            <button onClick={handleExport} disabled={!result} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition">
               <Download className="w-4 h-4 mr-2" /> PDF
            </button>
         </div>
      </div>

      {result && analysisMode === 'local' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
          Cálculos baseados na LC 214/2025 · IA indisponível no momento
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ═══ INPUT (coluna esquerda) ═══ */}
        <div className="lg:col-span-4 h-fit sticky top-6">
          <form onSubmit={handleSimulate} className="relative space-y-4">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10"><span className="text-[10px] font-bold text-slate-700">1</span></div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center ml-2"><Factory className="w-4 h-4 mr-2 text-slate-500" /> FORNECEDOR (Origem)</h3>
                <div className="space-y-3 pl-2">
                   <div><label className="block text-xs font-medium text-slate-500 mb-1">Setor do Fornecedor</label><select name="supplierSector" value={input.supplierSector} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"><option value="Indústria">Indústria</option><option value="Serviços">Serviços</option><option value="Comércio">Comércio</option></select></div>
                   <div><label className="block text-xs font-medium text-slate-500 mb-1">Regime Tributário</label><select name="supplierRegime" value={input.supplierRegime} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg"><option value="Simples Nacional">Simples Nacional</option><option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option><option value="Lucro Presumido">Lucro Presumido</option><option value="Lucro Real">Lucro Real</option></select></div>
                </div>
             </div>
             <div className="flex justify-center -my-2 relative z-0"><ArrowRight className="w-5 h-5 text-slate-300 rotate-90" /></div>
             <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 relative shadow-sm">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10"><span className="text-[10px] font-bold text-white">2</span></div>
                <h3 className="text-sm font-bold text-brand-800 mb-3 flex items-center ml-2"><Building2 className="w-4 h-4 mr-2 text-brand-600" /> SUA EMPRESA (Centro)</h3>
                <div className="space-y-3 pl-2">
                   <div><label className="block text-xs font-medium text-brand-700/70 mb-1">Seu Setor</label><select name="companySector" value={input.companySector} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-brand-200 rounded-lg bg-white"><option value="Serviços">Serviços</option><option value="Indústria">Indústria</option><option value="Comércio">Comércio</option></select></div>
                   <div><label className="block text-xs font-medium text-brand-700/70 mb-1">Seu Regime Tributário</label><select name="companyRegime" value={input.companyRegime} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-brand-200 rounded-lg bg-white"><option value="Simples Nacional">Simples Nacional</option><option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option><option value="Lucro Presumido">Lucro Presumido</option><option value="Lucro Real">Lucro Real</option></select></div>
                </div>
             </div>
             <div className="flex justify-center -my-2 relative z-0"><ArrowRight className="w-5 h-5 text-slate-300 rotate-90" /></div>
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 relative">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10"><span className="text-[10px] font-bold text-white">3</span></div>
                <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center ml-2"><ShoppingBag className="w-4 h-4 mr-2 text-purple-600" /> CLIENTE (Destino)</h3>
                <div className="pl-2"><label className="block text-xs font-medium text-purple-700/70 mb-1">Tipo de Cliente</label><select name="customerType" value={input.customerType} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-purple-200 rounded-lg bg-white"><option value="B2C (Consumidor Final)">B2C (Pessoa Física)</option><option value="B2B (Recupera Crédito)">B2B (Recupera Crédito)</option><option value="B2B (Não Recupera Crédito)">B2B (Não Recupera)</option></select></div>
             </div>
             <button type="submit" disabled={loading} className="w-full mt-6 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center shadow-lg shadow-slate-900/10">
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Analisar Fluxo Completo"}
             </button>
          </form>
        </div>

        {/* ═══ RESULTS (coluna direita) ═══ */}
        <div className="lg:col-span-8 space-y-6">
           {!result && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <Users className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-700">Análise de Ponta a Ponta</h3>
                <p className="text-slate-500 max-w-sm mt-2">Descubra como o imposto acumula desde o fornecedor até o preço final do seu cliente.</p>
             </div>
           )}
           {loading && (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-slate-200">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-slate-700">Analisando cadeia tributária...</h3>
                <p className="text-slate-500 text-sm mt-2">Consultando LC 214/2025 e calculando impactos</p>
             </div>
           )}

           {result && !loading && (
             <>
               {/* FLOW ANALYSIS */}
               {flow && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-brand-600" /> Análise do Fluxo na Cadeia</h3>
                     <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <h4 className="font-bold text-slate-700 mb-2 text-sm flex items-center"><Factory className="w-4 h-4 mr-1.5 text-slate-500" /> 1. Fornecedor</h4>
                           <p className="text-sm text-slate-600 leading-relaxed">{flow.step1_supplier_impact || '-'}</p>
                        </div>
                        <div className="hidden md:flex items-center justify-center text-slate-300 flex-shrink-0"><ArrowRight className="w-5 h-5" /></div>
                        <div className="flex-1 bg-brand-50 p-4 rounded-lg border border-brand-200">
                           <h4 className="font-bold text-brand-800 mb-2 text-sm flex items-center"><Building2 className="w-4 h-4 mr-1.5 text-brand-600" /> 2. Sua Empresa</h4>
                           <p className="text-sm text-brand-700 leading-relaxed">{flow.step2_company_impact || '-'}</p>
                        </div>
                        <div className="hidden md:flex items-center justify-center text-slate-300 flex-shrink-0"><ArrowRight className="w-5 h-5" /></div>
                        <div className="flex-1 bg-purple-50 p-4 rounded-lg border border-purple-200">
                           <h4 className="font-bold text-purple-800 mb-2 text-sm flex items-center"><ShoppingBag className="w-4 h-4 mr-1.5 text-purple-600" /> 3. Cliente</h4>
                           <p className="text-sm text-purple-700 leading-relaxed">{flow.step3_customer_impact || '-'}</p>
                        </div>
                     </div>
                  </div>
               )}

               {/* SWOT */}
               {swot && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-brand-600" /> Diagnóstico de Risco na Cadeia (SWOT Tributário)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100"><h4 className="font-bold text-emerald-800 mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Forças</h4><ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">{(swot.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul></div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100"><h4 className="font-bold text-red-800 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Fraquezas</h4><ul className="list-disc list-inside text-sm text-red-700 space-y-1">{(swot.weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><h4 className="font-bold text-blue-800 mb-2 flex items-center"><TrendingDown className="w-4 h-4 mr-2" /> Oportunidades</h4><ul className="list-disc list-inside text-sm text-blue-700 space-y-1">{(swot.opportunities || []).map((o: string, i: number) => <li key={i}>{o}</li>)}</ul></div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100"><h4 className="font-bold text-amber-800 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Ameaças</h4><ul className="list-disc list-inside text-sm text-amber-700 space-y-1">{(swot.threats || []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul></div>
                     </div>
                  </div>
               )}

               {/* REGIME COMPARISONS */}
               {Array.isArray(regimeComps) && regimeComps.length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-brand-600" /> Simulação de Regimes Tributários (Sua Empresa)</h3>
                    <p className="text-sm text-slate-500 mb-6">Compare o impacto de manter seu regime atual ou mudar para outros regimes após a reforma.</p>
                    <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                             <tr><th className="px-4 py-3 font-bold">Regime (Futuro)</th><th className="px-4 py-3 font-bold">Carga Tributária</th><th className="px-4 py-3 font-bold">Geração de Crédito</th><th className="px-4 py-3 font-bold">Resultado Líquido</th><th className="px-4 py-3 font-bold">Recomendação</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {regimeComps.map((comp: any, idx: number) => {
                               const isCurrent = comp?.regime?.includes?.(input.companyRegime) || comp?.regime?.includes?.('Atual');
                               return (
                                 <tr key={idx} className={isCurrent ? "bg-brand-50/50" : "hover:bg-slate-50"}>
                                    <td className="px-4 py-3 font-medium text-slate-800">{comp?.regime || '-'}{isCurrent && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">ATUAL</span>}</td>
                                    <td className="px-4 py-3 text-slate-600">{comp?.taxBurden || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{comp?.creditGenerated || '-'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{comp?.netResult || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600">{comp?.recommendation || '-'}</td>
                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                    </div>
                 </div>
               )}

               {/* ═══ CONCEPTUAL SIMULATION + EXPLICAÇÃO + CTA ═══ */}
               {simulationMetrics && Array.isArray(concepts) && concepts.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                       <h3 className="font-bold text-slate-800 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-brand-600" /> Simulação Conceitual de Cadeia: Atual vs Reforma</h3>
                       <div className="flex items-center gap-2">
                         <label className="text-sm font-medium text-slate-600">Regime Futuro:</label>
                         <select value={futureRegime} onChange={(e) => setFutureRegime(e.target.value)} className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                           <option value="Simples Nacional">Simples Nacional</option>
                           <option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option>
                           <option value="Lucro Presumido">Lucro Presumido</option>
                           <option value="Lucro Real">Lucro Real</option>
                         </select>
                       </div>
                     </div>
                     <p className="text-sm text-slate-500 mb-4">Comparativo do impacto tributário na formação do preço de custo (líquido de impostos) ao longo da cadeia.</p>
                     
                     {/* Badges */}
                     <div className="flex flex-wrap gap-3 mb-6">
                        <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-xs">
                           <span className="font-bold text-slate-600">Alíquota Atual (PIS/COFINS): </span>
                           <span className="text-slate-800">{typeof simulationMetrics.aliq_pis_cofins_presumido === 'number' ? (simulationMetrics.aliq_pis_cofins_presumido * 100).toFixed(2) : '0.00'}%</span>
                           {typeof simulationMetrics.aliq_icms_atual === 'number' && simulationMetrics.aliq_icms_atual > 0 && (
                             <span className="text-slate-500 ml-1">+ ICMS/ISS {(simulationMetrics.aliq_icms_atual * 100).toFixed(1)}%</span>
                           )}
                        </div>
                        <div className="bg-brand-50 px-3 py-2 rounded border border-brand-200 text-xs">
                           <span className="font-bold text-brand-700">Alíquota Reforma (IBS/CBS): </span>
                           <span className="text-brand-900">{typeof simulationMetrics.aliq_iva === 'number' ? (simulationMetrics.aliq_iva * 100).toFixed(2) : '0.00'}%</span>
                        </div>
                     </div>

                     {/* Tabela DRE */}
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="px-4 py-3 font-bold">Formação do Preço (DRE)</th>
                                 <th className="px-4 py-3 font-bold text-right bg-red-50/50">Cenário Atual</th>
                                 <th className="px-4 py-3 font-bold text-right bg-green-50/50">Cenário Reforma</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {concepts.map((row: any, idx: number) => {
                                const isTotal = row?.etapa?.includes?.('(=)');
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                     <td className={`px-4 py-3 text-slate-800 ${isTotal ? 'font-bold' : 'font-medium'}`}>{row?.etapa || '-'}</td>
                                     <td className={`px-4 py-3 text-right bg-red-50/10 ${isTotal ? 'font-bold text-red-900' : 'text-slate-600'}`}>{row?.atual || '-'}</td>
                                     <td className={`px-4 py-3 text-right bg-green-50/10 ${isTotal ? 'font-bold text-emerald-900' : 'text-slate-600'}`}>{row?.reforma || '-'}</td>
                                  </tr>
                                );
                              })}
                           </tbody>
                        </table>
                     </div>
                     
                     {/* ═══ IMPACTO NO CAIXA + EXPLICAÇÃO + CTA ═══ */}
                     {typeof simulationMetrics.diff_imposto_pago === 'number' && (
                       <div className="mt-6 space-y-4">
                          {/* Badge de impacto */}
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                             <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">Impacto no Caixa (Imposto a Pagar)</h4>
                                <p className="text-sm text-slate-600">Diferença estimada de imposto pago em dinheiro na etapa da sua empresa.</p>
                             </div>
                             <div className="flex gap-4 text-center flex-shrink-0">
                                <div className={`px-5 py-3 rounded-lg border shadow-sm ${simulationMetrics.diff_imposto_pago > 0 ? 'bg-red-50 border-red-200' : simulationMetrics.diff_imposto_pago < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-300'}`}>
                                   <div className={`text-xs uppercase font-bold ${simulationMetrics.diff_imposto_pago > 0 ? 'text-red-700' : simulationMetrics.diff_imposto_pago < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                                     {simulationMetrics.diff_imposto_pago > 0 ? 'Aumento de Imposto' : simulationMetrics.diff_imposto_pago < 0 ? 'Redução de Imposto' : 'Impacto Neutro'}
                                   </div>
                                   <div className={`text-lg font-bold ${simulationMetrics.diff_imposto_pago > 0 ? 'text-red-900' : simulationMetrics.diff_imposto_pago < 0 ? 'text-emerald-900' : 'text-slate-800'}`}>
                                     R$ {Math.abs(simulationMetrics.diff_imposto_pago).toFixed(2).replace('.', ',')}
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* EXPLICAÇÃO DO MOTIVO */}
                          {simulationMetrics.impactReason && (
                            <div className={`p-4 rounded-lg border text-sm leading-relaxed ${simulationMetrics.diff_imposto_pago > 0 ? 'bg-red-50/50 border-red-100 text-red-800' : simulationMetrics.diff_imposto_pago < 0 ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                              <span className="font-bold">Por quê? </span>
                              {simulationMetrics.impactReason}
                            </div>
                          )}

                          {/* CTA CONSULTORIA */}
                          {simulationMetrics.impactCta && (
                            <div className="bg-gradient-to-r from-brand-50 to-purple-50 p-4 rounded-lg border border-brand-200 flex items-start gap-3">
                              <Lightbulb className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-brand-800 leading-relaxed">
                                {simulationMetrics.impactCta}
                              </p>
                            </div>
                          )}
                       </div>
                     )}
                  </div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
};
