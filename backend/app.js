const express=require('express');
const app=express();
const bodyParser = require('body-parser');
const {mongoose}=require('./db/mongoose.js');
//load model
const {Class,Student}=require('./db/models');

//load middleware
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* route handlers */

app.get('/classes',(req, res)=>{
    Class.find({}).then((listClass)=>{
        res.send(listClass);

    });

});
app.post('/add',(req, res)=>{
    let name=req.body.name;
    let newClass = new Class({
        name
    });
    newClass.save().then((listDoc)=>{
        res.send(listDoc);
    })

});
app.patch('/classes/:id',(req, res)=>{
    Class.findOneAndUpdate({_id:req.params.id},{
        $set:req.body
    }).then(()=> {
        res.sendStatus(200);

    });



});
app.delete('/classes/:id',(req, res)=>{

    Class.findOneAndRemove({
      _id:req.params.id
    }).then((removedClassed)=>{
        res.send(removedClassed);
    })

});
app.get('/classes/:classId/students',(req, res)=>{

    Student.find({
        _classId:req.params.classId
    }).then((students)=>{

        res.send(students);

    })
});
app.post('/classes/:classId/students',(req, res)=>{
    let newStudent=new Student({
        nom: req.body.nom,
        prenom:req.body.prenom,
        _classId:req.params.classId
    });
    newStudent.save().then((newstudentdocument)=>{
        res.send(newstudentdocument);


    });
});
app.patch('/classes/:classId/students/:studentId',(req, res)=>{
    Student.findOneAndUpdate({
        _id:req.params.studentId,
        _classId:req.params.classId
    },{
        $set:req.body
    }).then(()=>{
        res.sendStatus(200);
    })


});
app.delete('/classes/:classId/students/:studentId',(req, res)=>{
    Student.findOneAndRemove({
        _id:req.params.studentId
    }).then((removedStudent)=>{
        res.send(removedStudent);
    })
});
app.get('/classes/:classId/students/:studentId',(req, res)=>{
    Student.findOne({
        _id:req.params.studentId,
        _classId:req.params.classId

    }).then((task)=>{
        res.send(task);


    })
});
app.listen(3000,() =>{

    console.log("Server is listening on port 3000");


})