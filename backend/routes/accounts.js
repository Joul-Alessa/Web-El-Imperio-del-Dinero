// Dependencias
const express = require("express");
const account = require("../controllers/accounts");

// Inicializador del router
const router = express.Router();

// Manejo de rutas
router.route("/")
    .post(account.create)
    .get(account.show);

router.route("/:id")
    .get(account.showOne)
    .put(account.update)
    .delete(account.delete);

module.exports = router;