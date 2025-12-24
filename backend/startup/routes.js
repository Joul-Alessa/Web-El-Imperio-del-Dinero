const express = require('express');
const movements = require("../routes/movements");
const accounts = require('../routes/accounts');

module.exports = function (app){

    app.use(express.json());  
     
    app.use("/api/movements", movements);
    app.use('/api/accounts', accounts);
}