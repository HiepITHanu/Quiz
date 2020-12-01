const express = require('express');
const app = express();
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectID;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static('public'));
//Routes

app.post('/attempts', async (req, res) => {
    try {
        const questions = await db.collection('questions').aggregate([{ $sample: { size: 10 } }]).toArray();

        let attempt = generateAttempt(questions);            
        // console.log(attempt);
        const insertedAttempt = await db.collection('attempts').insertOne(attempt);
        const attemptt = await db.collection('attempts').findOne({'_id': ObjectId(insertedAttempt.insertedId)})
        const result = generateAttemptWithoutCorrectAnswer(attemptt);
        // console.log(result);
        res.json(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/attempts/:id/submit', async (req, res) => {
    try{
        const idAttempt = req.param('id');
        const userAnswer = req.body;

        const attempt = await db.collection('attempts').findOne({ "_id": ObjectId(idAttempt) });

        let result = updateAttempt(attempt, userAnswer);

        const updatedAttempt = await db.collection('attempts').update({ "_id": ObjectId(idAttempt) }, result);

        res.status(200).json(result);
    }catch(err){
        res.status(500).send(err);
    }
});

app.get('/attempts/:id', async (req, res) => {
    const idAttempt = req.param('id');
    const attempt = await db.collection('attempts').findOne({ '_id': ObjectId(idAttempt) });
    const result = generateAttemptWithoutCorrectAnswer(attempt);
    // console.log(attempt);
    res.json(result);
});

app.patch('/attempts/:id', async (req, res) => {
    let id = req.param('id');
    let userAnswer = req.body;
    // console.log(id)
    const updAttempt = await db.collection('attempts').updateOne({'_id': ObjectId(id)}, {$set: {answers: userAnswer}});

    res.status(200);
});

let db = null;
async function startServer() {
    const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/a2');
    db = client.db();
    console.log('connected to db.');

    await app.listen(4200);
    console.log('Listening on port 4200!');
}
startServer();

function updateAttempt(attempt, userAnswer) {
    attempt['answers'] = userAnswer['answers'];
    attempt['completed'] = true;

    let score = 0;
    let text;
    for (let i in userAnswer['answers']) {
        if (userAnswer['answers'][i] == attempt['correctAnswers'][i]) {
            score++;
        }
    }

    if (score < 5) {
        text = 'Practice more to improve it :D';
    } else if (score >= 5 && score < 7) {
        text = 'Good, keep up!';
    } else if (score >= 7 && score < 9) {
        text = 'Well done!'
    } else if (score >= 9 && score <= 10) {
        text = 'Perfect!!'
    }

    attempt['score'] = score;
    attempt['text'] = text;

    return attempt;
}

function generateAttemptWithoutCorrectAnswer(attemptObject) {
    // console.log(attemptObject.questions);
    let attempt = {
        _id: attemptObject._id,
        questions: [],
        completed: false,
        date: attemptObject.date
    };

    for (let i = 0; i < attemptObject.questions.length; i++) {
        let obj = {};
        obj['_id'] = attemptObject.questions[i]['_id'];
        obj['text'] = attemptObject.questions[i]['text'];
        obj['answers'] = attemptObject.questions[i]['answers'];
        attempt.questions.push(obj);
    }

    return attempt;
}

function generateAttempt(questionsArray) {
    let attempt = {
        questions: [],
        correctAnswers: {},
        completed: false,
        date: Date.now()
    };

    for (let i = 0; i < questionsArray.length; i++) {
        attempt.questions[i] = questionsArray[i];
        attempt['correctAnswers'][`${questionsArray[i]["_id"]}`] = questionsArray[i]['correctAnswer'];
    }

    return attempt;
}