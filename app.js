var createError = require('http-errors');
var express = require('express');
var path = require('path'); 



// var cookieParser = require('cookie-parser');
const app = express() //เก็บตัว object ไว้ใน ตัวแปร app
const port = 3080 //กำหนด port

const dataRouter = require('./routes/data');
const pageRouter = require('./routes/view');
const testRouter = require('./routes/test');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views');


app.use('/data', dataRouter);
app.use('/', pageRouter);
app.use('/t', testRouter);





module.exports = app;
// app.use(function(req, res, next) {
//     next(createError(404));
//   });

















//MySQL Connect phpMyAdmin






// app.set('view engine', 'ejs') //ใช้ ejs เป็น Template engine







 












// // เปิดใช้งานการเข้าถึงไฟล์สำหรับ Folder 
// app.use(express.static('public'))
// // ********************************************************************
// //addadmin///////////////////
// app.get("/addadmin", (req,res) => {  //สร้างแอพ ว่าให้สงและรับเป็นอะไร
//     res.render('pages/addadmin',{
//     })
// })
// //dashboard
// app.get("/dashboard", (req,res) => {  
//     res.render('pages/dashboard',{
//     })
// })
// //editAdmin//////////////////
// app.get("/editadmin", (req,res) => {  
//     res.render('pages/editadmin',{
//     })
// })
// //index
// app.get("/", (req,res,next) => { //สร้างแอพ ว่าให้สงและรับเป็นอะไร
//     res.render('pages/index',{
//     })
// })
// //login
// app.get("/login", (req,res) => {  
//     res.render('pages/login',{
//     })
// })
// //managePromotion//////////////
// app.get("/managePromotion", (req,res) => {  
//     res.render('pages/managePromotion',{
//     })
// })
// //setting///////////////
// app.get("/setting", (req,res) => {  
//     res.render('pages/setting',{
//     })
// })
// //statistics///////////////////
// app.get("/statistics", (req,res) => {  
//     res.render('pages/statistics',{
//     })
// })
// //washcarInSystem////////////////////
// app.get("/washcarInSystem", (req,res) => {  
//     res.render('pages/washcarInSystem',{
//     })
// })





//รันsever
app.listen(port, () => {
    console.log("App is Listening on port :",port)
})














// const express = require('express') //install express: Terminal (ประกาศใช้งาน express)
// const app = express() //เก็บตัว object ไว้ใน ตัวแปร app
// const port = 3000 //กำหนด port

// app.set('view engine', 'ejs') //ใช้ ejs เป็น Template engine

// const user = {
//     firstName :'John',
//     lastName: 'Doe',
//     admin:true
// }


// // เปิดใช้งานการเข้าถึงไฟล์สำหรับ Folder ของคุณ
// app.use(express.static('images'))

// app.get("/", (req,res) => {  //สร้างแอพ ว่าให้สงและรับเป็นอะไร
//     res.render('pages/index',{
//         user:user,
//         title:"Home Page"
//     })
    
// })

// //รันsever
// app.listen(port, () => {
//     console.log("App is Listening on port :",port)
// })
