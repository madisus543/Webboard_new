//import dotenv
require('dotenv').config()

var express = require('express');
var router = express.Router();

// connect Mysql
let mysql = require('mysql');
let con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

con.connect((err) => {
  if (err) throw err;
  console.log('!!!Connect Database Success!!!')
})

//import express-session
var session = require('express-session');
router.use(session({
  secret: 'test',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 100 * 60 * 24 * 30 }
}))

router.use((req,res,next) => {
  res.locals.session = req.session;
  next();
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', (req,res) => {
  res.render('login');
});

router.post('/login' ,(req,res) => {
  if (req.body['user'] != undefined){
    let sql = 'SELECT * FROM tb_member WHERE user = ? AND pass = ?';
    let params = [req.body['user'], req.body['pass']];
    con.query(sql, params, (err, result) => {
      if (err) throw err;
      if (result.length > 0 ) {
        req.session.user_id = result[0].id;
        req.session.name_id = result[0].name;
        res.redirect('board')
      } else {
        res.redirect('login_failed');
      }
    });
  } 
});

router.get('/login_failed', (req,res) => {
  res.render('login_failed');

});

router.get('/logout', (req,res) => {
  req.session.destroy();
  res.redirect('/')
})

router.get('/register', (req,res) => {
  res.render('register');
});

router.post('/register' ,(req,res) => {
  if ( req.body['name'] != undefined ){
    let sql = 'INSERT INTO tb_member SET?'
    con.query(sql, req.body, (err,result) => {
      if (err) throw err;
      res.redirect('register_success')
    })
  } else{
    res.send('Please Enter Information')
  }
});

router.get('/register_success', (req,res) => {
  res.render('register_success');
});

router.get('/board', (req,res) => {
  let sql = 'SELECT tb_topic.*, tb_member.name FROM tb_topic ' +
            'LEFT JOIN tb_member ON tb_member.id = tb_topic.member_id ' +
            'ORDER BY tb_topic.id';

  con.query(sql, (err, result) => {
    if (err) throw err;
    res.render('board', {topics: result})
  })
});


router.get('/topic', (req,res) => {
  res.render('topic');
})

router.post('/topic', (req,res) => {
  let sql = 'INSERT INTO tb_topic(topic, member_id) VALUES(?,?)';
  let params = [
    req.body.topic,
    req.session.user_id
  ]

  con.query(sql,params, (err,result) => {
    if (err) throw err;
    res.redirect('/board');
  })
})

router.get('/comment/:topic_id', (req,res) => {
  let sql = 'SELECT * FROM tb_topic WHERE id= ?'
  let params = [req.params.topic_id];
  con.query(sql, params, (err, result) => {
    if (err) throw err;
    let topic = result[0];
    let sql = 'SELECT * FROM tb_comment ' +
    'LEFT JOIN tb_member ON tb_member.id = tb_comment.member_id ' +
    'WHERE tb_comment.topic_id = ? ORDER BY tb_comment.id';
    con.query(sql, params, (err, result) => {
      if (err) throw err;
      res.render('comment', {topic:topic, comments:result });
    })
  })
})

router.post('/comment/:topic_id', (req, res) => {
  let sql = 'INSERT INTO tb_comment(member_id, topic_id, detail) VALUES(?, ?, ?)';
  let params = [
    req.session.user_id,
    req.params.topic_id,
    req.body.detail
  ]

  con.query(sql, params, (err,result) => {
    if (err) throw err;
    res.redirect('/comment/' + req.params.topic_id);
  })
})

module.exports = router;
