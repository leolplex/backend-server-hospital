// Requires
var express = require('express');
var mongoose = require('mongoose');

// Inicializar variables
var app = express();

// Conexión a la base de datos
mongoose.connect('mongodb://localhost/hospitalDB', { useNewUrlParser: true });
mongoose.connection.openUri(
  'mongodb://localhost:27017/hospitalDB',
  (err, res) => {
    if (err) throw err;
    
    console.log(
        'Base de datos: \x1b[32m%s\x1b[0m',
        'online'
      );
  }
);

// Rutas
app.get('/', function(req, res) {
  res.status(200).json({
    ok: true,
    mensaje: 'Petición realizada correctamente'
  });
});

// Escuchar peticiones
app.listen(3000, function() {
  console.log(
    'Example app listening on port 3000: \x1b[32m%s\x1b[0m',
    'online'
  );
});
