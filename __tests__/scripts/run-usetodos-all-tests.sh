#!/bin/bash

# Executa todos os testes do hook useTodos
echo "Executando todos os testes do hook useTodos..."
npm test __tests__/hooks/useTodos.failing.test.js __tests__/hooks/useTodos.passing.test.js 2>&1 | tee -a __tests__/logs/usetodos-all-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/usetodos-all-tests.log" 