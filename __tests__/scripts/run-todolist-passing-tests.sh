#!/bin/bash

# Executa os testes do TodoList que passam e salva o output
echo "Executando testes do TodoList que passam..."
npm test __tests__/components/TodoList.passing.test.js > __tests__/logs/todolist-passing-tests.log

# Mostra o resultado
echo "Testes concluídos. Verifique o arquivo __tests__/logs/todolist-passing-tests.log" 