#!/bin/bash

# Executa os testes do hook useTodos que passam
echo "Executando testes do hook useTodos que passam..."
npm test __tests__/hooks/useTodos.passing.test.js 2>&1 | tee -a __tests__/logs/usetodos-passing-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/usetodos-passing-tests.log" 