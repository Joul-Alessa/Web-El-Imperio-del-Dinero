const {Product, validateProduct} = require('../models/accounts');
//const Joi = require('joi');

module.exports = {
    create: async function(req, res)
    {
        try
        {
            // Validación de formato
            const validation = validateProduct(req.body);
            if(validation.error)
            {
                console.log("Error 400 (Bad Request): " + validation.error);
                res.status(400).send(validation.error);
            }

            // Creación del objeto a guardar
            var product = new Product({
                name: req.body.name,
                description: req.body.description,
                brand: req.body.brand,
                grandfatherCategory: req.body.grandfatherCategory,
                fatherCategory: req.body.fatherCategory,
                sonCategory: req.body.sonCategory,
                //image: req.body.image, //Descomentar aquí y en models otras dos líneas de image cuando el multer esté cargado
                inventory: req.body.inventory,
            });
            await product.save();

            res.send(product);
        }
        catch(error)
        {
            console.log("Error: " + error);
            res.status(500).send(error);
        }
    }//,
    /*show: async function(req, res)
    {
        try
        {
            const products = await Product.find();
            if(products.length > 0)
            {
                res.send(products);
            }
            else
            {
                res.status(404).send("Sin productos agregados");
            }
        }
        catch(error)
        {
            console.log("Error: " + error);
            res.status(500).send(error);
        }
    },
    showOne: async function(req, res)
    {
        try
        {
            var product = await Product.findById(req.params.id);
            
            if (!product)
            {
                return res.status(404).send("Producto no encontrado.");
            }
            res.send(product);
        }
        catch(error)
        {
            console.log("Error: " + error);
            res.status(500).send(error);
        }
    },
    update: async function(req, res)
    {
        try
        {
            // Validación de formato
            const validation = validateProduct(req.body);
            if(validation.error)
            {
                console.log("Error 400 (Bad Request): " + validation.error);
                res.status(400).send(validation.error);
            }

            // Búsqueda de la tupla
            var product = await Product.findById(req.params.id);
            
            if (!product)
            {
                return res.status(404).send("Producto no encontrado.");
            }
            else
            {
                // Actualización de la tupla
                var product = await Product.updateOne({ _id: req.params.id },
                    {
                        name: req.body.name,
                        description: req.body.description,
                        brand: req.body.brand,
                        grandfatherCategory: req.body.grandfatherCategory,
                        fatherCategory: req.body.fatherCategory,
                        sonCategory: req.body.sonCategory,
                        //image: req.body.image, //Descomentar aquí y en models otras dos líneas de image cuando el multer esté cargado
                        inventory: req.body.inventory,
                    });

                product = await Product.findById(req.params.id);
                res.send(product);
            }
        }
        catch(error)
        {
            console.log("Error: " + error);
            res.status(500).send(error);
        }
    },
    remove: async function(req, res)
    {
        try
        {
            var product = await Product.findByIdAndRemove(req.params.id);

            if (!product)
            {
                return res.status(404).send("Producto no encontrado.");
            }
            else
            {
                res.send(product);
            }
        }
        catch(error)
        {
            console.log("Error: " + error);
            res.status(500).send(error);
        }
    }*/
}