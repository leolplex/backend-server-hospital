// Requires
var express = require('express');
// Inicializar variables
var app = express();
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');

// =====================
// Busqueda por colección
// =====================
app.get('/coleccion/:tabla/:busqueda', (req, res) => {
  var tabla = req.params.tabla;
  var busqueda = req.params.busqueda;
  var regex = new RegExp(busqueda, 'i');

  if (tabla === 'medico') {
    buscarMedicos(regex).then(medicos => {
      res.status(200).json({
        ok: true,
        medicos: medicos
      });
    });
  } else if (tabla === 'hospital') {
    buscarHospitales(regex).then(hospitales => {
      res.status(200).json({
        ok: true,
        hospitales: hospitales
      });
    });
  } else if (tabla === 'usuario') {
    buscarUsuarios(regex).then(usuarios => {
      res.status(200).json({
        ok: true,
        usuarios: usuarios
      });
    });
  }
});

// =====================
// Busqueda general
// =====================
app.get('/todo/:busqueda', function(req, res) {
  var busqueda = req.params.busqueda;
  var regex = new RegExp(busqueda, 'i');

  Promise.all([
    buscarHospitales(regex),
    buscarMedicos(regex),
    buscarUsuarios(regex)
  ]).then(respuestas => {
    res.status(200).json({
      ok: true,
      hospitales: respuestas[0],
      medicos: respuestas[1],
      usuarios: respuestas[2]
    });
  });
});

function buscarHospitales(regex) {
  return new Promise((resolve, reject) => {
    Hospital.find({ nombre: regex })
      .populate('usuario', 'nombre correo')
      .exec((err, hospitales) => {
        if (err) {
          reject('Error al cargar hospitales', err);
        } else {
          resolve(hospitales);
        }
      });
  });
}

function buscarMedicos(regex) {
  return new Promise((resolve, reject) => {
    Medico.find({ nombre: regex })
      .populate('usuario', 'nombre correo')
      .populate('hospital')
      .exec((err, medicos) => {
        if (err) {
          reject('Error al cargar medicos', err);
        } else {
          resolve(medicos);
        }
      });
  });
}

function buscarUsuarios(regex) {
  return new Promise((resolve, reject) => {
    Usuario.find({})
      .or([{ nombre: regex }, { correo: regex }])
      .exec((err, usuarios) => {
        if (err) {
          reject('Error al cargar usuarios', err);
        } else {
          resolve(usuarios);
        }
      });
  });
}

module.exports = app;
