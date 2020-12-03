const express = require('express');
const {check,body} = require('express-validator');
const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
        body('email',"Please provide a valid email").isEmail().normalizeEmail().custom(async (value,{req}) => {
            const existingUser = await  User.findOne({email:value});
            if(!existingUser)     {
                throw new Error("Invalid credentials validator");
            }
            return true;
        })
    ] 
, authController.postLogin);

router.post('/signup',[
    check('email',"Please provide a valid email").isEmail().normalizeEmail().custom(async (value,{req}) => {
        const existingUser = await  User.findOne({email:value});
        if(existingUser) {
            console.log("yes");
            throw new Error("Email already exist please choose other")
        }
        return true;
    }),
    body('password','Please enter a password with min length of 5').trim().isLength({min:5}),
    body('confirmPassword',"Password mismatch").trim().custom((value ,{req}) => {
        if(value !== req.body.password) {
            return false;
        }
        return true;
    })
    ], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);


router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;