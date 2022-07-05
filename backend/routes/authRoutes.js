const router = require("express").Router();
const bcrypt = require("bcrypt");
const { response } = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/user");


// register a new user

router.post("/register", async(req, res) => {
    
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // check for password required fields
    if(name == null || email == null || password == null || confirmPassword == null){
        return res.status(400).json({error: "Por favor, preencha todos os dados."});
    }

    // check if password match
    if(password != confirmPassword){
        return res.status(400).json({error: "As senhas não são iguais!"});
    }

    // check if email exists
    const emailExists = await User.findOne({email: email});

    if(emailExists){
        return res.status(400).json({error: "Email já existe!"});
    }
    //create password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = new User({
        name: name,
        email: email,
        password: passwordHash
    });

    try {
        const newUser = await user.save();

        const token = jwt.sign(
            {
                name: newUser.name,
                id: newUser._id
            },
            "secret"
        );

        res.json({error: null, msg:"Cadastro realizado com sucesso", token:token, userId:newUser._id});

    }catch(error){
        res.status(400).json({error});
    }
});

// login an user
router.post('/login', async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // check if user already exists
    const user = await User.findOne({email: email});
    if(!user) {
        return res.status(400).json({error: "Email não cadastradoo!"});
    }
    // match the password
    const checkPassword = await bcrypt.compare(password, user.password);

    if(!checkPassword) {
        return res.status(400).json({error: "Senha Invalida!"});
    }

    const token = jwt.sign(
        {
            name: user.name,
            id: user._id,
        },
        "secret"
    );

    res.json({error: null, msg: "Você está autenticado!", token:token, userId: user._id});

});
module.exports = router;