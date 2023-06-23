const express=require('express');
const app=express();
const bodyParser = require('body-parser');
const {mongoose}=require('./db/mongoose.js');
const jwt=require('jsonwebtoken');
//load model
const {Class,Student,User}=require('./db/models');



app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // Update to match the domain you will make the request from
    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE'
    );
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id'
    );
    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );
    next();
});

//load middleware


//check wherever the request has a jwt

let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            // there was an error
            // jwt is invalid - * DO NOT AUTHENTICATE *
            res.status(401).send(err);
        } else {
            // jwt is valid
            req.user_id = decoded._id;
            next();
        }
    });
}








app.use(bodyParser.json());


// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}

/* route handlers */

app.get('/classes',authenticate,(req, res)=>{

    //display all class that belong to user
    Class.find({

        _userId:req.user_id

    }).then((listClass)=>{
        res.send(listClass);

    });

});
app.post('/add',authenticate,(req, res)=>{
    let name=req.body.name;
    let newClass = new Class({
        name,
        _userId:req.user_id
    });
    newClass.save().then((listDoc)=>{
        res.send(listDoc);
    })

});
app.patch('/classes/:id',authenticate,(req, res)=>{
    Class.findOneAndUpdate({_id:req.params.id,_userId:req.user_id},{
        $set:req.body
    }).then(()=> {
        res.sendStatus(200);


    });



});
app.delete('/classes/:id',authenticate,(req, res)=>{

    Class.findOneAndRemove({
      _id:req.params.id,
        _userId:req.user_id
    }).then((removedClassed)=>{
        res.send(removedClassed);
        //delet all the student
        deleteStudentsFromClass(removedClassed._id);
    })

});
app.get('/classes/:classId/students',authenticate,(req, res)=>{

    Student.find({
        _classId:req.params.classId
    }).then((students)=>{

        res.send(students);

    })
});
app.post('/classes/:classId/students',authenticate,(req, res)=>{

    //if the user
    Class.findOne({
        _id:req.params.classId,
        _userId:req.user_id
    }).then((clas)=>{
        if(clas)

        {
            //can create
            return true;

        }
        return false;



    }).then((canCreateStudent)=>{
        if(canCreateStudent)
        {
            let newStudent=new Student({
                nom: req.body.nom,
                prenom:req.body.prenom,
                _classId:req.params.classId
            });
            newStudent.save().then((newstudentdocument)=>{
                res.send(newstudentdocument);


            });

        } else {
            res.sendStatus(404);



        }

    })

});
app.patch('/classes/:classId/students/:studentId',authenticate,(req, res)=>{

    Class.findOne({
        _id : req.params.classId,
        _userId : req.user_id

    }).then((list)=>{
        if(list)
        {
            return true;

        }

        return false;
    }).then((canUpdate)=>{

        if(canUpdate)
        {
            //currently authenticated user can update

            Student.findOneAndUpdate({
                _id:req.params.studentId,
                _classId:req.params.classId
            },{
                $set:req.body
            }).then(()=>{
                // res.sendStatus(200);

                res.send({ message:'Updated Successfully'});
            })


        } else {
            res.sendStatus(404);
        }
    })




});
/*app.delete('/classes/:classId/students/:studentId',authenticate,(req, res)=>{
    Class.findOne({
        _id : req.params.classId,
        _userId : req.user_id

    }).then((list)=>{
        if(list)
        {
            return true;

        }

        return false;
    }).then((canDelete)=>{


        if(canDelete)
        {

            Student.findOneAndRemove({
                _id:req.params.studentId
            }).then((removedStudent)=>{
                res.send(removedStudent);
            })



        });

    })


        }
        else {

            res.sendStatus(404);
        }







});*/

app.delete('/classes/:classId/students/:studentId', authenticate, (req, res) => {
    Class.findOne({
        _id: req.params.classId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            return true;
        }
        return false;
    }).then((canDelete) => {
        if (canDelete) {
            Student.findOneAndRemove({
                _id: req.params.studentId
            }).then((removedStudent) => {
                res.send(removedStudent);
            });
        } else {
            res.sendStatus(404);
        }
    });
});



app.get('/classes/:classId/students/:studentId',(req, res)=>{




    Student.findOne({
        _id:req.params.studentId,
        _classId:req.params.classId

    }).then((task)=>{
        res.send(task);


    })
});

/* routes forr user*/
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})



app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we geneate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

app.get('/users/me/access-token', verifySession, (req, res) => {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})


/*helper methods*/
let deleteStudentsFromClass = (_classId) => {
    Student.deleteMany({
        _classId
    }).then(() => {
        console.log("Students from " + _classId + " were deleted!");
    })
}





app.listen(3000,() =>{

    console.log("Server is listening on port 3000");


})
