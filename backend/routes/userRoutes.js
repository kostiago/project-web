const router = require('express').Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');

//middlewares

const verifyToken = require('../helpers/check-token');


// helpers
const getUserByToken = require('../helpers/get-user-by-token');


//get an user

router.get('/:id', verifyToken, async (req, res) => {

    const id = req.params.id;
    
    //verify the user exists
    try {

        const user = await User.findOne({_id: id}, {password:0});
        res.json({error: null, user});

    }catch(err) {
        return res.status(400).json({error: 'Usuario não encontrado!'});
    }
});

//update an user
router.patch('/', verifyToken, async (req, res) =>{

    const token = req.header("auth-token");
    const user = await getUserByToken(token);
    const userReqId = req.body.id;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const userId = user._id.toString();

    //check if user id is equal token user id

    if(userId != userReqId){
        res.status(401).json({error: "Acesso negado"});
    }

    //create an user object

    const updateData = {
        name: req.body.name,
        email: req.body.email
    };

    // check if password match
    if(password != confirmPassword){
        res.status(401).json({error: "Senhas não iguais"});
    }
    // change password
    else if(password == confirmPassword && password != null){

        // creating password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // add password to data
        updateData.password = passwordHash
    }

    try {
        
        const updateUser = await User.findOneAndUpdate({_id: userId}, {$set: updateData}, {new: true});
        res.json({error: null, msg: "Usuário atualizado com sucesso!", data: updateUser});


    }catch(error){
        res.status(400).json({error});
    }

});

module.exports = router;