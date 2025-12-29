import express from 'express';

import persons from '../routes/persons.js';
import accounts from '../routes/accounts.js';

export default function (app){
  app.use(express.json());  
    
  app.use('/api/persons', persons);
  app.use('/api/accounts', accounts);
}