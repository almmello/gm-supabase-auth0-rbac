#!/bin/bash

# Executa os testes do TodoList que falham e salva o output
echo "Executando testes do TodoList que falham..."
npm test __tests__/components/TodoList.failing.test.js > __tests__/logs/todolist-failing-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/todolist-failing-tests.log" 