import express from 'express';

import persons from '../routes/persons.routes.js';

export default function (app){

    app.use(express.json());  
     
    app.use('/api/persons', persons);
}