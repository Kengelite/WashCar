// const express = require('express') //install express: Terminal (ประกาศใช้งาน express)
// const app = express() //เก็บตัว object ไว้ใน ตัวแปร app

// const router = express.Router
var express = require('express');
var router = express.Router();
// const mysql = require('mysql');
const session = require('express-session');
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const serviceAccount = require('./projectjop-86653-firebase-adminsdk-riay7-b1a0545395.json');

// Initialize Firebase with a unique app name
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://projectjop-86653-default-rtdb.asia-southeast1.firebasedatabase.app'
}, 'myUniqueAppName'); // Provide a unique app name here

const db_fb = admin.database();

// const serviceAccount = require('./projectjop-86653-firebase-adminsdk-riay7-b1a0545395.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://projectjop-86653-default-rtdb.asia-southeast1.firebasedatabase.app'
// });

// const db_fb = admin.database();
router.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: false
}));
const db = mysql.createPool({
  host: '119.59.96.62',
  user: 'drchanon',
  password: 'nonahcrd123',
  database: 'LAB_DB',
  port: '3306',
  waitForConnections: true,
  queueLimit: 0
});
let result_state_all_box = [];
let use_car = 0;
let accident_car = 0;
let error_car = 0;
const sessionChecker = (req, res, next) => {

  if (session.id_admin !== undefined) {
    // หากมีค่าตัวแปร session ชื่อ user ให้เรียกฟังก์ชั่น next()
    next();
  } else {
    // หากไม่มีค่าตัวแปร session ให้ render EJS ชื่อ login
    res.render('pages/login');
  }
};
async function data_car_all(result_carwash) {
  for (const value of result_carwash) {
    console.log(value["car_name"]);
    const ref_foam = db_fb.ref("/" + value["car_name"].toString() + '/state_foam');
    const ref_water = db_fb.ref("/" + value["car_name"].toString() + '/state_water');

    try {
      const [foamSnapshot, waterSnapshot] = await Promise.all([
        ref_foam.once('value'),
        ref_water.once('value')
      ]);
      const data_ref_foam = foamSnapshot.val() || 0;
      const data_ref_water = waterSnapshot.val() || 0;

      console.log("Foam:", data_ref_foam);
      console.log("Water:", data_ref_water);

      if (data_ref_foam == 1 && data_ref_water == 1) {
        result_state_all_box.push({ car_box: 1 ,id_box_car : value["idcar_wash"],id_box_car_status : value["status"],id_box_branch : value["branch_id"],id_box_car_status_detail : value["status_detail"]});
        // console.log("Added to result_state_all_box");
        use_car += 1;
      } else {

        result_state_all_box.push({ car_box: 0 ,id_box_car : value["idcar_wash"],id_box_car_status : value["status"],id_box_branch : value["branch_id"],id_box_car_status_detail : value["status_detail"]});
        // console.log("Not added to result_state_all_box");
        accident_car += 1;
      }
     
    } catch (error) {
      // console.error("Error fetching data:", error);
    }
  }
  console.log(result_state_all_box)
  // console.log(result_state_all_box);
  // console.log("Use Car Count:", use_car);
  // console.log("Accident Car Count:", accident_car);
  // console.log("Error Car Count:", error_car);
}

