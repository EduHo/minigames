// A história do Azulejos: prólogo, chegada e despedida em cada sítio, e o final.
// Cada fala: [quem, texto]. Quem: id de PEOPLE em art.js, ou 'pena'.

export const PROLOGUE = [
  ['rosa', 'Inês, anda cá. Olha o painel da nossa janela... ontem tinha o azul mais bonito da Ribeira Azul.'],
  ['ines', 'Avó, está todo cinzento! E os do miradouro também. O que aconteceu?'],
  ['cinzento', 'Fui eu. Sou um camaleão que já não muda de cor. Se eu não tenho cores, ninguém as terá. As Terras de Azulém inteiras vão ficar cinzentas!'],
  ['rosa', 'O Mestre Cinzento... era o melhor azulejista que conheci. Inês, só uma aprendiz com patas pacientes pode devolver as cores, azulejo a azulejo.'],
  ['pena', 'Piu! Eu sou a Pena. Conheço o caminho da serra às ilhas flutuantes. Eu guio-te!'],
  ['ines', 'Então vamos começar aqui, na Ribeira Azul. Três azulejos iguais de cada vez!'],
];

// Por sítio: chegada (quando o portão abre) e despedida (painel completo).
export const PLACE_SCENES = [
  {
    arrive: [['joaquim', 'Ding-ding! Bem-vinda ao elétrico, menina. Os azulejos do miradouro ficaram cinzentos de um dia para o outro.'], ['ines', 'Eu vou restaurá-los, Sr. Joaquim. Um par de cada vez!']],
    leave: [['joaquim', 'Olha só, o miradouro voltou a ter cor! Até o elétrico ficou mais amarelo.'], ['pena', 'Vi o Mestre Cinzento a fugir para o Bosque da Névoa. Vamos atrás dele!']],
  },
  {
    arrive: [['amelia', 'Cuidado, pequena raposa. A névoa deste bosque embrulha os azulejos como presentes.'], ['amelia', 'Só vês o que está desenhado quando o azulejo fica livre. Paciência e boa memória!']],
    leave: [['amelia', 'O Palácio Encantado brilha outra vez. A névoa até parece mais leve.'], ['pena', 'O Cinzento fechou as portas da Vila Muralhada. Vamos lá!']],
  },
  {
    arrive: [['rui', 'Alto! As portas da muralha estão trancadas com cadeados mágicos.'], ['rui', 'Cada cadeado mostra um desenho. Faz um par desse desenho e a porta abre-se.']],
    leave: [['rui', 'A Porta da Vila nunca esteve tão bonita. Obrigado, Inês!'], ['ines', 'Pena, para onde foi ele agora?'], ['pena', 'Para a Torre dos Mil Livros!']],
  },
  {
    arrive: [['beatriz', 'Olá! Sou a Beatriz. O Cinzento desarrumou a biblioteca toda.'], ['beatriz', 'Os azulejos estão empilhados como os livros: tira sempre o de cima. O número diz quantos faltam.']],
    leave: [['beatriz', 'Encontrei um livro antigo: diz que o Mestre Cinzento perdeu as cores numa noite triste, há muitos anos.'], ['ines', 'Então ele não é mau... está só triste.']],
  },
  {
    arrive: [['ze', 'Croac! É noite de arraial no Vale das Fogueiras!'], ['ze', 'Hoje há fogo-de-artifício nos azulejos! Os que brilham têm super poderes: faz o par e vê o que acontece!']],
    leave: [['ze', 'Sardinhas, manjericos e azulejos coloridos. Isto sim é um arraial!'], ['pena', 'Ouvi dizer que o Cinzento subiu às Encostas do Vinhedo.']],
  },
  {
    arrive: [['graca', 'Méé! As vinhas cresceram por cima dos azulejos do lagar.'], ['graca', 'A hera solta-se quando tirares um azulejo ao lado. Vai com calma.']],
    leave: [['graca', 'Que bonito ficou o Lagar Velho! Leva umas uvas para o caminho.'], ['ines', 'Está a ficar frio, Pena...'], ['pena', 'É a Serra Gelada. Agasalha-te!']],
  },
  {
    arrive: [['tome', 'Au! Cá em cima a neve gela tudo, até os azulejos.'], ['tome', 'Um azulejo congelado não se escolhe. Faz pares ao lado dele para partir o gelo. Eu e o rebanho ajudamos!']],
    leave: [['tome', 'O Cume da Serra está outra vez azul e branco, como deve ser.'], ['cinzento', 'Hmpf. Ainda não ganhaste, raposinha. Na planície vais ver.']],
  },
  {
    arrive: [['luisa', 'Bem-vinda à planície! Do meu ninho no sobreiro vejo tudo.'], ['luisa', 'O Cinzento tapou azulejos com rolhas de cortiça. Saltam sozinhas ao fim de alguns pares; o número diz quantos faltam.']],
    leave: [['luisa', 'O Templo do Sol voltou a brilhar. Vi o Cinzento a ir para a costa, pelas grutas.']],
  },
  {
    arrive: [['marta', 'Olá! Sou a Marta. Aqui na costa, a maré manda em tudo.'], ['marta', 'A maré está a subir! Tira os azulejos com a onda antes de o número chegar a zero.']],
    leave: [['marta', 'A Gruta Dourada está outra vez dourada! O barco do Lourenço leva-te às Ilhas Flutuantes.'], ['pena', 'É lá que está o último painel... e o Mestre Cinzento.']],
  },
  {
    arrive: [['lourenco', 'Devagar se vai ao longe, menina. Sou o Lourenço, e conheço estas ilhas há cem anos.'], ['lourenco', 'O Cinzento usa aqui todos os truques que aprendeste. Lembra-te de tudo!']],
    leave: [],
  },
];

