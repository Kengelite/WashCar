const admin = require('firebase-admin');

const serviceAccount = require('./projectjop-86653-firebase-adminsdk-riay7-b1a0545395.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://projectjop-86653-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db_fb = admin.database();