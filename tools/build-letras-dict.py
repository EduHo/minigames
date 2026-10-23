# Constrói o dicionário da Letras Soltas a partir de:
#  - lista de frequências de legendas em português europeu (FrequencyWords, CC-BY-SA 4.0)
#  - corretor ortográfico pt-PT (Hunspell, Projeto Natura / LibreOffice, GPL/LGPL/MPL), só para verificar
# Fica cada palavra comum, de 3 a 8 letras, que o corretor aceita (raiz + regras de sufixo/prefixo).
# Uso:
#   mkdir -p /tmp/dic/freq /tmp/dic/npm
#   curl -L -o /tmp/dic/freq/pt_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt
#   (cd /tmp/dic/npm && npm init -y && npm install --ignore-scripts dictionary-pt-pt@2.0.0)
#   python3 -I tools/build-letras-dict.py /tmp/dic www/data/palavras-pt.txt
import re, sys, unicodedata
dl, out = sys.argv[1], sys.argv[2]
base = dl + '/npm/node_modules/dictionary-pt-pt/'

sfx, pfx = {}, {}
for line in open(base + 'index.aff', encoding='utf-8'):
    p = line.split()
    if len(p) >= 5 and p[0] in ('SFX', 'PFX') and p[2] not in ('Y', 'N'):
        kind, flag, strip, add, cond = p[0], p[1], p[2], p[3], p[4]
        strip = '' if strip == '0' else strip
        add = add.split('/')[0]
        add = '' if add == '0' else add
        rx = re.compile((cond + '$') if kind == 'SFX' else ('^' + cond)) if cond != '.' else None
        (sfx if kind == 'SFX' else pfx).setdefault(flag, []).append((strip, add, rx))

stems, proper = {}, set()
for line in open(base + 'index.dic', encoding='utf-8'):
    line = line.rstrip('\n')
    if not line or line[0].isdigit():
        continue
    head, _, morph = line.partition('\t')
    word, _, flags = head.partition('/')
    if 'CAT=np' in morph or not word.islower():   # nomes próprios ficam de fora
        proper.add(word.lower())
        continue
    stems.setdefault(word, set()).update(flags)

proper -= set(stems)   # só fica de fora o que existe apenas como nome próprio

def has(stem, flag):
    return stem in stems and flag in stems[stem]

def by_suffix(w):
    for flag, rules in sfx.items():
        for strip, add, rx in rules:
            if add and not w.endswith(add):
                continue
            stem = (w[:len(w) - len(add)] if add else w) + strip
            if stem and has(stem, flag) and (rx is None or rx.search(stem)):
                return True
    return False

def correct(w):
    if w in stems:
        return True
    if by_suffix(w):
        return True
    for flag, rules in pfx.items():
        for strip, add, rx in rules:
            if add and w.startswith(add):
                stem = strip + w[len(add):]
                if has(stem, flag) and (rx is None or rx.search(stem)):
                    return True
    return False

BLOCK = set('''caralho merda foda foder fodido fodida fodam fodes fodeu fode puta putas puto putos cona conas porra cabrão piça pila pilas cagar caga cagou mijar mija broche paneleiro panasca bicha maricas cornudo corno badalhoca otário otária idiota imbecil estúpido estúpida cretino retardado nazi nazis droga drogas cocaína heroína bêbedo matar mata matei matou morto mortos morta mortas morte mortes assassino assassina suicídio sexo sexy tesão orgasmo pénis vagina mamas seios prostituta violar violação arma armas pistola bala balas tiro tiros sangue cadáver diabo inferno deus rameira rameiras vadia vadias chulo chulos ordinária ordinário nojento nojenta parvo parva palerma anormal aleijado gordo gorda feio feia gay gays lésbica preta pretos cigano ciganos macaco macacos'''.split())
plain = lambda w: ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn').upper()
ok = re.compile('^[a-záàâãéêíóôõúç]{3,8}$')

seen, lines, lens = set(), [], {}
checked = 0
for row in open(dl + '/freq/pt_50k.txt', encoding='utf-8'):
    parts = row.split()
    if len(parts) != 2:
        continue
    w = parts[0]
    if not ok.match(w) or w in BLOCK or w in proper:
        continue
    checked += 1
    p = plain(w)
    if p in seen or not re.fullmatch('[A-Z]+', p) or not correct(w):
        continue
    seen.add(p)
    lines.append(p if p == w.upper() else f'{p}:{w}')
    lens[len(p)] = lens.get(len(p), 0) + 1
open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('verificadas', checked, 'aceites', len(lines), dict(sorted(lens.items())))
print('primeiras:', ' '.join(l.split(':')[-1] for l in lines[:40]))
print('meio:', ' '.join(l.split(':')[-1] for l in lines[8000:8030]))
print('últimas:', ' '.join(l.split(':')[-1] for l in lines[-30:]))