// Final da primeira viagem (ao completar o painel das ilhas).
export const ENDING = [
  ['cinzento', 'Restauraste tudo... todos os painéis que eu apaguei.'],
  ['ines', 'Mestre Cinzento, a Beatriz contou-me. Perdeu as cores numa noite triste.'],
  ['cinzento', 'Desde então não consigo mudar de cor. Pensei que, se ninguém tivesse cores, eu não me sentiria tão sozinho.'],
  ['rosa', 'Velho amigo, as cores não se roubam. Partilham-se. Anda pintar connosco.'],
  ['cinzentoCor', 'Oh! Estou... verde? E amarelo! As minhas cores voltaram!'],
  ['pena', 'Piu! E agora? A Avó Rosa diz que há uma Segunda Viagem, com painéis novos para pintar juntos.'],
  ['ines', 'Vamos! Mais 800 níveis à nossa espera.'],
];

// Lendas do álbum de postais, uma por sítio.
export const POSTCARDS = [
  'Diz-se que o elétrico da Ribeira Azul sobe sozinho a colina nas noites de lua cheia, para ver o rio lá de cima.',
  'No Bosque da Névoa, quem se perde só tem de seguir o cheiro das flores azuis até ao Palácio Encantado.',
  'As sete portas da Vila Muralhada têm sete cadeados, e ninguém se lembra de onde ficaram as chaves.',
  'A Torre dos Mil Livros tem, na verdade, mil e um livros. O último ainda está a ser escrito.',
  'No arraial do Vale das Fogueiras, quem saltar a fogueira com um manjerico na mão terá um ano feliz.',
  'As uvas das Encostas do Vinhedo amadurecem ao som das cantigas das vindimadeiras.',
  'No Cume da Serra Gelada há uma pedra que nunca tem neve. Os pastores dizem que é quente por dentro.',
  'Os sobreiros da planície guardam a cortiça de cem anos, e as cegonhas guardam os segredos do vento.',
  'Na Gruta Dourada, o sol entra uma vez por ano e acende as paredes como ouro.',
  'As Ilhas Flutuantes descem até ao mar uma vez por século, para os barcos as poderem visitar.',
];

// Divisões da toca da Avó Rosa (uma por sítio concluído).
export const ROOMS = ['Cozinha', 'Pátio', 'Fachada', 'Sala', 'Oficina', 'Quarto', 'Escadas', 'Jardim', 'Varanda', 'Torreão'];
