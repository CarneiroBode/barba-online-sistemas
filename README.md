# Sistema de Agendamentos Online

Sistema de agendamentos online desenvolvido para profissionais e empresas gerenciarem seus agendamentos de forma eficiente.

## Funcionalidades

- Gerenciamento de empresas e profissionais
- Cadastro de serviços com preços e durações
- Agendamento online via WhatsApp
- Painel administrativo completo
- Controle de horários de funcionamento
- Histórico de atendimentos

## Tecnologias Utilizadas

- React + TypeScript
- Supabase (Banco de dados e autenticação)
- TailwindCSS
- Shadcn/ui

## Como Executar Localmente

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd barba-online-sistemas
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute o projeto:
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas:

- companies: Informações das empresas
- services: Serviços oferecidos
- appointments: Agendamentos
- business_hours: Horários de funcionamento
- url_validations: Validação de URLs de acesso
- client_company_interactions: Histórico de interações

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
