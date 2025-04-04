#!/bin/bash

# Executa todos os testes de hooks e salva o output
echo "Executando todos os testes de hooks..."
npm test __tests__/hooks/ > __tests__/logs/hooks-all-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/hooks-all-tests.log" 