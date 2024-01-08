var express = require('express');
var router = express.Router();
const session = require('express-session');
const mysql = require('mysql2/promise');
// const mysql = require('mysql');
const pool =  mysql.createPool({
  /*
 host: '119.59.96.62',
  user: 'drchanon',
  password: 'nonahcrd123',
  database: 'LAB_DB'
  */
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'projectjop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

router.get('/', (req, res) => {
  res.render('index', { db: pool });
});

router.post('/viewadmin2', async (req, res) => {
  try {        
    const [branchResult] = await pool.query(`SELECT * FROM branch`);

    const [cityBranchResult] = await pool.query(`SELECT * FROM city_branch`);
    
    res.status(200).json({ 'success': true, all_branch: branchResult });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
});

module.exports = router;
