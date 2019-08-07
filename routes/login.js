// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;

// Inicializar variables
var app = express();
var Usuario = require('../models/usuario');

// Google
const { OAuth2Client } = require('google-auth-library');
var CLIENT_ID = require('../config/config').CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Autenticación
var mdAutenticacion = require('../middlewares/autenticacion');

// ==========================================
//  Remieva Token
// ==========================================
app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {

  var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas

  res.status(200).json({
      ok: true,
      token: token
  });

});


// =================================
// Autenticación de Google
// =================================
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });

  const payload = ticket.getPayload();
  // const userid = payload['sub'];
  // If request specified a G Suite domain:
  //const domain = payload['hd'];
  return {
    nombre: payload.name,
    correo: payload.email,
    img: payload.picture,
    google: true
  };
}
app.post('/google', async (req, res) => {
  var token = req.body.token;
  var googleUser = await verify(token).catch(e => {
    res.status(403).json({
      ok: false,
      mensaje: 'Token invalido'
    });
  });

  Usuario.findOne({ correo: googleUser.correo }, (err, usuarioBD) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }

    if (usuarioBD) {
      if (usuarioBD.google === false) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Debe de usar su autenticación normal'
        });
      } else {
        var token = jwt.sign({ usuario: usuarioBD }, SEED, {
          expiresIn: 14400
        });

        res.status(200).json({
          ok: true,
          usuario: usuarioBD,
          token: token,
          id: usuarioBD._id,
          menu: obetnerMenu(usuarioBD.role)
        });
      }
    } else {
      // El usuario no existe ... hay que crearlo
      var usuario = new Usuario();
      usuario.nombre = googleUser.nombre;
      usuario.correo = googleUser.correo;
      usuario.img = googleUser.img;
      usuario.google = true;
      usuario.password = ':)';

      usuario.save((err, usuarioDB) => {
        var token = jwt.sign({ usuario: usuarioDB }, SEED, {
          expiresIn: 14400
        });

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB._id,
          menu: obetnerMenu(usuarioDB.role)
        });
      });
    }
  });
});

// =================================
// Autenticación normal
// =================================
app.post('/', (req, res) => {
  var body = req.body;

  Usuario.findOne({ correo: body.correo }, (err, usuarioDB) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }

    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - correo',
        errors: err
      });
    }

    if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - password',
        errors: err
      });
    }

    // Crear un token
    usuarioDB.password = ':)';
    var token = jwt.sign({ usuario: usuarioDB }, SEED, {
      expiresIn: 14400
    });

    res.status(200).json({
      ok: true,
      usuario: usuarioDB,
      token: token,
      id: usuarioDB._id,
      menu: obetnerMenu(usuarioDB.role)
    });
  });
});

function obetnerMenu(ROLE) {
  var menu = [
    {
      title: 'Principal',
      icon: 'mdi mdi-gauge',
      submenu: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'ProgressBar', url: '/progress' },
        { title: 'Gráficas', url: '/graficas1' },
        { title: 'Promesas', url: '/promesas' },
        { title: 'rxjs', url: '/rxjs' }
      ]
    },
    {
      title: 'Mantenimientos',
      icon: 'mdi mdi-folder-lock-open',
      submenu: [
        { title: 'Hospitales', url: '/hospitales' },
        { title: 'Médicos', url: '/medicos' }
      ]
    }
  ];

  if (ROLE === 'ADMIN_ROLE') {
    menu[1].submenu.unshift({ title: 'Usuarios', url: '/usuarios' });
  }

  return menu;
}

module.exports = app;
