const fs = require('fs');
const path = require('path');

const deleteFile = (fileName) => {
    
    const imgPath = path.join(__dirname,`../${fileName}`);
    console.log("pathName",imgPath);
    fs.unlink(imgPath,(err) =>{
        if(err){
            throw new Error(err);
        }
    })
}

exports.deleteFile = deleteFile;