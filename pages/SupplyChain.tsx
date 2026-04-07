import React, { useState, useEffect } from 'react';
import { SupplyChainInput, SupplyChainResult } from '../types';
import { runSupplyChainAnalysis, simuladorEstrategicoIva } from '../services/geminiService';
import { Link as LinkIcon, Home, ArrowRight, Factory, Building2, Truck, AlertTriangle, CheckCircle, TrendingDown, Save, Download, Loader2, Users, ShoppingBag } from 'lucide-react';

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

  useEffect(() => {
    if (result) {
      setSimulationMetrics(simuladorEstrategicoIva(input, futureRegime));
    }
  }, [futureRegime, input, result]);

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
    } catch (error) {
      alert("Erro ao analisar cadeia.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      // Mock save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Análise de cadeia salva com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar análise.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => window.print();

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
            <button onClick={onNavigateHome} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition shadow-sm" title="Voltar ao Início">
               <Home className="w-4 h-4 mr-2" />
               Voltar ao Início
            </button>
            <button onClick={handleSave} disabled={!result || saving} className="flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition">
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Salvar
            </button>
            <button onClick={handleExport} disabled={!result} className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition">
               <Download className="w-4 h-4 mr-2" /> PDF
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT CONFIGURATION - VERTICAL FLOW */}
        <div className="lg:col-span-4 h-fit sticky top-6">
          <form onSubmit={handleSimulate} className="relative space-y-4">
             
             {/* ETAPA 1: FORNECEDOR */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                  <span className="text-[10px] font-bold text-slate-700">1</span>
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center ml-2">
                   <Factory className="w-4 h-4 mr-2 text-slate-500" /> FORNECEDOR (Origem)
                </h3>
                <div className="space-y-3 pl-2">
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Setor do Fornecedor</label>
                      <select name="supplierSector" value={input.supplierSector} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg">
                         <option value="Indústria">Indústria</option>
                         <option value="Serviços">Serviços</option>
                         <option value="Comércio">Comércio</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Regime Tributário</label>
                      <select name="supplierRegime" value={input.supplierRegime} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg">
                         <option value="Simples Nacional">Simples Nacional</option>
                         <option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option>
                         <option value="Lucro Presumido">Lucro Presumido</option>
                         <option value="Lucro Real">Lucro Real</option>
                      </select>
                   </div>
                </div>
             </div>

             {/* SETA 1 */}
             <div className="flex justify-center -my-2 relative z-0">
                <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
             </div>

             {/* ETAPA 2: EMPRESA (VOCÊ) */}
             <div className="bg-brand-50 p-4 rounded-xl border border-brand-200 relative shadow-sm">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                  <span className="text-[10px] font-bold text-white">2</span>
                </div>
                <h3 className="text-sm font-bold text-brand-800 mb-3 flex items-center ml-2">
                   <Building2 className="w-4 h-4 mr-2 text-brand-600" /> SUA EMPRESA (Centro)
                </h3>
                <div className="space-y-3 pl-2">
                   <div>
                      <label className="block text-xs font-medium text-brand-700/70 mb-1">Seu Setor</label>
                      <select name="companySector" value={input.companySector} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-brand-200 rounded-lg bg-white">
                         <option value="Serviços">Serviços</option>
                         <option value="Indústria">Indústria</option>
                         <option value="Comércio">Comércio</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-brand-700/70 mb-1">Seu Regime Tributário</label>
                      <select name="companyRegime" value={input.companyRegime} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-brand-200 rounded-lg bg-white">
                         <option value="Simples Nacional">Simples Nacional</option>
                         <option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option>
                         <option value="Lucro Presumido">Lucro Presumido</option>
                         <option value="Lucro Real">Lucro Real</option>
                      </select>
                   </div>
                </div>
             </div>

             {/* SETA 2 */}
             <div className="flex justify-center -my-2 relative z-0">
                <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
             </div>

             {/* ETAPA 3: CLIENTE FINAL */}
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 relative">
                <div className="absolute -left-3 top-6 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                  <span className="text-[10px] font-bold text-white">3</span>
                </div>
                <h3 className="text-sm font-bold text-purple-800 mb-3 flex items-center ml-2">
                   <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" /> CLIENTE (Destino)
                </h3>
                <div className="pl-2">
                   <label className="block text-xs font-medium text-purple-700/70 mb-1">Tipo de Cliente</label>
                   <select name="customerType" value={input.customerType} onChange={handleInputChange} className="w-full text-sm px-3 py-2 border border-purple-200 rounded-lg bg-white">
                      <option value="B2C (Consumidor Final)">B2C (Pessoa Física)</option>
                      <option value="B2B (Recupera Crédito)">B2B (Recupera Crédito - Ex: Lucro Real)</option>
                      <option value="B2B (Não Recupera Crédito)">B2B (Não Recupera - Ex: Simples)</option>
                   </select>
                </div>
             </div>

             <button type="submit" disabled={loading} className="w-full mt-6 bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center shadow-lg shadow-slate-900/10">
               {loading ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>) : "Analisar Fluxo Completo"}
             </button>
          </form>
        </div>

        {/* RESULTS AREA */}
        <div className="lg:col-span-8 space-y-6">
           {!result && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <Users className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-700">Análise de Ponta a Ponta</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                   Descubra como o imposto acumula desde o fornecedor até o preço final do seu cliente.
                </p>
             </div>
           )}

           {result && (
             <>
               {/* FLOW ANALYSIS */}
               {result.flowAnalysis && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-2 text-brand-600" />
                        Análise do Fluxo na Cadeia
                     </h3>
                     <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                           <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                              <h4 className="font-bold text-slate-700 mb-2 text-sm">1. Fornecedor</h4>
                              <p className="text-sm text-slate-600">{result.flowAnalysis.step1_supplier_impact}</p>
                           </div>
                           <div className="hidden md:flex items-center justify-center text-slate-400">
                              <ArrowRight className="w-5 h-5" />
                           </div>
                           <div className="flex-1 bg-brand-50 p-4 rounded-lg border border-brand-100">
                              <h4 className="font-bold text-brand-800 mb-2 text-sm">2. Sua Empresa</h4>
                              <p className="text-sm text-brand-700">{result.flowAnalysis.step2_company_impact}</p>
                           </div>
                           <div className="hidden md:flex items-center justify-center text-slate-400">
                              <ArrowRight className="w-5 h-5" />
                           </div>
                           <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                              <h4 className="font-bold text-slate-700 mb-2 text-sm">3. Cliente</h4>
                              <p className="text-sm text-slate-600">{result.flowAnalysis.step3_customer_impact}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* SWOT ANALYSIS */}
               {result.swotAnalysis && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-brand-600" />
                        Diagnóstico de Risco na Cadeia (SWOT Tributário)
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                           <h4 className="font-bold text-emerald-800 mb-2 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" /> Forças
                           </h4>
                           <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                              {result.swotAnalysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                           </ul>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                           <h4 className="font-bold text-red-800 mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" /> Fraquezas
                           </h4>
                           <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                              {result.swotAnalysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                           </ul>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                           <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                              <TrendingDown className="w-4 h-4 mr-2" /> Oportunidades
                           </h4>
                           <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                              {result.swotAnalysis.opportunities?.map((o, i) => <li key={i}>{o}</li>)}
                           </ul>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                           <h4 className="font-bold text-amber-800 mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" /> Ameaças
                           </h4>
                           <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                              {result.swotAnalysis.threats?.map((t, i) => <li key={i}>{t}</li>)}
                           </ul>
                        </div>
                     </div>
                  </div>
               )}

               {/* REGIME COMPARISONS */}
               {result.companyRegimeComparisons && result.companyRegimeComparisons.length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <TrendingDown className="w-5 h-5 mr-2 text-brand-600" />
                       Simulação de Regimes Tributários (Sua Empresa)
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                       Compare o impacto de manter seu regime atual ou mudar para outros regimes após a reforma, considerando seu fornecedor e cliente atuais.
                    </p>
                    <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                             <tr>
                                <th className="px-4 py-3 font-bold">Regime (Futuro)</th>
                                <th className="px-4 py-3 font-bold">Carga Tributária</th>
                                <th className="px-4 py-3 font-bold">Geração de Crédito</th>
                                <th className="px-4 py-3 font-bold">Resultado Líquido</th>
                                <th className="px-4 py-3 font-bold">Recomendação</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {result.companyRegimeComparisons?.map((comp, idx) => (
                               <tr key={idx} className={comp.regime === input.companyRegime ? "bg-brand-50/50" : "hover:bg-slate-50"}>
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    {comp.regime}
                                    {comp.regime === input.companyRegime && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">ATUAL</span>}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{comp.taxBurden}</td>
                                  <td className="px-4 py-3 text-slate-600">{comp.creditGenerated}</td>
                                  <td className="px-4 py-3 font-medium text-slate-800">{comp.netResult}</td>
                                  <td className="px-4 py-3 text-slate-600">{comp.recommendation}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
               )}

               {/* CONCEPTUAL SIMULATION (NEW) */}
               {simulationMetrics && simulationMetrics.conceptualSimulation && simulationMetrics.conceptualSimulation.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                       <h3 className="font-bold text-slate-800 flex items-center">
                          <TrendingDown className="w-5 h-5 mr-2 text-brand-600" />
                          Simulação Conceitual de Cadeia: Atual vs Reforma
                       </h3>
                       <div className="flex items-center gap-2">
                         <label className="text-sm font-medium text-slate-600">Regime Futuro:</label>
                         <select 
                           value={futureRegime} 
                           onChange={(e) => setFutureRegime(e.target.value)}
                           className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                         >
                           <option value="Simples Nacional">Simples Nacional</option>
                           <option value="Simples Dual (Híbrido)">Simples Dual (Híbrido)</option>
                           <option value="Lucro Presumido">Lucro Presumido</option>
                           <option value="Lucro Real">Lucro Real</option>
                         </select>
                       </div>
                     </div>
                     <p className="text-sm text-slate-500 mb-4">
                        Comparativo do impacto tributário na formação do preço de custo (líquido de impostos) ao longo da cadeia.
                     </p>
                     
                     <div className="flex gap-4 mb-6">
                        <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-xs">
                           <span className="font-bold text-slate-600">Alíquota Atual (PIS/COFINS): </span>
                           <span className="text-slate-800">{(simulationMetrics.aliq_pis_cofins_presumido * 100).toFixed(2)}%</span>
                        </div>
                        <div className="bg-brand-50 px-3 py-2 rounded border border-brand-200 text-xs">
                           <span className="font-bold text-brand-700">Alíquota Reforma (IBS/CBS): </span>
                           <span className="text-brand-900">{(simulationMetrics.aliq_iva * 100).toFixed(2)}%</span>
                        </div>
                     </div>

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
                              {simulationMetrics.conceptualSimulation.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                   <td className={`px-4 py-3 text-slate-800 ${row.etapa.includes('(=)') ? 'font-bold' : 'font-medium'}`}>{row.etapa}</td>
                                   <td className={`px-4 py-3 text-right bg-red-50/10 ${row.etapa.includes('(=)') ? 'font-bold text-red-900' : 'text-slate-600'}`}>{row.atual}</td>
                                   <td className={`px-4 py-3 text-right bg-green-50/10 ${row.etapa.includes('(=)') ? 'font-bold text-emerald-900' : 'text-slate-600'}`}>{row.reforma}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     
                     <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                           <h4 className="font-bold text-slate-800 text-sm mb-1">Impacto no Caixa (Imposto a Pagar)</h4>
                           <p className="text-sm text-slate-600">
                             Diferença estimada de imposto pago em dinheiro na etapa da sua empresa.
                           </p>
                        </div>
                        <div className="flex gap-4 text-center">
                           <div className={`px-4 py-2 rounded border shadow-sm ${simulationMetrics.diff_imposto_pago > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                              <div className={`text-xs uppercase font-bold ${simulationMetrics.diff_imposto_pago > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                {simulationMetrics.diff_imposto_pago > 0 ? 'Aumento de Imposto' : 'Redução de Imposto'}
                              </div>
                              <div className={`font-bold ${simulationMetrics.diff_imposto_pago > 0 ? 'text-red-900' : 'text-emerald-900'}`}>
                                R$ {Math.abs(simulationMetrics.diff_imposto_pago).toFixed(2).replace('.', ',')}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}


             </>
           )}
        </div>
      </div>
    </div>
  );
};