//dashboard
router.get('/index', sessionChecker, async (req, res) => {
  try {
    if (session.branch == 0) {
      const [result] = await db.query(`SELECT count(*) as total_car FROM car_wash  where delete_time IS NULL`);
      const [result_price] = await db.query(`SELECT sum(price) as total_price FROM use_car_wash  where delete_time IS NULL`);
      const [result_pricemonth] = await db.query(`SELECT sum(price) as total_pricemonth FROM use_car_wash  
    join car_wash on use_car_wash.idcar_wash = car_wash.idcar_wash  
    where use_car_wash.delete_time IS NULL   
    and  month(use_car_wash.create_time)	 in 
    (SELECT MONTH(create_time) FROM use_car_wash 
    WHERE  MONTH(create_time) = MONTH(NOW())); `);
      const [result_credit] = await db.query("SELECT credit_point FROM credit ");
      const [result_dataadmin] = await db.query("SELECT * FROM admin  where  idadmin  = ?", [session.id_admin]);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
    FROM car_wash WHERE  status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 and status_detail IS NOT NULL  `);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
    FROM car_wash WHERE  status = 1 and status_water = 1 and status_wind = 1 and status_foam = 1 `);
    const [all_car] = await db.query(`SELECT count(*) as  all_car   
    FROM car_wash WHERE  delete_time IS NULL `,);

      await db.execute('SET @total := 0');
      const [result_chart_use_money] = await db.query(`
          SELECT HOUR(create_time) AS time, sum(price)  as running_total
          FROM use_car_wash 
          WHERE DAY(create_time) = DAY(NOW()) and  MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
          AND delete_time IS NULL
          GROUP BY time
      `);
      // console.log(result_chart_use)
      let data_chart_total_money = [];
      result_chart_use_money.forEach((value) => {
        let txt_time = "";
        if ((value.time).toString().length == 1) {
          txt_time = 0 + (value.time).toString() + ":00"
        } else {
          txt_time = (value.time).toString()
        }
        let arr_value = [txt_time, parseInt(value.running_total)]
        console.log(arr_value)
        data_chart_total_money.push(arr_value)
      });
      console.log(data_chart_total_money)


      const [result_chart_use_group_sql] = await db.query(`
      SELECT   
      count(branch.name_branch) as total_group_wash ,
      branch.name_branch as name 
      FROM  car_wash 
          JOIN branch on car_wash.branch_id = branch.id_branch
    
           group by name
      `);
      const [result_avg_money] = await db.query(` SELECT  avg(price)  as avg_total
      FROM use_car_wash 
      WHERE   MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
      AND delete_time IS NULL`);
      // console.log(result_chart_use)
      let result_chart_use_group = [];
      result_chart_use_group_sql.forEach((value) => {
        let arr_value = [value.name.toString(), parseInt(value.total_group_wash)]
        console.log(arr_value)
        result_chart_use_group.push(arr_value)
      });
      console.log(result_chart_use_group)

      const [result_sum_withdraw] = await db.query(`SELECT sum(total)  as sum_withdraw FROM withdraw_money
    WHERE delete_time IS NULL and status  = 1 `);

      const [result_count_use] = await db.query(` SELECT  count(*)  as total
    FROM use_car_wash 
    WHERE   MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
    AND delete_time IS NULL`);
    result_state_all_box = [];
    use_car = 0;
    accident_car = 0;
    error_car = 0;
    const [result_carwash] = await db.query(`SELECT * FROM car_wash  `, );
    await data_car_all(result_carwash);
      res.render('pages/dashboard', {
        branch: session.branch, data_count_carwash: result,
        result_price: result_price, all_car: all_car,
        result_dataadmin: result_dataadmin, result_pricemonth: result_pricemonth,
        data_use: data_use, data_accident: data_accident,
        result_sum_withdraw: result_sum_withdraw,
        result_avg_money: result_avg_money,
        result_count_use: result_count_use,
        data_chart_total_money: JSON.stringify(data_chart_total_money),
        result_chart_use_group: JSON.stringify(result_chart_use_group),
        result_state_all_box,
        use_car ,
        accident_car,
        error_car 
      });




    } else {
      const [result] = await db.query(`SELECT count(*) as total_car FROM car_wash  where delete_time IS NULL and branch_id	 = ?`, [session.branch]);
      const [result_price] = await db.query(`SELECT sum(price) as total_price FROM use_car_wash  
      join car_wash on use_car_wash.idcar_wash = car_wash.idcar_wash  
      where use_car_wash.delete_time IS NULL  and branch_id	 = ?`, [session.branch]);
      const [result_pricemonth] = await db.query(`SELECT sum(price) as total_pricemonth FROM use_car_wash  
    join car_wash on use_car_wash.idcar_wash = car_wash.idcar_wash  
    where use_car_wash.delete_time IS NULL   
    and  month(use_car_wash.create_time)	 in 
    (SELECT MONTH(create_time) FROM use_car_wash 
    WHERE  MONTH(create_time) = MONTH(NOW())) and branch_id	 = ?; `, [session.branch]);
      const [result_dataadmin] = await db.query("SELECT * FROM admin  where  idadmin  = ?", [session.id_admin]);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
    FROM car_wash  WHERE branch_id	 = ? and ( car_wash.status != 1 or status_water != 1 or status_wind != 1
      or status_foam != 1 )  and status_detail IS NOT NULL  `, [session.branch]);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
      FROM car_wash WHERE branch_id	 = ? and status = 1 and  delete_time IS NULL `, [session.branch]);
      const [all_car] = await db.query(`SELECT count(*) as  all_car   
      FROM car_wash WHERE branch_id	 = ? and  delete_time IS NULL `, [session.branch]);

      await db.execute('SET @total := 0');
      const [result_chart_use] = await db.query(`
    SELECT HOUR(use_car_wash.create_time) as time, (@total := @total + price) AS running_total FROM use_car_wash 
    join car_wash on use_car_wash.idcar_wash = car_wash.idcar_wash
    WHERE DAY(use_car_wash.create_time) = DAY(NOW()) and MONTH(use_car_wash.create_time) = MONTH(NOW()) 
    and  YEAR(use_car_wash.create_time) = YEAR(NOW()) and use_car_wash.delete_time IS NULL 
    and car_wash.branch_id	 = ?
    `, [session.branch]);
      const [result_credit] = await db.query("SELECT credit_point FROM credit");
      console.log(result_credit[0]["credit_point"])
      // console.log(result_chart_use)
      let data_chart_total_money = [];
      result_chart_use.forEach((value) => {
        let arr_value = [(value.time).toString(), parseInt(value.running_total)]
        console.log(arr_value)
        data_chart_total_money.push(arr_value)
      });
      console.log(data_chart_total_money)


      const [result_chart_use_group_sql] = await db.query(`
      SELECT       count(branch.name_branch) as total_group_wash ,
      branch.name_branch as name 
  FROM  car_wash 
      JOIN branch on car_wash.branch_id = branch.id_branch
      WHERE branch.id_branch = ?
      group by name
      `, [session.branch]);
      const [result_avg_money] = await db.query(` SELECT  avg(price)  as avg_total
      FROM use_car_wash 
      LEFT JOIN car_wash ON
      use_car_wash.idcar_wash = car_wash.idcar_wash
      WHERE   MONTH(use_car_wash.create_time) = MONTH(NOW()) and 
       YEAR(use_car_wash.create_time) = YEAR(NOW())
      AND use_car_wash.delete_time IS NULL
      and car_wash.branch_id	 = ?
      `, [session.branch]);
      // console.log(result_chart_use)
      let result_chart_use_group = [];
      result_chart_use_group_sql.forEach((value) => {
        let arr_value = [value.name.toString(), parseInt(value.total_group_wash)]
        console.log(arr_value)
        result_chart_use_group.push(arr_value)
      });
      console.log(result_chart_use_group)

      const [result_sum_withdraw] = await db.query(`SELECT sum(total)  as sum_withdraw FROM withdraw_money
      LEFT JOIN admin ON
      withdraw_money.admin_id = admin.idadmin
      WHERE withdraw_money.delete_time IS NULL and withdraw_money.status  = 1  and branch_id	 = ? `, [session.branch]);

      const [result_count_use] = await db.query(` SELECT  count(*)  as total
    FROM use_car_wash 
    WHERE   MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
    AND delete_time IS NULL
    and idcar_wash	 = ?
    `, [session.branch]);
    result_state_all_box = [];
    use_car = 0;
    accident_car = 0;
    error_car = 0;
    const [result_carwash] = await db.query(`SELECT * FROM car_wash  where delete_time IS NULL and branch_id = ? `, [session.branch]);
    await data_car_all(result_carwash);

      res.render('pages/dashboard', {
        branch: session.branch, data_count_carwash: result,
        result_price: result_price, all_car: all_car,
        result_dataadmin: result_dataadmin, result_pricemonth: result_pricemonth,
        data_use: data_use, data_accident: data_accident,
        result_sum_withdraw: result_sum_withdraw,
        result_avg_money: result_avg_money,
        result_count_use: result_count_use,
        data_chart_total_money: JSON.stringify(data_chart_total_money),
        result_chart_use_group: JSON.stringify(result_chart_use_group),
        result_state_all_box,
        use_car ,
        accident_car,
        error_car 
      });




    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
});



