
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
  createdAt: string;
}

interface UserManagementProps {
  currentUser: AdminUser;
}

const UserManagement = ({ currentUser }: UserManagementProps) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', companyName: '' });
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
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.companyName.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
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
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...allUsers, user];
    saveUsers(updatedUsers);
    setNewUser({ username: '', password: '', companyName: '' });
    
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

  if (currentUser.role !== 'superadmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minha Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa</Label>
              <p className="text-lg font-semibold">{currentUser.companyName}</p>
            </div>
            <div>
              <Label>Usuário</Label>
              <p>{currentUser.username}</p>
            </div>
            <div>
              <Label>Company ID</Label>
              <p className="font-mono text-sm">{currentUser.companyId}</p>
            </div>
            <div>
              <Label>Link do Cliente</Label>
              <div className="flex items-center gap-2">
                <p className="text-sm bg-gray-50 p-2 rounded flex-1 font-mono">
                  {currentUser.companyId ? generateClientLink(currentUser.companyId) : 'N/A'}
                </p>
                {currentUser.companyId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateClientLink(currentUser.companyId!))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Tipo de Conta</Label>
              <p>Cliente</p>
            </div>
            <div>
              <Label>Criado em</Label>
              <p>{new Date(currentUser.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="new-username">Usuário</Label>
              <Input
                id="new-username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                placeholder="Ex: cliente1"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Senha do cliente"
              />
            </div>
            <div>
              <Label htmlFor="new-company">Nome da Empresa</Label>
              <Input
                id="new-company"
                value={newUser.companyName}
                onChange={(e) => setNewUser({...newUser, companyName: e.target.value})}
                placeholder="Ex: Salão Beleza"
              />
            </div>
          </div>
          <Button onClick={addUser} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Criar Cliente
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados ({clientUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientUsers.length === 0 ? (
            <p className="text-gray-500">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {clientUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-start p-4 border rounded-lg">
                  {editingUser?.id === user.id ? (
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <Input
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        placeholder="Usuário"
                      />
                      <Input
                        type="password"
                        value={editingUser.password}
                        onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                        placeholder="Senha"
                      />
                      <Input
                        value={editingUser.companyName || ''}
                        onChange={(e) => setEditingUser({...editingUser, companyName: e.target.value})}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.companyName}</h3>
                      <p className="text-sm text-gray-600">
                        Usuário: {user.username}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Senha:</span>
                        <span>{showPasswords[user.id] ? user.password : '••••••••'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="h-6 w-6 p-0"
                        >
                          {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        <span>Company ID: </span>
                        <span className="font-mono">{user.companyId}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>Link do Cliente: </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-50 p-1 rounded font-mono flex-1">
                            {user.companyId ? generateClientLink(user.companyId) : 'N/A'}
                          </span>
                          {user.companyId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(generateClientLink(user.companyId!))}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingUser?.id === user.id ? (
                      <>
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
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
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
              Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita.
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
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
