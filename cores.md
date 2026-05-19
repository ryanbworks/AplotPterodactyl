🎨 AplotCloud - Design System & UI/UX Guidelines

Bem-vindo ao manual oficial de Interface de Utilizador (UI) e Experiência de Utilizador (UX) da AplotCloud. Este documento serve como a única fonte de verdade para a criação de novos ecrãs, componentes e interações dentro do painel (Cliente e Admin).

1. Filosofia de Design (Conceitos Core)

A AplotCloud utiliza um design focado no estilo Dark Mode Premium combinado com Glassmorphism (Efeito Vidro).

Imersão: O fundo não é cinza morto, é um preto profundo com "luzes de neon" (Glow Effects) desfocadas ao fundo, dando a sensação de um hardware gamer ou sala de servidores escura com LEDs.

Elevação (3D): Os elementos interativos "flutuam" quando o rato passa por cima (Hover), e projetam sombras coloridas (Neon Drop Shadows).

Bento Grid: Os layouts não são apenas listas longas; a informação é dividida em blocos (cartões) perfeitamente alinhados, como uma grelha Bento japonesa.

2. Paleta de Cores (Tailwind CSS)

Não usamos cores customizadas no CSS bruto (exceto o fundo absoluto). Toda a paleta deriva do Tailwind, garantindo escalabilidade.

2.1. Fundo e Superfícies (Base)