//login
router.get('/', function (req, res, next) {
  res.render('pages/login');
});
router.get('/logout', sessionChecker, function (req, res, next) {

  delete session.branch;
  delete session.id_admin;
  console.log(session.branch)
  res.redirect('/') // will always fire after session is destroyed

});
//managepromotion

router.get('/managepromotion', sessionChecker, async (req, res, next) => {
  try {
    if (session.branch == 0) {
      const [result_total] = await db.query(`SELECT count(*) as total_amount,sum(promotion.price) as total_price FROM promotion 
      where promotion.delete_time IS NULL and (promotion.branch_id = 1 or promotion.branch_id = 0 ); `, [session.branch]);
      const [result] = await db.query(`SELECT promotion.*,type_promotion.name,promotion.id_promo as id,promotion.price as price_promotion FROM promotion  
      join type_promotion 
            on promotion.type  = type_promotion.id_type 
            left join  use_car_wash 
            on promotion.id_promo  = use_car_wash.id_promo
            left join  branch 
            on promotion.branch_id  = branch.id_branch
            where promotion.delete_time IS NULL
            ORDER BY 
           DATE_FORMAT(promotion.create_time, '%Y-%m-%d %H:%i') DESC
     LIMIT 12 `);
      const [result_count_promotion] = await db.query(`SELECT count(*) as count_promotion FROM use_car_wash where id_promo != 0 and delete_time IS NULL`);
      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);

      res.render('pages/managepromotion', { result_total, admin_name: session.admin_name, result_count_promotion, branch: session.branch, data_cus: result, total_cus: result_total_cus });

    } else {
      const [result_total] = await db.query(`SELECT count(*) as total_amount,sum(promotion.price) as total_price FROM promotion 
      where promotion.delete_time IS NULL and (promotion.branch_id = 1 or promotion.branch_id = 0 ); `, [session.branch]);

      const [result] = await db.query(`SELECT promotion.*,type_promotion.name,promotion.id_promo as id,promotion.price as price_promotion FROM promotion  
      join type_promotion 
            on promotion.type  = type_promotion.id_type 
            left join  use_car_wash 
            on promotion.id_promo  = use_car_wash.id_promo
            left join  branch 
            on promotion.branch_id  = branch.id_branch
            where promotion.delete_time IS NULL and (promotion.branch_id = 1 or promotion.branch_id = 0 )
            ORDER BY 
           DATE_FORMAT(promotion.create_time, '%Y-%m-%d %H:%i') DESC
     LIMIT 12 `, [session.branch]);

      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);
      const [result_count_promotion] = await db.query(`SELECT count(*) as count_promotion FROM use_car_wash where id_promo != 0 and delete_time IS NULL`);
      res.render('pages/managepromotion', {
        result_total,
        admin_name: session.admin_name, branch: session.branch,
        result_count_promotion: result_count_promotion,
        data_cus: result, total_cus: result_total_cus
      });

    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }

});


