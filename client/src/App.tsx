
import React, { useState, useEffect } from 'react';
import './App.css';

interface UserInfo {
  company: string;
  whatsapp: string;
  message: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const company_id = urlParams.get('company_id');
        const whatsapp = urlParams.get('whatsapp');
        const codigo = urlParams.get('codigo');

        if (!company_id || !whatsapp || !codigo) {
          setError('Acesso negado. URL deve conter os parâmetros: company_id, whatsapp e codigo');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/user-info?company_id=${company_id}&whatsapp=${encodeURIComponent(whatsapp)}&codigo=${codigo}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Erro de autenticação');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUserInfo(data);
        setLoading(false);
      } catch (err) {
        setError('Erro de conexão com o servidor');
        setLoading(false);
      }
    };

    validateAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg">Validando acesso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg border-red-200">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <p className="text-sm text-muted-foreground">
              Verifique se você está usando o link correto fornecido pelo sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg border-green-200">
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Acesso Autorizado</h1>
          
          <div className="space-y-4 text-left bg-green-50 p-4 rounded-lg">
            <div>
              <span className="font-semibold text-green-800">Empresa:</span>
              <span className="ml-2 text-green-700">{userInfo?.company}</span>
            </div>
            <div>
              <span className="font-semibold text-green-800">WhatsApp:</span>
              <span className="ml-2 text-green-700">{userInfo?.whatsapp}</span>
            </div>
          </div>

          <p className="mt-6 text-green-600 font-medium">{userInfo?.message}</p>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Sistema de autenticação baseado em URL validada</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
