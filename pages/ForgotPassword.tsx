import React, { useState } from 'react';
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (view: any) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (email) {
      // Mock reset password
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-brand-600 p-2 rounded-xl">
             <Activity className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Recuperar senha
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-lg sm:px-10 border border-slate-100">
          
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <p className="text-sm text-slate-600 text-center mb-4">
                 Digite o e-mail cadastrado e enviaremos as instruções para redefinir sua senha.
              </p>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  E-mail corporativo
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
                    {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition"
                >
                  Enviar Instruções
                </button>
              </div>
              
              <div className="text-center mt-4">
                 <button type="button" onClick={() => onNavigate('login')} className="flex items-center justify-center w-full text-sm font-medium text-slate-500 hover:text-brand-600 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Login
                 </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
               </div>
               <h3 className="text-lg leading-6 font-medium text-slate-900">E-mail enviado!</h3>
               <p className="mt-2 text-sm text-slate-500">
                  Verifique sua caixa de entrada (e spam) para encontrar o link de redefinição de senha enviado para <strong>{email}</strong>.
               </p>
               <div className="mt-6">
                 <button
                   onClick={() => onNavigate('login')}
                   className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700"
                 >
                   Voltar ao Login
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};