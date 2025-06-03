import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'client';
  companyName?: string;
  companyId?: string;
  address?: string;
  cpfCnpj?: string;
  whatsapp?: string;
  socialMedia?: string;
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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const { toast } = useToast();

  // Carregar usuários do localStorage ou criar superadmin padrão
  const getAdminUsers = (): AdminUser[] => {
    const saved = localStorage.getItem('adminUsers');
    if (saved) {
      const users = JSON.parse(saved);
      // Migrar usuários existentes sem companyId
      const migratedUsers = users.map((user: AdminUser) => {
        if (user.role === 'client' && !user.companyId) {
          return {
            ...user,
            companyId: Math.random().toString(36).substring(2, 15)
          };
        }
        return user;
      });
      
      // Salvar usuários migrados se houve mudanças
      if (JSON.stringify(users) !== JSON.stringify(migratedUsers)) {
        localStorage.setItem('adminUsers', JSON.stringify(migratedUsers));
      }
      
      return migratedUsers;
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

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    const users = getAdminUsers();
    const superAdmin = users.find(u => u.role === 'superadmin');
    
    if (!superAdmin || superAdmin.password !== currentPassword) {
      toast({
        title: "Erro",
        description: "Senha atual incorreta.",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.map(user => 
      user.role === 'superadmin' ? { ...user, password: newPassword } : user
    );
    
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    
    toast({
      title: "Senha alterada!",
      description: "Senha do Super Admin alterada com sucesso.",
    });

    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

          <Button 
            onClick={() => setShowPasswordDialog(true)} 
            variant="outline"
            className="w-full mt-2"
          >
            Alterar Senha Super Admin
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Super Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuth;