Background Absoluto (O "Void"): bg-[#050505] (Obrigatório em todas as páginas na root div).

Superfície Principal (Cards): bg-zinc-900/50 ou bg-zinc-900/40 combinado com backdrop-blur-xl.

Superfície Secundária (Inputs, Dropdowns, Cards internos): bg-[#050505], bg-zinc-950 ou bg-zinc-950/50.

Bordas: Para separar elementos no modo escuro, usamos linhas finas e discretas: border-zinc-800/50 ou border-zinc-800.

2.2. Cores Semânticas e de Marca

Cor Principal (Marca/Sucesso/Online): Verde Esmeralda Neon (green-500). Usado no logotipo, botões de ação principal, status "Online" e sucesso.

Cor de Informação/Infraestrutura: Azul ou Ciano (blue-400, blue-500, cyan-400). Usado para páginas de servidores, rede, ou links acionáveis.

Cor de Atenção/Pendente: Âmbar/Laranja (amber-500). Usado para faturas pendentes, servidores em manutenção, tickets abertos.

Cor de Perigo/Erro/Offline: Vermelho (red-500). Usado para ações destrutivas (apagar), servidores offline ou chargebacks.

Cor VIP/Analítica: Roxo/Violeta (purple-400, purple-500). Usado em dashboards administrativos, áreas exclusivas ou gestão de staff.

3. Tipografia e Texto

A fonte padrão é a font-sans do sistema (Inter/Roboto/San Francisco). A hierarquia visual é criada estritamente por peso e cor, não por dezenas de tamanhos diferentes.

Títulos de Página (H1): text-3xl sm:text-4xl font-bold text-white.

Subtítulos de Página: text-sm sm:text-base text-zinc-500 mt-2.

Títulos de Cartões (Headers): text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2.

Texto Base (Corpo): text-sm text-zinc-300 ou text-xs text-zinc-400.

Labels (Cabeçalhos de tabela, rótulos de input): text-[10px] font-bold text-zinc-500 uppercase tracking-widest. (Sempre em uppercase e muito espaçado).

Dados Técnicos (IPs, IDs, Recursos, Códigos): font-mono tracking-wider (Dá o aspeto técnico e de programação).

4. Efeitos Especiais (Glow e Glassmorphism)

O "Efeito Uau" da AplotCloud vem destes padrões de CSS:

4.1. Ambient Glow (Fundo da Página)

Sempre colocados no topo do ficheiro, antes do conteúdo. Eles criam as luzes de fundo.

{/* Exemplo de Glow Verde e Azul */}
<div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[150px] pointer-events-none" />
<div className="fixed bottom-[-10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />


4.2. Hover Glow (Efeito Interativo em Botões e Cards)

Quando uma ação é importante, o hover projeta uma sombra neon.

hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] (Sombra verde).

Junto com um pequeno salto: transition-all duration-300 hover:-translate-y-1.

5. Estrutura de Layout e Grids

Toda a página obedece à mesma grelha matemática.

Wrapper Global: <div className="flex-1 w-full max-w-[1600px] mx-auto relative z-10 flex flex-col">

Header: Div no topo separada do conteúdo principal, muitas vezes com um botão de ação à direita.

Métricas (Top Cards): Grelha no topo, geralmente grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6.

Layout Assymétrico (Corpo): grid grid-cols-1 lg:grid-cols-4 gap-6.

Coluna Esquerda/Principal: lg:col-span-3 (Tabelas, Gráficos, Listas grandes).

Coluna Direita (Sidebar): lg:col-span-1 flex flex-col gap-6 (Ações rápidas, menu lateral, insights dinâmicos).

6. Componentes Core (Snippets de Tailwind)

Sempre que a IA for criar um componente, deve colar estas classes exatas.

6.1. O Cartão Padrão (Glass Card)

O bloco de construção básico para agrupar conteúdo.

<div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-xl flex flex-col">
    {/* Conteúdo */}
</div>


6.2. Botões (Buttons)

Botão Primário (Verde Aplot):

<button className="px-4 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 text-sm font-bold flex items-center justify-center gap-2">
  <IconName size={16} /> Texto
</button>


Botão Secundário (Fantasma / Outline):

<button className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all text-sm font-medium flex items-center gap-2">
  <IconName size={16} /> Texto
</button>


6.3. Status Badges (Pílulas de Status)

Usadas em tabelas para indicar se algo está pago, pendente, online, etc.

{/* Variante Sucesso (Verde) */}
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border-green-500/20">
  <CheckCircle2 size={12} /> Online
</span>

{/* Variante Alerta (Âmbar) */}
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border-amber-500/20">
  <Clock size={12} /> Pendente
</span>


6.4. Inputs de Formulário e Pesquisa

Campos de texto escuros, bordas que brilham ligeiramente no focus.

<div className="relative">
  <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
  <input 
    type="text" 
    className="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-zinc-600"
    placeholder="Escreva algo..."
  />
</div>


6.5. Tabelas (Data Tables)

Wrap: div com overflow-x-auto custom-scrollbar.

Tabela: table className="w-full text-left border-collapse min-w-[900px]"

Head (th): bg-zinc-950/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50.

Body (tr): hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/40.

7. Ícones (Lucide React)

A AplotCloud utiliza EXCLUSIVAMENTE a biblioteca lucide-react.

Tamanho Padrão para inline text/botões: size={14} ou size={16}.

Tamanho para destaque em cartões/listas: size={18} ou size={20}.

Nunca utilize SVGs soltos se houver um ícone equivalente no Lucide.

8. Elementos de Interação (UX)

Dropdows Ocultos (Opções de Tabela): Usamos ícones de 3 pontinhos (<MoreVertical size={16} />) nas tabelas. Ao clicar, um menu flutuante (absolute) de cor #050505 com animação abre-se, exibindo ações (Editar, Apagar).

Empty States (Zonas Vazias): Quando não há dados numa tabela, NUNCA deixe um buraco negro. Exiba uma div centralizada com p-12 text-center, um ícone desbotado gigante (size={32} text-zinc-700), e um texto "Nenhum resultado encontrado."

Seletores de Abas (Pills): Para filtros rápidos (ex: "Todos", "Online", "Offline"), usamos botões agrupados numa div com p-1 bg-zinc-950/50 rounded-lg. O botão ativo recebe bg-zinc-800 text-white shadow-sm.