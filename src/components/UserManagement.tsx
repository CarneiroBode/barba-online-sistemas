import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building, Eye, EyeOff } from "lucide-react";
import { saveCompanyInfo } from "@/utils/supabaseOperations";

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
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    companyName: '',
    address: '',
    cpfCnpj: '',
    whatsapp: '',
    socialMedia: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('adminUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  };

  const resetForm = () => {
    setNewUser({
      username: '',
      password: '',
      companyName: '',
      address: '',
      cpfCnpj: '',
      whatsapp: '',
      socialMedia: ''
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const generateCompanyId = (companyName: string): string => {
    const cleanName = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .substring(0, 10); // Limita a 10 caracteres

    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
    return `${cleanName}_${timestamp}`;
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se não tiver números, retorna vazio
    if (!numbers) return '';
    
    // Adiciona parênteses no DDD
    if (numbers.length <= 2) return `(${numbers}`;
    
    // Fecha parênteses após DDD
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)})${numbers.slice(2)}`;
    
    // Adiciona hífen
    return `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const unformatWhatsApp = (value: string) => {
    // Remove tudo que não é número e adiciona 55 na frente
    return '55' + value.replace(/\D/g, '');
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.companyName || !newUser.whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (nome da empresa, usuário, senha e WhatsApp).",
        variant: "destructive"
      });
      return;
    }

    // Validar formato do WhatsApp (11 dígitos - DDD + número)
    const phoneNumbers = newUser.whatsapp.replace(/\D/g, '');
    if (phoneNumbers.length !== 11) {
      toast({
        title: "Erro",
        description: "O WhatsApp deve conter exatamente 11 dígitos (DDD + 9 dígitos).",
        variant: "destructive"
      });
      return;
    }

    // Adiciona 55 na frente para formar os 13 dígitos
    const whatsappNumbers = unformatWhatsApp(newUser.whatsapp);

    // Verificar se username já existe
    if (users.some(user => user.username === newUser.username)) {
      toast({
        title: "Erro",
        description: "Nome de usuário já existe.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se WhatsApp já existe (comparando sem formatação)
    if (users.some(user => unformatWhatsApp(user.whatsapp || '') === whatsappNumbers)) {
      toast({
        title: "Erro",
        description: "Este número de WhatsApp já está cadastrado.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Salvar empresa no Supabase
      const companyInfo = {
        whatsapp: whatsappNumbers,
        name: newUser.companyName,
        address: newUser.address,
        phone: newUser.whatsapp,
        professional_name: '',
        social_media: newUser.socialMedia
      };

      await saveCompanyInfo(companyInfo);

      // Criar usuário local
      const user: AdminUser = {
        id: Date.now().toString(),
        username: newUser.username,
        password: newUser.password,
        role: 'client',
        companyName: newUser.companyName,
        companyId: whatsappNumbers,
        address: newUser.address,
        cpfCnpj: newUser.cpfCnpj,
        whatsapp: newUser.whatsapp,
        socialMedia: newUser.socialMedia,
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...users, user];
      setUsers(updatedUsers);
      localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));

      toast({
        title: "Empresa criada!",
        description: `${newUser.companyName} foi criada com sucesso. WhatsApp: ${newUser.whatsapp}`,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a empresa. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateUser = () => {
    if (!editingUser || !editingUser.whatsapp) return;

    // Criar uma cópia do usuário editado mantendo o WhatsApp original
    const userToUpdate = {
      ...editingUser,
      whatsapp: editingUser.whatsapp, // Mantém o WhatsApp original
      companyId: editingUser.companyId // Mantém o Company ID original
    };

    const updatedUsers = users.map(user => 
      user.id === editingUser.id ? userToUpdate : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));

    // Atualizar dados da empresa também
    const companyInfo = {
      whatsapp: editingUser.whatsapp, // WhatsApp já verificado como não undefined
      name: editingUser.companyName || '',
      address: editingUser.address || '',
      phone: editingUser.whatsapp, // WhatsApp já verificado como não undefined
      professional_name: '',
      social_media: editingUser.socialMedia || ''
    };

    try {
      // Atualizar no Supabase
      saveCompanyInfo(companyInfo);

      toast({
        title: "Empresa atualizada!",
        description: `${editingUser.companyName} foi atualizada com sucesso.`,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a empresa. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));

    toast({
      title: "Empresa removida!",
      description: "A empresa foi removida com sucesso.",
    });
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciar Empresas do Sistema</h2>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.filter(user => user.role === 'client').map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {user.companyName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <strong>Company ID:</strong>
                <div className="bg-gray-50 border border-gray-300 p-2 rounded font-mono font-bold text-gray-800 mt-1">
                  {user.companyId}
                </div>
              </div>
              <div className="text-sm">
                <strong>Usuário:</strong> {user.username}
              </div>
              {user.cpfCnpj && (
                <div className="text-sm">
                  <strong>CPF/CNPJ:</strong> {user.cpfCnpj}
                </div>
              )}
              {user.whatsapp && (
                <div className="text-sm">
                  <strong>WhatsApp:</strong> {user.whatsapp}
                </div>
              )}
              {user.address && (
                <div className="text-sm">
                  <strong>Endereço:</strong> {user.address}
                </div>
              )}
              {user.socialMedia && (
                <div className="text-sm">
                  <strong>Rede Social:</strong> {user.socialMedia}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={() => openEditDialog(user)} 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  onClick={() => deleteUser(user.id)} 
                  variant="destructive" 
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.filter(user => user.role === 'client').length === 0 && (
        <Card>
          <CardContent className="text-center py-6">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
            <Button onClick={openAddDialog} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize as informações da empresa.' : 'Preencha os dados para criar uma nova empresa no sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  value={editingUser ? editingUser.username : newUser.username}
                  onChange={(e) => editingUser 
                    ? setEditingUser({...editingUser, username: e.target.value})
                    : setNewUser({...newUser, username: e.target.value})
                  }
                  placeholder="usuario_empresa"
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={editingUser ? editingUser.password : newUser.password}
                    onChange={(e) => editingUser 
                      ? setEditingUser({...editingUser, password: e.target.value})
                      : setNewUser({...newUser, password: e.target.value})
                    }
                    placeholder="senha123"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={editingUser ? editingUser.companyName || '' : newUser.companyName}
                onChange={(e) => editingUser 
                  ? setEditingUser({...editingUser, companyName: e.target.value})
                  : setNewUser({...newUser, companyName: e.target.value})
                }
                placeholder="Minha Empresa Ltda"
              />
            </div>

            {editingUser && editingUser.companyId && (
              <div>
                <Label className="font-bold">Company ID/WhatsApp * (não pode ser alterado)</Label>
                <div className="bg-gray-50 border border-gray-300 p-3 rounded font-mono font-bold text-gray-800 mt-2">
                  {editingUser.whatsapp}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Este é o identificador único da empresa e seu número de contato WhatsApp. Para alterar, exclua a empresa e cadastre novamente.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={editingUser ? editingUser.cpfCnpj || '' : newUser.cpfCnpj}
                onChange={(e) => editingUser 
                  ? setEditingUser({...editingUser, cpfCnpj: e.target.value})
                  : setNewUser({...newUser, cpfCnpj: e.target.value})
                }
                placeholder="00.000.000/0001-00"
              />
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  value={newUser.whatsapp}
                  onChange={(e) => {
                    const formattedValue = formatWhatsApp(e.target.value);
                    setNewUser({...newUser, whatsapp: formattedValue});
                  }}
                  placeholder="(27)99999-9999"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Formato: (DDD)99999-9999 - O código do país (55) será adicionado automaticamente.
                  Este número não poderá ser alterado após a criação da empresa.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={editingUser ? editingUser.address || '' : newUser.address}
                onChange={(e) => editingUser 
                  ? setEditingUser({...editingUser, address: e.target.value})
                  : setNewUser({...newUser, address: e.target.value})
                }
                placeholder="Rua das Flores, 123 - Centro"
              />
            </div>

            <div>
              <Label htmlFor="socialMedia">Rede Social</Label>
              <Input
                id="socialMedia"
                value={editingUser ? editingUser.socialMedia || '' : newUser.socialMedia}
                onChange={(e) => editingUser 
                  ? setEditingUser({...editingUser, socialMedia: e.target.value})
                  : setNewUser({...newUser, socialMedia: e.target.value})
                }
                placeholder="@minhaempresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={editingUser ? updateUser : addUser}>
              {editingUser ? 'Atualizar' : 'Criar'} Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;