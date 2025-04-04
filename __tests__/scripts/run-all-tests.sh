#!/bin/bash

# Executa todos os testes do projeto e salva o output
echo "Executando todos os testes do projeto..."
npm test > __tests__/logs/all-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/all-tests.log" 