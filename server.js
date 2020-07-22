const express = require ("express")
const expressSession = require('express-session');
const cookieParser = require('cookie-parser')
const flash = require('connect-flash');
const passport = require('passport')
const request = require("request");
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const path = require('path')
const app = express();
const {Client} = require("pg")
const client = new Client({
    "user": "postgres",
    "password" : "janani221099",
    "host" : "localhost",
    "port" : 5432,
    "database" : "Scroll"
})


app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession({
    secret : 'scorly_erpa is the best',
    resave : true,
    saveUninitialized :false
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));
app.use(flash());
app.use(express.json())
app.set("view engine","ejs");


///////////routes///////////////////////////////////////////////////////////////////////////////////////////
app.get("/signup", (req, res) => res.render('signup'))

app.post("/signup", async (req, res) => {
    let result = {}
    try{
        const reqJson = req.body;
        result.success = await addUser(reqJson);
    }
    catch(e){
        console.log(e);
        result.success = false;
    }
    finally
    {
        if(result.success==true)
        {
            message = {link:"/",post_value:"REGISTRATION SUCCESSFUL",msg:"Continue to the site after logging in"}
        }
        else
        {
            message = {link:"signup",post_value:"REGISTRATION UNSUCCESSFUL",msg:"Please verify the details and try again."}
        }
        res.render('regsuccess.ejs', {messages:message})
    }
})

app.get("/login" , async(req , res) => {
    console.log(req.user);
    if(req.isAuthenticated())
    {
        res.redirect('/')
    }
    else
    {
        res.render('login');
    }
})

app.post("/login", passport.authenticate('local',{
    successRedirect : '/',
    failureRedirect : '/',
    successFlash : true,
    failureFlash : true }) ,
    async (req, res) => {
    if(req.body.remember){
        req.session.cookie.maxAge = 30*24*60*60*1000;
        console.log("hellloooo");
    }
    else
    {
        req.session.cookie.expires = false;
        console.log(req.user + "\tfrom post else")
    }
    // res.redirect('/');
    console.log("hellllloooooooooooo");
});

app.get("/", async(req, res, next) => {
    if(req.isAuthenticated())
    {
        post = [];
        client.query("select * from \"Scroll schema\".\"postInfo\"",function(err,result){
            if(err) throw(err)
            else
            {
                res.render('home',{posts:result.rows})
            } 
        });
    }
    else
    {
        res.redirect('/login');
    }
})

app.get('/logout', function(req, res){
    console.log("logout hello");
    console.log(req.isAuthenticated());
    req.logout();
    console.log(req.isAuthenticated());
    res.redirect('/');
});

app.get("/create-post",(req,res,next) => {
    if(req.isAuthenticated())
    {
        console.log(req.user[0])
        res.render('create-post')
    }
    else
    {
        res.redirect('/login')
        console.log("logged out couldn't create post")
    }
})

app.post("/create-post" , async (req,res,next) => {
    if(req.isAuthenticated())
    {
        let result = {}
        try
        {
            const reqJson = req.body;
            result.success = await add_post(reqJson,req.user[0].username);
        }
        catch(e)
        {
            console.log(e);
            result.success = false;
        }
        finally
        {
            if(result.success == true)
            {
                let posts = [req.body];
                posts[0].uname = req.user[0].username
                console.log(posts)
                res.render('single-post',{posts:posts})
                console.log("hello2")
            }
            else
            {
                res.redirect('/create-post')
            }
        }
    }
    else{
        res.redirect('/login');
    }
})

app.get("/show-post" , async(req,res) => {
    const id = req.query.id
    if(req.isAuthenticated())
    {
        client.query("select * from \"Scroll schema\".\"postInfo\" where post_id = $1", [id] , (err,result) => {
            if(err) { res.redirect('/'); console.log(err) }
            else res.render('single-post',{posts : result.rows})
        });
    }
    else res.redirect('/login')
})

