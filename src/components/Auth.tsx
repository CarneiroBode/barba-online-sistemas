import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthProps {
  onNameSubmit: (name: string) => void;
  companyName: string;
  isNewClient?: boolean;
}

const Auth = ({ onNameSubmit, companyName, isNewClient = false }: AuthProps) => {
  const [nameInput, setNameInput] = useState('');

  const handleSubmit = () => {
    if (nameInput.trim()) {
      onNameSubmit(nameInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto pt-20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">{companyName}</h1>
          {isNewClient ? (
            <>
              <div className="bg-amber-700 rounded-2xl p-6 mb-6">
                <p className="text-lg">Como vai! Que bom que chegou!</p>
              </div>
              <div className="bg-amber-700 rounded-2xl p-6 mb-6">
                <p>Para que possamos lembrá-lo de seus agendamentos, qual seu nome?</p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Digite seu nome"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-4 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
                />
                <Button 
                  onClick={handleSubmit}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 text-lg"
                >
                  Continuar
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-amber-700 rounded-2xl p-6 mb-6">
              <p className="text-lg">
                Acesso restrito. Por favor, use o link enviado via WhatsApp para acessar seus agendamentos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth; 