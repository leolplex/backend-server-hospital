// Requires
var express = require('express');
// Inicializar variables
var app = express();

app.get('/', function(req, res) {
  res.status(200).json({
    ok: true,
    mensaje: 'Petición realizada correctamente'
  });
});

module.exports = app;
