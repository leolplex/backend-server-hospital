// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();
var Usuario = require('../models/usuario');

// ================================
// Obetener todos los usuarios
// ================================

app.get('/', function(req, res, next) {
  var desde = req.query.desde || 0;
  desde = Number(desde);

  Usuario.find({}, 'nombre correo img role google')
    .skip(desde)
    .limit(5)
    .exec((err, usuarios) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error cargando usuario',
          errors: err
        });
      }

      Usuario.count({}, (err, conteo) => {
        res.status(200).json({
          ok: true,
          usuarios: usuarios,
          total: conteo
        });
      });
    });
});

// ================================
// Actualizar usuario
// ================================

app.put(
  '/:id',
  [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole],
  (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al buscar usuario',
          errors: err
        });
      }

      if (!usuario) {
        return res.status(400).json({
          ok: false,
          mensaje: 'El usuario con el id ' + id + ' no existe',
          errors: { message: 'No existe un usuario con ese ID' }
        });
      }

      usuario.nombre = body.nombre;
      usuario.correo = body.correo;
      usuario.role = body.role;

      usuario.save((err, usuarioGuardado) => {
        if (err) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Error al actualizar usuario',
            errors: err
          });
        }
        usuario.password = ':)';
        res.status(200).json({
          ok: true,
          usuario: usuarioGuardado
        });
      });
    });
  }
);

// ================================
// Crear un nuevo usuario
// ================================

app.post('/', (req, res) => {
  var body = req.body;

  var usuario = new Usuario({
    nombre: body.nombre,
    correo: body.correo,
    password: bcrypt.hashSync(body.password, 10),
    img: body.img,
    role: body.role
  });

  usuario.save((err, usuarioGuardado) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Error al crear usuario',
        errors: err
      });
    }

    res.status(201).json({
      ok: true,
      usuario: usuarioGuardado,
      usuariotoken: req.usuario
    });
  });
});

// ================================
// Eliminar usuario
// ================================

app.delete(
  '/:id',
  [mdAutenticacion.verificaToken, mdAutenticacion.verificaAdminRole],
  (req, res) => {
    var id = req.params.id;
    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          mensaje: 'Error al borrar usuario',
          errors: err
        });
      }

      if (!usuarioBorrado) {
        return res.status(400).json({
          ok: false,
          mensaje: 'No existe un usuario con ese id',
          errors: { message: 'No existe un usuario con ese id' }
        });
      }

      res.status(200).json({
        ok: true,
        usuario: usuarioBorrado
      });
    });
  }
);

module.exports = app;
