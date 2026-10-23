# Créditos e licenças de dados

## Letras Soltas — dicionário (`www/data/palavras-pt.txt`)

A lista de palavras do modo livre e da ronda bónus foi gerada por `tools/build-letras-dict.py` a partir de:

- **FrequencyWords** de Hermit Dave — lista de frequências de palavras em português (legendas do OpenSubtitles 2018).
  <https://github.com/hermitdave/FrequencyWords> · licença **CC BY-SA 4.0**.
  Por isso, o ficheiro `www/data/palavras-pt.txt` é distribuído sob a mesma licença, **CC BY-SA 4.0**
  (o resto do código continua sob a licença MIT do projeto).
- **Dicionário ortográfico de português europeu** (Projeto Natura / LibreOffice, pacote `dictionary-pt-pt`).
  Licenças GPL-2.0, LGPL-2.1 ou MPL-1.1. Foi usado **apenas para verificar** a ortografia de cada palavra
  durante a geração; o dicionário em si não faz parte da app.

Filtros aplicados: 3 a 8 letras, só letras portuguesas, aceite pelo corretor pt-PT, sem nomes próprios
e sem palavrões ou palavras ofensivas (lista no próprio programa).

As palavras dos temas (`www/js/games/letras/themes.js`) foram escolhidas à mão para este projeto.
