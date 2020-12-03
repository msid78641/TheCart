const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail= require('../account');
const {validationResult} = require('express-validator');



const User = require('../models/user');


exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,    
      errorMessage:errors.array()[0].msg,
      oldInput:{
        email,
        password,
      },
      validationErrors:errors.array()
    })
  }

  bcrypt.hash(password,12).then(hashedPassword => {
      const userObj = new User({
        email:email,
        password:hashedPassword,
        cart:{items:[]}
      })
      return userObj.save();

    }).then(result => {
      res.redirect('/login')
      sgMail.sendMail(email);
    }).catch(err => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req,res,next) => {
  crypto.randomBytes(32,(err,buffer) => {
    if(err){
      // console.log(err);
      req.flash('error' , 'No account with that email found');
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email:req.body.email}).then(user => {
      if(!user) {
        req.flash('error','No account with that email exist');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpire = Date.now() + 3600000;
      return user.save();
      
    }).then(obj => {
      res.redirect('/');
      sgMail.resetEmail(req.body.email,token);
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
  })
}

exports.getNewPassword = (req,res,next) => {
  const token  = req.params.token;
  
  User.findOne( {resetToken:token, resetTokenExpire: {$gt:Date.now() } } ).then(user => {
    let message = req.flash('error');
    if(message.length > 0) {
      message = message[0];
    }else {
      message = undefined;
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      isAuthenticated: false,
      errorMessage:message,
      userId:user._id,
      token:token
    });

  }).catch(err => {
    const error = new Error(err);
    return next(error);
  });
}


exports.postNewPassword  = (req,res,next) => {
  const password  =req.body.password;
  const token = req.body.token;
  const userId = req.body.userId;
  let resetUser;

  User.findOne({resetToken:token,_id:userId, resetTokenExpire:{$gt:Date.now() } } ).then(user => {
    resetUser = user;
    return bcrypt.hash(password,12);
  }).then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpire = null;
    return resetUser.save();
  }).then(result => {
    res.redirect('/login');
  }).catch(err => {
    const error = new Error(err);
    return next(error);
  });

}