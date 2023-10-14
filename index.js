const express = require('express');
const session = require('express-session');
const path = require("path");
require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const PORT = 1600;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static(__dirname+'/public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

const mongoose = require('mongoose');
const connection = require('./database');
connection();

const MongoStore = require('connect-mongo');
const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    mongooseConnection: mongoose.connection,
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: mongoStore,
}));

const donation_Schema = new mongoose.Schema({
    donar_name: {
        type: String,
        required: true
    },
    date_of_donation: {
        type: Date,
        required: true
    }, 
    type_of_donation: {
        type: String,
        required: true
    },
    type_of_event: {
        type: String
    },
    user_mobile_number: {
        type: Number,
        required: true
    }, 
    user_pickup_address: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    donated: {
        type: Boolean,
        required: true
    }
})

const user_Schema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true
    },
    user_email: {
        type: String,
        required: true
    }, 
    user_password: {
        type: String,
        required: true
    },
    user_donations: Array
});

const NGO_Schema = new mongoose.Schema({
    NGO_name: {
        type: String,
        required: true
    },
    NGO_registration_number: {
        type: String,
        required: true
    }, 
    NGO_address: {
        type: String,
        required: true
    },
    NGO_position: {
        type: mongoose.Schema.Types.Mixed
    },
    NGO_webpage: {
        type: String,
        required: true
    }
});

const NGO = mongoose.model('NGO', NGO_Schema);
const User = mongoose.model('User', user_Schema);
const Donation = mongoose.model('Donation', donation_Schema);

app.get('/', (req, res)=>{
    req.session.location = req.session.location || '';
    console.log("[GET]  `/`      Current User Location: "+req.session.location);
    if (req.session.userID) {
        User.findOne({user_email: req.session.userID})
        .then (result=>{
            res.render("home.ejs", {user: result.user_name});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("home.ejs");
    }
});

app.post('/', (req, res)=>{
    req.session.location = req.body["latitude"]+'_'+req.body["longitude"];
    console.log("[POST] `/`      Current User Location: "+req.session.location);
    req.session.nearbyNGOs = [];
    Donation.find({donated: false})
    .then (function(results){
        results.forEach(result=>{
            Object.assign(result.user_pickup_address.coordinates, {humanReadableAddress: result.user_pickup_address.humanReadableAddress});
            Object.assign(result.user_pickup_address.coordinates, {typeOfDonation: result.type_of_donation});
            req.session.nearbyNGOs.push(result.user_pickup_address.coordinates);
        })
        res.send({data: req.session.nearbyNGOs});
    })
    .catch (error=>{ 
        console.log("Error: ",error);
    })
});

app.get('/donate', (req, res)=>{
    console.log("[GET] `/donate` Current User Location: "+req.session.location);
    if (!req.session.userID){
        res.render('sign_up.ejs', {error:null});
    } else {
        User.findOne({user_email: req.session.userID})
        .then (result=>{
            if (req.session.location===''){
                res.render("donate.ejs", {user: result.user_name});
            } else {
                res.render("donate.ejs", {user: result.user_name}); //, {currentLocation: req.session.location}
            }
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    }
});

app.post('/donate/submit', (req, res)=>{
    const recievedData = req.body;
    if (recievedData["name"]==='') {
        res.send({error:'Please enter username'});  
    } else if (recievedData["dateOfDonation"]==='') {
        res.send({error:'Please enter date of donation'});  
    } else if (new Date(recievedData['dateOfDonation'])<new Date()) {
        res.send({error:'Please enter valid date of donation'})
    } else if (recievedData["mobileNumber"]==='') {
        res.send({error:'Please enter mobile number'});  
    } else if (recievedData['mobileNumber'].length!==10) {
        res.send({error:'Please enter valid mobile number'});
    } else if (recievedData["position"]["humanReadableAddress"]==='' || recievedData["position"]["coordinates"]["latitude"]==='') {
        res.send({error:'Please enter pickup address'});  
    } else {
        let donationData = {
            donar_name: recievedData["name"],
            date_of_donation: recievedData["dateOfDonation"], 
            user_mobile_number: recievedData["mobileNumber"], 
            user_pickup_address: recievedData["position"],
            donated: false,
            type_of_donation: recievedData["typeOfDonation"],
        }
        if (recievedData["typeOfDonation"]==='Food'){
            donationData.type_of_event = recievedData["typeOfEvent"];
        }
        const donation = new Donation(donationData);
        donation.save()
        .then ((result)=>{
            User.updateOne({user_email: req.session.userID}, {$push: {user_donations: result._id}})
            .then (()=>{
                console.log('Done');
            })
            .catch (error=>{
                console.log("Error: ",error);
            });
        })
        .catch(error=>{
            console.log("Error: ", error);
        })
        res.send({error:null});
    }
});

app.get('/about_us', (req, res)=>{
    if (req.session.userID) {
        User.findOne({user_email: req.session.userID})
        .then (result=>{
            res.render("about_us.ejs", {user: result.user_name});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("about_us.ejs")
    }
});
app.get('/feedback', (req, res)=>{
    if (req.session.userID) {
        User.findOne({user_email: req.session.userID})
        .then (result=>{
            res.render("feedback.ejs", {user: result.user_name});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("feedback.ejs");
    }
});
app.get('/sign_up', (req, res)=>{
    res.render("sign_up.ejs", {error: null})
});
app.post('/sign_up',(req, res)=>{
    //assuming email to be unique
    bcrypt.hash(req.body["userPassword"], saltRounds, (err, hashedPassword) => {
        if (err) throw err;
        var newUser = new User({
            user_name: req.body["userName"],
            user_email: req.body["userEmail"],
            user_password: hashedPassword
        });
        newUser.save()
        .then (result=>{
            req.session.userID = req.body["userEmail"];
            console.log("[POST] `/sign_up`",req.session.userID);
            res.redirect('/');
        })
        .catch (error=>{
            console.log("Error: ",error);
            res.redirect('/sign_up')
        });
    });
});

app.post('/login', (req, res)=>{
    User.findOne({user_email: req.body["userEmail"]})
    .then (user=>{
        if (user) {
            // console.log('Found User:', user);
            bcrypt.compare(req.body["userPassword"], user.user_password, (err, result) => {
                if (err) throw err;
                if (result) {
                    // console.log('Login successful');
                    req.session.userID = req.body["userEmail"];
                    res.redirect('/');
                } else {
                    // console.log('Invalid password');
                    res.render('sign_up.ejs', {error: 'Invalid Password'});
                }
            });
        } else {
            // console.log('User not found');
            res.render('sign_up.ejs', {error: 'User not found'});
        }
    })
    .catch (err=>{
        console.error('Error:', err);
    });
});

app.get('/logout', (req, res)=>{
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return;
        }
        res.redirect('/');
    });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});