app.get("/my-posts" , async(req,res)=>{
    if(req.isAuthenticated())
    {
        var uname = req.user[0].username;
        client.query("select * from \"Scroll schema\".\"postInfo\" where uname = $1 order by post_id",[uname],function(err,result){
            if(err) throw(err)
            else
            {
                res.render('my-post',{posts:result.rows})
            } 
        });
    }
    else
    {
        res.redirect('/login');
    }
})

app.get("/edit-post" , async(req,res) =>{
    const id = req.query.id;
    if(req.isAuthenticated())
    {
        client.query("select * from \"Scroll schema\".\"postInfo\" where post_id = $1", [id] , (err,result) => {
            if(err) { res.redirect("/my-posts"); console.log(err) }
            else
            {
                res.render('edit-post',{post:result.rows[0]})
            }
        });
    }
    else
    {
        res.redirect("/login")
    }
})

app.post("/edit-post" ,async(req,res)=>{
    const id = req.query.id
    var title = req.body.title , des = req.body.des, content = req.body.content ;
    if(req.isAuthenticated())
    {
        client.query("update \"Scroll schema\".\"postInfo\" set title=$1, \"desc\"=$2, content=$3 where post_id = $4",[title,des,content,id],function(err,result){
            if(err) console.log(err)
            else
            {
                res.render('single-post',{posts:[req.body]})
            } 
        });
    }
    else res.redirect('/login')
})

app.get("/delete-post", async(req,res)=>{
    const id = req.query.id;
    if(req.isAuthenticated())
    {
        client.query("delete from \"Scroll schema\".\"postInfo\"  where post_id = $1",[id],function(err,result){
            if(err) console.log(err)
            else res.redirect('/my-posts')
        });
    }
    else res.redirect('/login')
})

app.post("/search-posts",async(req,res)=>{
    author = req.body.author
    if(req.isAuthenticated())
    {
        client.query("select * from \"Scroll schema\".\"postInfo\" where uname = $1 order by post_id",[author],function(err,result){
            if(err) throw(err)
            else res.render('search-posts',{posts:result.rows}) 
        });
    }
    else
        res.redirect('/login');
})

passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
    checkUser();
    async function checkUser()
    {
        try 
        {
            const resu = await client.query("select * from \"Scroll schema\".\"login\" where username = $1",[username], function(err,results){
                if(err)
                {
                    return done(err)
                }
                if(results.rows[0] == null)
                {
                    req.flash('danger', "Oops. Incorrect login details.");
                    return done(null, false);
                }
                else
                {
                    if(results.rows.length>0 && password == results.rows[0].password)
                    {
                        // console.log(username)
                        return done(null, [{username: results.rows[0].username}]);
                    }
                    else
                    {
                        req.flash('danger', "Oops. Incorrect login details.");
                        return done(null, false);
                    }
                }

            })
        }
        catch(e)
        {
            throw(e);
        }
    }	
}))

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

app.listen(8080, () => console.log("Web server is listening.. on port 8080"))

start()
async function start() {
    await connect();
}

async function connect() {
    try {
        await client.connect();
    }
    catch(e) {
        console.error(`Failed to connect : ${e}`)
    }
}

async function addUser(reqJson)
{
    try{
        let a = await client.query("insert into \"Scroll schema\".\"login\" values ($1,$2)",[reqJson.uname,reqJson.pass])
        a = await client.query("insert into \"Scroll schema\".\"users\" values ($1,$2,$3,$4)",[reqJson.fname,reqJson.lname,reqJson.uname,reqJson.email])
        return true;
    }
    catch(e){
        console.log(e);
        return false;
    }
}

async function add_post(reqJson,uname)
{
    console.log(uname);
    var rdb = true;
    var t = reqJson.title
    var pd = reqJson.des
    var pc = reqJson.content
    var r = await client.query("insert into \"Scroll schema\".\"postInfo\" (\"title\", \"desc\", \"content\", \"uname\") values ($1,$2,$3,$4)",[t,pd,pc,uname],(err,result)=>{
        if(err) rdb = false;
    })
    return rdb;
}