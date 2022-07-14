const router = require('express').Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');

const Event = require('../models/event');
const User = require('../models/user');

//define file storage
const diskStorage = require('../helpers/file-storage');
const upload = multer({storage: diskStorage});

//middleware
const verifyToken = require('../helpers/check-token');

//helpers
const getUserByToken = require('../helpers/get-user-by-token');

//create a new Event
router.post('/', verifyToken, upload.fields([{name: "photos"}]), async (req, res) => {

    // requisition data
    const title = req.body.title;
    const description = req.body.description;
    const eventDate = req.body.event_date;

    let files = [];

    if(req.files){
        files = req.files.photos;
    }

    //validations
    if(title == "null" || description == "null" || eventDate == "null") {
        return res.status(400).json({error: "Campos Obrigatorios: nome, descrição e data."});
    }

    // verify user
    const token = req.header("auth-token");
    const userByToken = await getUserByToken(token);
    const userId = userByToken._id.toString();
    
    try{

        const user = await User.findOne({  _id: userId});

        //  create photos array with image path
        let photos = [];

        if(files && files.length > 0){

            files.forEach((photo, i) => {
                photos[i] = photo.path;
            })
        }

        const event = new Event({

            title: title,
            description: description,
            eventDate: eventDate,
            photos: photos,
            private: req.body.private,
            userId: user._id.toString()

        });

        try{
            const newEvent = await event.save();
            res.json({error: null, msg: "Evento criado com sucesso!", data: newEvent});

        }catch(error){
            return res.status(400).json({error});
        }

    }catch(error){
        return res.status(400).json({error: 'Acesso negado.'});
    }
});

// get all public events

router.get('/all', async (req, res) => {
    try{
        const events = await Event.find({private:false}).sort([['_id', -1]]);
        res.json({error: null, events: events});

    }catch(error){
        return res.status(400).json({error});
    }
});

// get all user events 
router.get('/userevents', verifyToken, async (req, res) => {
    try {
        const token = req.header("auth-token");
        const user = await getUserByToken(token);
        const userId = user._id.toString()

        const events = await Event.find({userId: userId});
        res.json({error: null, events: events});

    } catch(error){
        return res.status(400).json({error});
    }
});

// get user Event
router.get('/userevent/:id', verifyToken, async (req, res) => {
    try {

        const token = req.header("auth-token");
        const user = await getUserByToken(token);
        const userId = user._id.toString();
        const eventId = req.params.id;

        const event = await Event.findOne({_id: eventId, userId: userId});
        res.json({error: null, event: event});

    } catch(error){
        return res.status(400).json({error});
    }
});

// get event (public or private)
router.get('/:id', async (req, res) => {
    
    //find event
    try {

        const id = req.params.id;
        const event = await Event.findOne({_id: id});

        //public event
        if (event.private === false) {
            res.json({error: null, event: event});
        }
        //private event
        else {

            const token = req.header("auth-token");
            const user = await getUserByToken(token);

            const userId = user._id.toString();
            const eventUserId = event.userId.toString();

            // check if user id is equal to event user id
            if (userId == eventUserId){
                res.json({error: null, event: event});
            }
        }

    } catch(error){
        return res.status(400).json({error: "Esse evento não existe!"});
    }
});

// delete a event
router.delete('/', verifyToken, async (req, res) => {
    
    const token = req.header("auth-token");
    const user = await getUserByToken(token);
    const eventId = req.body.id;
    const userId = user._id.toString();

    try {

        await Event.deleteOne({_id: eventId, userId: userId });
        res.json({error: null, error: "Evento apagado com sucesso"});
        
    } catch (error) {
        res.status(400).json({ error: 'Acesso negado!'});
    }
});

//update a event
router.put('/', verifyToken, upload.fields([{name:'photos'}]), async (req, res) => {

    //requision body
    const title = req.body.title;
    const description = req.body.description;
    const eventDate = req.body.eventDate;
    const eventId = req.body.id;
    const eventUserId = req.body.user_id;

    let files = [];

    if(req.files){
        files = req.files.photos;
    }

    //validations
    if(title == 'null' || description == 'null' || eventDate == 'null'){

        return res.status(400).json({error: "Campos Obrigatorios: nome, descrição e data."});
    }

    //verify user
    const token = res.header('auth-token');
    const userByToken = await getUserByToken(token);
    const userId = userByToken._id.toString();

    if (userId != eventUserId){
        return res.status(400).json({error: 'Acesso negado!'});
    }

    // buil event object
    const event = {
        id: eventId,
        title: title,
        description: description,
        eventDate: eventDate,
        private: req.body.private,
        userId: userId
    }

    //create photos array with image path
    let photos = [];

    if (files && files.length > 0){
        
        files.forEach((photo, i) =>{
            photos[i] = photo.path;
        })

        event.photos = photos;
    }

    //returns updated data
    try {
        
        const updatedEvent = await Event.findOneAndUpdate({_id: eventId, userId: userId}, {$set: event}, {new: true});
        res.json({error: null, msg:'Evento atualizado com sucesso', data: updatedEvent});

    } catch (error) {
        res.status(400).json({error});
    }

});

module.exports = router;