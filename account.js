const sgMail =  require('@sendgrid/mail');

const sendGridApiKey = process.env.SendGridApiKey;



sgMail.setApiKey(sendGridApiKey);



exports.sendMail  = (email) => {
    sgMail.send({
        from:'vivek.yadav@slrtce.in',
        to:email,
        subject:"Acount created successfully",
        text:"Hello Your account have been created successfully I hope now you can enjoy all of ours services",
    });
}



exports.resetEmail = (email,token) => {
    sgMail.send({
        from:'vivek.yadav@slrtce.in',
        to:email,
        subject:"Reset Password",
        html: `
            <p>You requested for reset password</p>
            <p>Click this <a href = "http://localhost:3000/reset/${token}"> link to reset your password</p>
        `
    });
}
