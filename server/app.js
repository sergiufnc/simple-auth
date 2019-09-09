require('dotenv').config()

const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const knexfile = require('./knexfile')
const knex = require('knex')(knexfile)

const app = express()

app.set('view engine', 'ejs')

app.set('view cache', false);

app.use(express.static('public'))

app.use(cookieParser());

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
}))

app.use(function (req, res, next) {
    res.locals.errorMessage = null
    res.locals.successMessage = null
    res.locals.infoMessage = null

    if (req.session.errorMessage) {
        res.locals.errorMessage = req.session.errorMessage;

        req.session.errorMessage = null
    }

    if (req.session.successMessage) {
        res.locals.successMessage = req.session.successMessage;

        req.session.successMessage = null
    }

    if (req.session.infoMessage) {
        res.locals.infoMessage = req.session.infoMessage;

        req.session.infoMessage = null
    }

    next();
})

app.get('/', async (req, res) => {
    if (req.session.userId) {
        return res.redirect('/welcome')
    } else {
        return res.redirect('/sign-in')
    }
});

app.get('/sign-in', async (req, res) => {
    return res.render('sign-in');
});

app.post('/sign-in', async (req, res) => {
    if (!req.body.email || !req.body.password) {
        req.session.errorMessage = 'Please fill out all the fields.'

        return res.redirect('/sign-in')
    }

    var user = await knex('users').where('email', req.body.email).first()

    if (!user) {
        req.session.errorMessage = 'The email or the password is invalid.'

        return res.redirect('/sign-in')
    }

    if (!bcrypt.compareSync(req.body.password, user.password)) {
        req.session.errorMessage = 'The email or the password is invalid.'

        return res.redirect('/sign-in')
    }

    req.session.userId = user.id

    return res.redirect('/welcome')
});

app.get('/sign-up', async (req, res) => {
    return res.render('sign-up');
});

app.post('/sign-up', async (req, res) => {
    if (!req.body.email || !req.body.password || !req.body.confirm) {
        req.session.errorMessage = 'Please fill out all the fields.'

        return res.redirect('/sign-up')
    }

    if (req.body.password !== req.body.confirm) {
        req.session.errorMessage = 'The passwords do not match.'

        return res.redirect('/sign-up')
    }

    var userInsert = await knex('users').insert({
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
    })

    req.session.userId = userInsert[0]

    return res.redirect('/welcome')
});

app.get('/sign-out', async (req, res) => {
    req.session.userId = null

    req.session.infoMessage = 'You have been successfully logged out.'

    return res.redirect('/sign-in')
});

app.get('/welcome', async (req, res) => {
    return res.render('welcome');
});

app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
});

app.listen(3000);