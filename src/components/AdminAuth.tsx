
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'client';
  companyName?: string;
  createdAt: string;
}

interface AdminAuthProps {
  onLogin: (user: AdminUser) => void;
}

const AdminAuth = ({ onLogin }: AdminAuthProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar usuários do localStorage ou criar superadmin padrão
  const getAdminUsers = (): AdminUser[] => {
    const saved = localStorage.getItem('adminUsers');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Criar superadmin padrão
    const defaultSuperAdmin: AdminUser = {
      id: 'superadmin-1',
      username: 'admin',
      password: 'admin123',
      role: 'superadmin',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('adminUsers', JSON.stringify([defaultSuperAdmin]));
    return [defaultSuperAdmin];
  };

  const handleLogin = () => {
    setIsLoading(true);
    
    try {
      const users = getAdminUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        onLogin(user);
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${user.role === 'superadmin' ? 'Super Admin' : user.companyName || user.username}!`,
        });
      } else {
        toast({
          title: "Erro de autenticação",
          description: "Usuário ou senha incorretos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
          <p className="text-sm text-gray-600">Faça login para acessar</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite seu usuário"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua senha"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full"
            disabled={isLoading || !username.trim() || !password.trim()}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          
          <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 rounded">
            <p><strong>Acesso padrão:</strong></p>
            <p>Usuário: admin</p>
            <p>Senha: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
