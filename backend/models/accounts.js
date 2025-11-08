// Dependencias
//const Joi = require('joi').extend(require('@joi/date'));
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Definición del esquema
const product = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    grandfatherCategory: { type: String, required: true },
    fatherCategory: { type: String, required: true },
    sonCategory: { type: String, required: true },
    //image: { type: String, required: true }, // Se ve útil: https://www.youtube.com/watch?v=GyzC-30Bqfc
    inventory: { type: Number, required: true }
});

const Product = mongoose.model('Product',product);

// Función para validar los requisitos planteados
function validateProduct(product){
    const schema = Joi.object({
        name: Joi.string().max(100).required(),
        description: Joi.string().max(250).required(),
        brand: Joi.string().max(100).required(),
        grandfatherCategory: Joi.string().max(100).valid('dummy1','dummy2').required(), // Cambiar los valores de valid cuando se tengan
        fatherCategory: Joi.string().max(100).valid('dummy1','dummy2').required(), // Cambiar los valores de valid cuando se tengan
        sonCategory: Joi.string().max(100).valid('dummy1','dummy2').required(), // Cambiar los valores de valid cuando se tengan
        //image: Joi.string().max(100).required(), // Es necesario ver cómo se trabajará con imágenes para ver cómo validar este campo
        inventory: Joi.number().required()
    });
    return schema.validate(product);
}

module.exports.Product = Product;
module.exports.validateProduct = validateProduct;