// show db cus
router.get('/show_cus', sessionChecker, async (req, res, next) => {

  try {
    const [result] = await db.query(`SELECT * FROM customer  where delete_time IS NULL 
    ORDER BY DATE_FORMAT(create_time, '%Y-%m-%d %H:%i') DESC
    LIMIT 15 `);
    const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM customer  where delete_time IS NULL`);
    const [result_avg_money] = await db.query(` SELECT  avg(price)  as avg_total
    FROM use_car_wash 
    WHERE   MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
    AND delete_time IS NULL`);
    const [result_count_use] = await db.query(` SELECT  count(*)  as total
    FROM use_car_wash 
    WHERE   MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
    AND delete_time IS NULL`);
    res.render('pages/show_customer', {
      admin_name: session.admin_name,
      branch: session.branch, data_cus: result,
      total_cus: result_total_cus, result_avg_money: result_avg_money,
      result_count_use: result_count_use
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
});

// show db branch
router.get('/show_branch', sessionChecker, async (req, res, next) => {

  try {
    const [result] = await db.query(`SELECT * FROM branch 
    LEFT JOIN city_branch 
    ON branch.id_branch = city_branch.id_city
    
    where branch.delete_time IS NULL and 
    branch.id_branch  != 0
    and
    city_branch.delete_time IS NULL LIMIT 15 `);
    const [result_city] = await db.query(`SELECT * FROM city_branch 
    where city_branch.delete_time IS NULL LIMIT 15 `);
    const [result_count_branch] = await db.query(`SELECT count(*) as count_branch 
    FROM branch 
    where   branch.id_branch  != 0 and delete_time IS NULL`);
    const [result_sum_withdraw] = await db.query(`SELECT sum(total)  as sum_withdraw FROM withdraw_money
    WHERE delete_time IS NULL `);
    const [result_price] = await db.query(`SELECT sum(price) as total_price 
    FROM use_car_wash  where delete_time IS NULL`);
    const [result_count_city] = await db.query(`SELECT count(*) as count_city
    FROM city_branch 
    where  delete_time IS NULL`);
    res.render('pages/show_branch', {
      admin_name: session.admin_name,
      branch: session.branch, result: result,
      result_count_branch: result_count_branch,
      result_price: result_price, result_sum_withdraw: result_sum_withdraw,
      result_city: result_city, result_count_city: result_count_city
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
});

//show db admin
router.get('/show_admin', sessionChecker, async (req, res) => {
  try {
    const [result_2] = await db.query(`SELECT * FROM admin 
    LEFT join branch on admin.branch_id = branch.id_branch  
    where admin.delete_time  IS NULL  and branch.delete_time  IS NULL    LIMIT 15 `);
    const [result_count_withdraw] = await db.query(`SELECT count(*) as count_withdraw FROM withdraw_money
     WHERE delete_time IS NULL and status = 1  `);
    const [result_sum_withdraw] = await db.query(`SELECT sum(total)  as sum_withdraw FROM withdraw_money
      WHERE delete_time IS NULL and status = 1  `);
    const [result_avg_withdraw] = await db.query(`SELECT avg(total) as avg_withdraw FROM withdraw_money
     WHERE MONTH(create_time) = MONTH(NOW())
     and  YEAR(create_time) = YEAR(NOW()) and  
     delete_time IS NULL  and status = 1   `);
    const [result_price] = await db.query(`SELECT sum(price) as total_price FROM use_car_wash  where delete_time IS NULL`);
    const [count_admin] = await db.query(`SELECT count(*)  as count_total  FROM admin WHERE idadmin != 1`);
    const [result_withdraw] = await db.query(`SELECT * FROM withdraw_money
    LEFT JOIN admin 
    on withdraw_money.admin_id = admin.idadmin
    LEFT join branch on admin.branch_id = branch.id_branch  
    where withdraw_money.delete_time  IS NULL    AND
    admin.delete_time  IS NULL    AND
    branch.delete_time  IS NULL    
    LIMIT 15   `);

    res.render('pages/show_admin', {
      admin_name: session.admin_name,
      branch: session.branch, data_admin: result_2,
      count_admin: count_admin, result_price: result_price,
      result_count_withdraw: result_count_withdraw, result_sum_withdraw: result_sum_withdraw,
      result_avg_withdraw: result_avg_withdraw, result_withdraw: result_withdraw

    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
});


//statistics
router.get('/statistics', sessionChecker, async (req, res) => {
  try {
    if (session.branch == 0) {
      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
    FROM car_wash WHERE   status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
    FROM car_wash WHERE status = 1 and status_water = 1 and status_wind = 1 and status_foam = 1 `);
      const [data_damaged] = await db.query(`SELECT count(*) as  damaged   
    FROM car_wash WHERE status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `);

      res.render('pages/statistics', { admin_name: session.admin_name, branch: session.branch, data_damaged: data_damaged, data_use: data_use, data_accident: data_accident });

    } else {
      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
    FROM car_wash WHERE branch_id	 = ? and    status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `, [session.branch]);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
    FROM car_wash WHERE branch_id	 = ? and  status = 1 and status_water = 1 and status_wind = 1 and status_foam = 1 `, [session.branch]);
      const [data_damaged] = await db.query(`SELECT count(*) as  damaged   
    FROM car_wash WHERE branch_id	 = ? and  status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `, [session.branch]);

      res.render('pages/statistics', { admin_name: session.admin_name, branch: session.branch, data_damaged: data_damaged, data_use: data_use, data_accident: data_accident });

    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }
  // res.render('pages/statistics',{branch: session.branch, });
});




