#!/bin/bash

# Executa os testes do hook useTodos que falham
echo "Executando testes do hook useTodos que falham..."
npm test __tests__/hooks/useTodos.failing.test.js 2>&1 | tee -a __tests__/logs/usetodos-failing-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/usetodos-failing-tests.log" 