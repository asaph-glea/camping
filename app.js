const express = require('express')
const mongoose = require('mongoose');
const path = require('path');
const engine = require('ejs-mate')
const methodOverride = require('method-override')
const session = require('express-session')
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')

const userRoutes = require('./routes/user')
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes  = require('./routes/reviews')
mongoose.connect('mongodb://localhost:27017/camping',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"Connection error:"));
db.once("open",()=>{
    console.log("Database connected");
});

const app = express();

const sessionConfig = {
    secret:'secretsecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now() + 1000*60*60*24*7,
        maxAge:1000*60*60*24*7,
    }
}

app.set("views", path.join(__dirname,"views"));
app.set('view engine','ejs')

app.engine('ejs', engine);
app.use(express.static(path.join(__dirname,'public')))

app.use(methodOverride('_method'))
app.use(express.urlencoded({extended:true}))

app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success =  req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/',userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.get('/', (req, res) => {
    res.render('home')
});

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not found',404))
})

app.use((err,req,res,next)=>{
    const {statusCode = 500} = err;
    if(!err.message) err.message = 'Something went wrong!!!!'
    res.status(statusCode).render('error', {err})
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})