// Call the function to start processing data


//washcarInSystem
router.get('/washcarInSystem', sessionChecker, async (req, res) => {
  try {
    if (session.branch == 0) {
      const [count_carwash] = await db.query(`SELECT count(*) as total_carwash FROM car_wash  where delete_time IS NULL`);

      // const [result_carwash] = await db.query(`
      // SELECT * FROM car_wash 
      // where delete_time IS NULL
      // ORDER BY car_wash.status DESC
      // LIMIT 4
      //       `);
      const [result_carwash_branch] = await db.query(`
      SELECT branch.*,COUNT(*) as total 
      FROM branch
      JOIN car_wash on branch.id_branch = car_wash.branch_id
      WHERE id_branch != 0 and branch.delete_time IS NULL and car_wash.delete_time IS NULL
      GROUP by id_branch
            `);


      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
      FROM car_wash WHERE   status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
      FROM car_wash WHERE status = 1 and status_water = 1 and status_wind = 1 and status_foam = 1  `);
      const [all_car] = await db.query(`SELECT count(*) as  all_car   
      FROM car_wash WHERE  delete_time IS NULL `, [session.branch]);

      // console.log(result_chart_use)
      const [result_chart_use_group_sql] = await db.query(`
      SELECT      count(branch.name_branch) as total_group_wash ,
      branch.name_branch as name 
      FROM  car_wash 
          JOIN branch on car_wash.branch_id = branch.id_branch
    
           group by name;
      `);
      // console.log(result_chart_use)
      let result_chart_use_group = [];
      result_chart_use_group_sql.forEach((value) => {
        let arr_value = [value.name.toString(), parseInt(value.total_group_wash)]
        console.log(arr_value)
        result_chart_use_group.push(arr_value)
      });
      console.log(result_chart_use_group)


      const [result_chart_use_money_day] = await db.query(`
          SELECT avg(price)  as day_total
          FROM use_car_wash 
          WHERE DAY(create_time) = DAY(NOW()) and  MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
          AND delete_time IS NULL
  
      `);
      const [result_chart_use_money_month] = await db.query(`
      SELECT avg(price)  as month_total
      FROM use_car_wash 
      WHERE  MONTH(create_time) = MONTH(NOW()) and  YEAR(create_time) = YEAR(NOW())
      AND delete_time IS NULL
      `);
      const [result_chart_use_money_year] = await db.query(`
        SELECT  avg(price)  as year_total
        FROM use_car_wash 
        WHERE   YEAR(create_time) = YEAR(NOW())
        AND delete_time IS NULL
      `);
      result_state_all_box = [];
      use_car = 0;
      accident_car = 0;
      error_car = 0;
      const [result_carwash] = await db.query(` SELECT * FROM car_wash 
      where delete_time IS NULL
      ORDER BY car_wash.branch_id 
      LIMIT 4`);
      await data_car_all(result_carwash);
      res.render('pages/washcarInSystem', {
        admin_name: session.admin_name,
        branch: session.branch, data_carwash: result_carwash, total_carwash: count_carwash,
        all_car: all_car, data_use: data_use, data_accident: data_accident,
        result_chart_use_group: JSON.stringify(result_chart_use_group),
        result_carwash_branch: result_carwash_branch,
        result_chart_use_money_day: result_chart_use_money_day,
        result_chart_use_money_month: result_chart_use_money_month,
        result_chart_use_money_year: result_chart_use_money_year,
        result_state_all_box,
        use_car ,
        accident_car,
        error_car 
      });



    } else {
      const [count_carwash] = await db.query(`SELECT count(*) as total_carwash FROM car_wash  where delete_time IS NULL and branch_id = ?`, [session.branch]);
      const [result_total_cus] = await db.query(`SELECT count(*) as total_customer FROM promotion  where delete_time IS NULL`);
      const [data_accident] = await db.query(`SELECT count(*) as  accident   
      FROM car_wash WHERE branch_id	 = ? and  status != 1 or status_water != 1 or status_wind != 1 or status_foam != 1 `, [session.branch]);
      const [data_use] = await db.query(`SELECT count(*) as  usecar   
      FROM car_wash WHERE branch_id	 = ? and status = 1 and  delete_time IS NULL `, [session.branch]);
      const [all_car] = await db.query(`SELECT count(*) as  all_car   
      FROM car_wash WHERE branch_id	 = ? and  delete_time IS NULL `, [session.branch]);



      const [result_carwash_branch] = await db.query(`
      SELECT branch.*,COUNT(*) as total 
      FROM branch
      JOIN car_wash on branch.id_branch = car_wash.branch_id
      WHERE id_branch != 0 and branch.delete_time IS NULL and car_wash.delete_time IS NULL
      and branch.id_branch = ?
      `, [session.branch]);

      // console.log(result_chart_use)
      const [result_chart_use_group_sql] = await db.query(`
      SELECT      count(branch.name_branch) as total_group_wash ,
      branch.name_branch as name 
      FROM  car_wash 
      JOIN branch on car_wash.branch_id = branch.id_branch
       WHERE branch.id_branch = ?
       group by name
       `, [session.branch]);
      // console.log(result_chart_use)
      let result_chart_use_group = [];
      result_chart_use_group_sql.forEach((value) => {
        let arr_value = [value.name.toString(), parseInt(value.total_group_wash)]
        console.log(arr_value)
        result_chart_use_group.push(arr_value)
      });



      // console.log(result_chart_use_group)
      // const ref = db_fb.ref('/box1/state_foam');
      // let data_firebase;
      // ref.once('value').then((snapshot) => {
      //   data_firebase = snapshot.val();
      //   console.log(data_firebase);
      // }).catch((error) => {
      //   console.error('Error reading data:', error);
      // });
      result_state_all_box = [];
      use_car = 0;
      accident_car = 0;
      error_car = 0;
      const [result_carwash] = await db.query(`SELECT * FROM car_wash  where delete_time IS NULL and branch_id = ? `, [session.branch]);
      await data_car_all(result_carwash);

      const [result_chart_use_money_day] = await db.query(`
           SELECT avg(price)  as day_total
           FROM use_car_wash 
            LEFT JOIN car_wash ON
           use_car_wash.id_usecar = car_wash.idcar_wash
           WHERE DAY(use_car_wash.create_time) = DAY(NOW()) 
           and  MONTH(use_car_wash.create_time) = MONTH(NOW()) 
           and  YEAR(use_car_wash.create_time) = YEAR(NOW())
           AND use_car_wash.delete_time IS NULL and car_wash.branch_id = ?
           `, [session.branch]);
      const [result_chart_use_money_month] = await db.query(`
       SELECT avg(price)  as month_total
       FROM use_car_wash 
        LEFT JOIN car_wash ON
       use_car_wash.id_usecar = car_wash.idcar_wash
       WHERE  MONTH(use_car_wash.create_time) = MONTH(NOW()) and  YEAR(use_car_wash.create_time) = YEAR(NOW())
       AND use_car_wash.delete_time IS NULL and car_wash.branch_id = ?
       `, [session.branch]);
      const [result_chart_use_money_year] = await db.query(`
       SELECT
       AVG(price) AS year_total
   FROM
       use_car_wash
    LEFT JOIN car_wash ON
       use_car_wash.id_usecar = car_wash.idcar_wash
   WHERE
       YEAR(use_car_wash.create_time) = YEAR(NOW()) AND use_car_wash.delete_time IS NULL and car_wash.branch_id = ?
       `, [session.branch]);


      res.render('pages/washcarInSystem', {
        admin_name: session.admin_name,
        branch: session.branch, data_carwash: result_carwash, total_carwash: count_carwash,
        all_car: all_car, data_use: data_use, data_accident: data_accident,
        result_chart_use_group: JSON.stringify(result_chart_use_group),
        result_carwash_branch: result_carwash_branch,
        result_chart_use_money_day: result_chart_use_money_day,
        result_chart_use_money_month: result_chart_use_money_month,
        result_chart_use_money_year: result_chart_use_money_year,
        result_state_all_box,
        use_car ,
        accident_car,
        error_car 
      });


    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 'success': false, 'message': 'Internal server error' });
  }

});


router.get('/transection', sessionChecker, async (req, res) => {

  const [result] = await db.query(`SELECT id,total,withdraw_money.status as status,
  DATE_FORMAT(withdraw_money.update_time, '%H:%i') as time_update_time 
   ,DATE_FORMAT(withdraw_money.update_time, '%d / %m / %Y') as day_update_time 
    FROM lab_db.withdraw_money 
  LEFT JOIN admin ON withdraw_money.admin_id = admin.idadmin
  where branch_id = ? and withdraw_money.delete_time IS NULL
  ORDER BY DATE_FORMAT(withdraw_money.create_time, '%Y-%m-%d %H:%i') DESC
   LIMIT 15 `, [session.branch]);
  const [result_total_money] = await db.query(`SELECT sum(total) as sum_money
     FROM lab_db.withdraw_money 
   LEFT JOIN admin ON withdraw_money.admin_id = admin.idadmin
   where branch_id = ? and withdraw_money.delete_time IS NULL
  and status = 2
    `, [session.branch]);
  const [result_price] = await db.query(`SELECT sum(price) as total_price FROM use_car_wash  
    join car_wash on use_car_wash.idcar_wash = car_wash.idcar_wash  
    where use_car_wash.delete_time IS NULL  and branch_id	 = ?`, [session.branch]);


  const [result_sum_withdraw] = await db.query(`SELECT sum(total)  as sum_withdraw FROM withdraw_money
      LEFT JOIN admin ON
      withdraw_money.admin_id = admin.idadmin
      WHERE withdraw_money.delete_time IS NULL and withdraw_money.status  = 1  and branch_id	 = ? `, [session.branch]);

  res.render('pages/transection_money', {
    admin_name: session.admin_name,
    branch: session.branch, data_cus: result,
    result_price: result_price, result_sum_withdraw: result_sum_withdraw,
    result_total_money: result_total_money
  });

  // res.render('pages/transection_money',{
  //   branch: session.branch
  // });
});
// ------------------------------------------------







//view_customer
router.get('/view_customer', function (req, res, next) {
  res.render('pages/view_customer',);
});



//insert_modal (admin)
router.get('/insert_modal', function (req, res, next) {
  res.render('pages/insert_modal');
});


//insert_customer
router.get('/insert_cus', function (req, res, next) {
  res.render('pages/insert_customer');
});


router.get('/uu', function (req, res, next) {
  res.render('uu/index');
});




module.exports = router;