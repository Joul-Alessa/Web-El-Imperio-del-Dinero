import express from 'express';

import persons from '../routes/persons.js'; // personas
import types from '../routes/types.js'; // tipos
import accounts from '../routes/accounts.js'; // cuentas
//movimientos

export default function (app){
  app.use(express.json());  
    
  app.use('/api/persons', persons);
  app.use('/api/types', types);
  app.use('/api/accounts', accounts);
}