#!/bin/bash

# Executa todos os testes do TodoList e salva o output
echo "Executando todos os testes do TodoList..."
npm test __tests__/components/TodoList.*.test.js > __tests__/logs/todolist-all-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/todolist-all-tests.log" 