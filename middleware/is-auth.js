module.exports = (req,res,next) => {
    if(req.session.isLoggedIn === undefined) {
        return res.redirect('/login');
    }
    next();
}