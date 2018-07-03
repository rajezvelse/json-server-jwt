// server.js
const source = 'db.json';
const jsonServer = require('json-server');
const fs = require('fs-extra');
const low = require('lowdb');
const fileAsync = require('lowdb/lib/storages/file-async');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var appSecretKey = "V*R@!c<}6$ZSpRRz(|N`QqdsdDDPCl";

var anonymousUrls = [
  "/db",
  "/__rules",
  "/api-token-auth",
  "/api-token-refresh",
  "/api-password-reset",
  "/api-password-reset-verify",
  "/api-password-reset-confirm"
];

const server = jsonServer.create();
const router = jsonServer.router(source);
const middlewares = [
  jsonServer.defaults({
    noCors: true
  }),
  [
    (req, res, next) => fs
      .readJson(source)
      .then(contents => {
        router.db.assign(contents).write();
        next();
      })
  ]
];


var randomStr = function (length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares)
// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser)

/*          DB defaults
----------------------------------------------------*/
// Set some defaults (required if your JSON file is empty)
var db = low(source, { storage: fileAsync });
db.defaults({ users: [], roles: [], password_reset_tokens: [], user_settings: [] })
  .write()


// Middleware actions
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  //intercepts OPTIONS method
  if ('OPTIONS' === req.method) {
    //respond with 200
    res.send(200);
  }

  /*             Autorization check
  -------------------------------------------------------*/
  // Allowing anonymous urls
  if (anonymousUrls.indexOf(req.url) >= 0 || req.url.substring(0, 7) == "/assets") {
    return next();
  }

  var token = req.headers['authorization'];
  if (!token) {
    res.sendStatus(401).send('Unauthorized')
  }

  token = token.replace('Barear ', '');

  jwt.verify(token, appSecretKey, function (err, decoded) {
    if (err)
      return res.status(500).send({ auth: false, message: 'Invalid token' });
    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
  });


  /*             Auto insert fields
-------------------------------------------------------*/
  if (req.method === 'POST') {

    req.body.createdAt = Date.now();
    req.body.updatedAt = Date.now();
    req.body.createdBy = req.userId;
    req.body.updatedBy = req.userId;

  } else if (req.method === 'PUT') {

    req.body.updatedAt = Date.now();
    req.body.updatedBy = req.userId;

  }
  // Continue to JSON Server router
  next()

})

/*             Authenticaton
-------------------------------------------------------*/
server.post('/api-token-auth', (req, res) => {

  var data = req.body;
  console.log("Authentication requested : ", data);

  if (!data.email || !data.email) {
    console.log("Authentication failed");
    return res.status(500).send('Email or password not provided');
  }


  var user = db.get('users')
    .filter(user => user.username === data.email || user.email === data.email)
    .value();

  if (user.length === 0) {
    console.log("Authentication failed");
    return res.status(500).send('User does not exists');
  }

  user = user[0];
  
  if(user.password !== data.password) {
    console.log("Authentication failed");
    return res.status(500).send('Invalid credentials');
  }

  console.log("Authentication succeeded");
  // create a token
  var token = jwt.sign({ id: user.id }, appSecretKey, {
    expiresIn: 86400 // expires in 24 hours
  });

  var user_settings = db.get('user_settings')
    .find({ user_id: user.id })
    .value() || {};

  res.status(200).send({ auth: true, token: token, user: user, user_settings: user_settings });

});


/*             Token refresh
-------------------------------------------------------*/
server.get('/api-token-refresh', (req, res) => {

  var token = req.headers['authorization'];
  token = token.replace('Barear ', '');

  jwt.verify(token, appSecretKey, function (err, decoded) {
    if (err)
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token' });

    // create new token
    var token = jwt.sign({ id: decoded.id }, appSecretKey, {
      expiresIn: 86400 // expires in 24 hours
    });


    var user = db.get('users')
      .find({ id: decoded.id })
      .value()

    var user_settings = db.get('user_settings')
      .find({ user_id: user.id })
      .value() || {};

    res.status(200).send({ auth: true, token: token, user: user, user_settings: user_settings });
  });

})


/*             User registration
-------------------------------------------------------*/
server.post('/users', (req, res, next) => {

  req.body.password = randomStr(8);

  console.log('' +
    '========================================\n' +
    ' New user registration                  \n' +
    ' username: ' + req.body.username + '      \n' +
    ' password: ' + req.body.password + '      \n' +
    '========================================\n' +
    +'');

  return next();

})

/*            Change password 
-------------------------------------------------------*/
server.post('/users/change-password', (req, res) => {


  var user = db.get('users')
    .find({ id: req.userId }).value();

  if (user.password !== req.body.password)
    return res.status(500).send("Invalid password");

  db.get('users')
    .find({ id: req.userId })
    .assign({ password: req.body.new_password })
    .write()
    .then(() => {
      console.log('' +
        '========================================\n' +
        ' User password changed                  \n' +
        '========================================\n' +
        +'');
    });

  res.status(200).send("Password changed");

})

/*            Reset password reset 
-------------------------------------------------------*/
server.post('/api-password-reset', (req, res) => {

  var email = req.body.email;


  var user = db.get('users')
    .filter(user => user.username === email || user.email === email)
    .value();

  if (user.length == 0) {
    return res.status(500).send('User does not exists');
  }

  user = user[0];
  var token = randomStr(30);
  db.get('password_reset_tokens')
    .push({
      user_id: user.id,
      token: token
    })
    .write();

  console.log('' +
    '========================================\n' +
    ' User password reset                    \n' +
    ' token: ' + token + '                   \n' +
    '========================================\n' +
    +'');

  res.status(200).send({ token: token });
})

/*            Reset password reset verify
-------------------------------------------------------*/
server.post('/api-password-reset-verify', (req, res) => {



  var token = db.get('password_reset_tokens')
    .find({ token: req.body.token })
    .value();

  if (!token)
    return res.status(500).send("Invalid token");

  res.status(200).send('OK');
})

/*            Reset password reset confirm
-------------------------------------------------------*/
server.post('/api-password-reset-confirm', (req, res) => {



  var token = db.get('password_reset_tokens')
    .find({ token: req.body.token })
    .value();

  if (!token)
    return res.status(500).send("Invalid token");

  db.get('users')
    .find({ id: token.user_id })
    .assign({ password: req.body.new_password })
    .write()
    .then(() => {
      db.get('password_reset_tokens')
        .remove({ user_id: token.user_id }).write();

      console.log('' +
        '========================================\n' +
        ' User password reset success            \n' +
        '========================================\n' +
        +'');
    });

  res.status(200).send("Password reset success");
})

// Start server
server.use(router)
server.listen(3000, () => {
  console.log('\n\n' +
    '      _  _____  ____  _   _                                         \n' +
    '     | |/ ____|/ __ \\| \\ | |                                      \n' +
    '     | | (___ | |  | |  \\| |  ___  ___ _ ____   _____ _ __         \n' +
    ' _   | |\\___ \\| |  | | . ` | / __|/ _ | \'__\\ \\ / / _ | \'__|   \n' +
    '| |__| |____) | |__| | |\\  | \\__ |  __| |   \\ V |  __| |         \n' +
    ' \\____/|_____/ \\____/|_| \\_| |___/\\___|_|    \\_/ \\___|_|      \n\n\n' +
    +'');
})
