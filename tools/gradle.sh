#!/bin/sh
# Corre o Gradle do projeto Android com um Java 21 (exigido pelo Capacitor 8).
# Procura: JAVA_HOME atual (se for 21), Java 21 instalado no sistema, ou o que o Gradle descarregou.
set -e
is21() { [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | head -1 | grep -q '"21'; }
if [ -n "$JAVA_HOME" ] && is21 "$JAVA_HOME"; then J="$JAVA_HOME"
elif J=$(/usr/libexec/java_home -v 21 2>/dev/null) && is21 "$J"; then :
else J=$(find "$HOME/.gradle/jdks" -maxdepth 4 -type d -path '*21*' -name Home 2>/dev/null | head -1)
fi
if [ -z "$J" ]; then
  echo "Não encontrei o Java 21. Instala-o (ex.: brew install --cask zulu@21) e tenta de novo." >&2
  exit 1
fi
cd "$(dirname "$0")/../android"
JAVA_HOME="$J" ./gradlew "$@"
