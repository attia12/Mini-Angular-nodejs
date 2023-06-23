const mongoose=require('mongoose');
const _ =require('lodash');
const jwt =require('jsonwebtoken');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
//jwtsecret
const jwtSecret="96749759035368333346attia2841680791";
const UserSchema=new mongoose.Schema({

    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }]

});
UserSchema.methods.toJSON=function () {
    const user =this;
    const userObject=user.toObject();

    return _.omit(userObject,['password','sessions']);


}
//generate access token
UserSchema.methods.generateAccessAuthToken=function (){
    const user=this;
    return new Promise((resolve, reject)=>{
        //create jwt token and return it
        jwt.sign({_id: user._id.toHexString()},jwtSecret,{expiresIn: "15s" },(err,token)=>{
            if(!err)
            {
                resolve(token);

            }else {
                reject();

            }

        })
    })
}
//create session
UserSchema.methods.createSession=function (){
    let user=this;
    return user.generateRefreshAuthToken().then((refreshToken)=>{

         return saveSessionToDatabase(user,refreshToken);
    }).then((refreshToken)=>{
        return refreshToken;

    }).catch((e)=>{
        return Promise.reject('failed to save session to database\n'+e);
    })
}
/* HELPER METHODS */
UserSchema.methods.generateRefreshAuthToken=function (){
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64,(err,buf)=>{
            if(!err)
            {
                let token = buf.toString('hex');
                return resolve(token);

            }
        })


    })
}
//session =refreshtoken+expire time
let saveSessionToDatabase=(user,refreshToken)=>{
    //save session to database
    return new Promise((resolve, reject) => {
        let expiresAt=generateReffreshTokenExpiryTime();
        user.sessions.push({'token':refreshToken,expiresAt});
        //save user document
        user.save().then(()=>{
            return resolve(refreshToken);
        }).catch((e)=>{
            reject(e);
        });

    })
}


let generateReffreshTokenExpiryTime=() =>{
    let daysUntilExpire = "10";
    let secondsUntilExpire = ((daysUntilExpire * 24) * 60) * 60;
    return ((Date.now() / 1000) + secondsUntilExpire);

}
/*Model satatic method*/

UserSchema.statics.getJWTSecret = () => {
    return jwtSecret;
}

UserSchema.statics.hasRefreshTokenExpired=(expiredAt)=>{
    let secondsSinceEpoch=Date.now() / 1000; //get seconds
    if(expiredAt > secondsSinceEpoch)

    {
        //hasnt expired
        return false;
    }


    else {
        return true;
    }

}
UserSchema.statics.findByIdAndToken = function (_id, token) {
    // finds user by id and token
    // used in auth middleware (verifySession)

    const User = this;

    return User.findOne({
        _id,
        'sessions.token': token
    });
}
UserSchema.statics.findByCredentials=function (email,password){
    let User=this;
    return User.findOne({email}).then((user)=>{
        if(!user) return Promise.reject();

        return new Promise((resolve,reject)=>{

   bcrypt.compare(password,user.password,(err,res)=>{
       if(res) resolve(user);
       else {
           reject();
       }
   });


        })

    });

}

/*mmiddleware*/
UserSchema.pre('save', function (next) {
    let user = this;
    let costFactor = 10;
    //we use bcryt to determine the number of hashing rounds=9adeh wa9t bech no93edou nhashiw fel passwoed

    if (user.isModified('password')) {
        // if the password field has been edited/changed then run this code.

        // Generate salt and hash password
        bcrypt.genSalt(costFactor, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});
const User=mongoose.model('User',UserSchema);

module.exports = {User}