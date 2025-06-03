
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, EyeOff, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

interface UserManagementProps {
  currentUser: AdminUser;
}

const UserManagement = ({ currentUser }: UserManagementProps) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    companyName: '', 
    address: '', 
    cpfCnpj: '', 
    whatsapp: '', 
    socialMedia: '' 
  });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const generateCompanyId = (): string => {
    return Math.random().toString(36).substring(2, 15);
  };

  const generateClientLink = (companyId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${companyId}`;
  };

  const loadUsers = () => {
    const saved = localStorage.getItem('adminUsers');
    if (saved) {
      const allUsers = JSON.parse(saved);
      // Filtrar apenas clientes se não for superadmin
      const filteredUsers = currentUser.role === 'superadmin' 
        ? allUsers 
        : allUsers.filter((u: AdminUser) => u.id === currentUser.id);
      setUsers(filteredUsers);
    }
  };

  const saveUsers = (updatedUsers: AdminUser[]) => {
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    setUsers(updatedUsers.filter(u => currentUser.role === 'superadmin' || u.id === currentUser.id));
  };

  const addUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.companyName.trim() || !newUser.cpfCnpj.trim() || !newUser.whatsapp.trim()) {
      toast({
        title: "Erro",
        description: "Username, senha, nome da empresa, CPF/CNPJ e WhatsApp são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const allUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    if (allUsers.find((u: AdminUser) => u.username === newUser.username)) {
      toast({
        title: "Erro",
        description: "Nome de usuário já existe.",
        variant: "destructive"
      });
      return;
    }

    const companyId = generateCompanyId();
    const user: AdminUser = {
      id: Date.now().toString(),
      username: newUser.username,
      password: newUser.password,
      role: 'client',
      companyName: newUser.companyName,
      companyId: companyId,
      address: newUser.address,
      cpfCnpj: newUser.cpfCnpj,
      whatsapp: newUser.whatsapp,
      socialMedia: newUser.socialMedia,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...allUsers, user];
    saveUsers(updatedUsers);
    setNewUser({ username: '', password: '', companyName: '', address: '', cpfCnpj: '', whatsapp: '', socialMedia: '' });
    
    toast({
      title: "Cliente criado!",
      description: `Cliente ${newUser.companyName} foi criado com sucesso.`,
    });
  };

  const updateUser = () => {
    if (!editingUser) return;

    const allUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const updatedUsers = allUsers.map((u: AdminUser) => 
      u.id === editingUser.id ? editingUser : u
    );
    
    saveUsers(updatedUsers);
    setEditingUser(null);
    
    toast({
      title: "Cliente atualizado!",
      description: "Informações atualizadas com sucesso.",
    });
  };

  const deleteUser = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const updatedUsers = allUsers.filter((u: AdminUser) => u.id !== userId);
    saveUsers(updatedUsers);
    setDeleteDialog({ open: false, userId: null });
    
    toast({
      title: "Cliente removido!",
      description: "Cliente foi removido com sucesso.",
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const clientUsers = users.filter(u => u.role === 'client');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-username">Username (Login)</Label>
              <Input
                id="new-username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                placeholder="Ex: empresa123"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Digite a senha"
              />
            </div>
            <div>
              <Label htmlFor="new-company">Nome da Empresa</Label>
              <Input
                id="new-company"
                value={newUser.companyName}
                onChange={(e) => setNewUser({...newUser, companyName: e.target.value})}
                placeholder="Ex: Salão Beleza & Arte"
              />
            </div>
            <div>
              <Label htmlFor="new-address">Endereço</Label>
              <Input
                id="new-address"
                value={newUser.address}
                onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                placeholder="Ex: Rua das Flores, 123 - Centro"
              />
            </div>
            <div>
              <Label htmlFor="new-cpfcnpj">CPF/CNPJ</Label>
              <Input
                id="new-cpfcnpj"
                value={newUser.cpfCnpj}
                onChange={(e) => setNewUser({...newUser, cpfCnpj: e.target.value})}
                placeholder="Ex: 12.345.678/0001-90"
              />
            </div>
            <div>
              <Label htmlFor="new-whatsapp">WhatsApp</Label>
              <Input
                id="new-whatsapp"
                value={newUser.whatsapp}
                onChange={(e) => setNewUser({...newUser, whatsapp: e.target.value})}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="new-social">Redes Sociais</Label>
              <Input
                id="new-social"
                value={newUser.socialMedia}
                onChange={(e) => setNewUser({...newUser, socialMedia: e.target.value})}
                placeholder="Ex: @empresa_instagram, Facebook: Empresa"
              />
            </div>
          </div>
          <Button onClick={addUser} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cliente
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados ({clientUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <div className="space-y-4">
              {clientUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  {editingUser?.id === user.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Username</Label>
                          <Input
                            value={editingUser.username}
                            onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Senha</Label>
                          <Input
                            type="password"
                            value={editingUser.password}
                            onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Nome da Empresa</Label>
                          <Input
                            value={editingUser.companyName || ''}
                            onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Endereço</Label>
                          <Input
                            value={editingUser.address || ''}
                            onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>CPF/CNPJ</Label>
                          <Input
                            value={editingUser.cpfCnpj || ''}
                            onChange={(e) => setEditingUser({...editingUser, cpfCnpj: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>WhatsApp</Label>
                          <Input
                            value={editingUser.whatsapp || ''}
                            onChange={(e) => setEditingUser({...editingUser, whatsapp: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Redes Sociais</Label>
                          <Input
                            value={editingUser.socialMedia || ''}
                            onChange={(e) => setEditingUser({...editingUser, socialMedia: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={updateUser} size="sm">
                          Salvar
                        </Button>
                        <Button 
                          onClick={() => setEditingUser(null)} 
                          variant="outline" 
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{user.companyName}</h3>
                            <p className="text-sm text-muted-foreground">Username: {user.username}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-muted-foreground">Senha:</span>
                              <span className="text-sm font-mono">
                                {showPasswords[user.id] ? user.password : '••••••••'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="h-6 w-6 p-0"
                              >
                                {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm"><strong>CPF/CNPJ:</strong> {user.cpfCnpj}</p>
                            <p className="text-sm"><strong>WhatsApp:</strong> {user.whatsapp}</p>
                            <p className="text-sm"><strong>Endereço:</strong> {user.address}</p>
                            {user.socialMedia && (
                              <p className="text-sm"><strong>Redes Sociais:</strong> {user.socialMedia}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setEditingUser(user)} 
                            variant="outline" 
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={() => setDeleteDialog({ open: true, userId: user.id })} 
                            variant="destructive" 
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Link da Empresa:</p>
                            <p className="text-sm font-mono text-blue-600">{generateClientLink(user.companyId!)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Company ID: {user.companyId}
                            </p>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(generateClientLink(user.companyId!))}
                            variant="outline"
                            size="sm"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita e todos os dados da empresa serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, userId: null })}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => deleteDialog.userId && deleteUser(deleteDialog.userId)}
              variant="destructive"
              className="flex-1"
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
