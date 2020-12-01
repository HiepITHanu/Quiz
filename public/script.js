let startBtn = document.querySelector('#startBtn');
let introduction = document.querySelector('#introduction');
let attemptQuiz = document.getElementById('attempt-quiz');
let submitBtn = document.querySelector('#submit_btn');
let reviewQuiz = document.getElementById('review-quiz');
let submit_box = document.getElementById('submit_box');
let tryagainBtn = document.getElementById('tryagainBtn');
let modal = document.getElementById("myModal");
let idAttemp;

startBtn.addEventListener('click', () => {
    introduction.style.display = 'none';
    attemptQuiz.style.display = 'block';
    renderQuestions();
    attemptQuiz.scrollIntoView();
});

submitBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    modal.style.display = 'none';
});

document.getElementById('okBtn').addEventListener('click', () => {
    submit_box.style.display = 'none';
    modal.style.display = 'none';
    reviewQuiz.style.display = 'block';
    calculateScore();
    reviewQuiz.scrollIntoView();
});

tryagainBtn.addEventListener('click', () => {
    reviewQuiz.style.display = 'none';
    submit_box.style.display = 'flex';
    renderQuestions();
    attemptQuiz.scrollIntoView();
});

async function postData(url = '') {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
    });
    return response.json();
}

async function getData(url) {
    const res = await fetch(url, {
        method: 'GET',
    });
    return res.json();
}

function renderData(data) {
    let question = document.querySelectorAll('.question');
    for (let i = 0; i < question.length; i++) {
        question[i].textContent = data.questions[i].text;

        let answersOption = data.questions[i].answers;
        let radioItem = question[i].parentNode.children[2];
        radioItem.id = data.questions[i]._id;
        radioItem.innerHTML = '';
        // console.log(radioItem)
        // tag option: contain id's question
        // console.log(radioItem)

        for (let j = 0; j < answersOption.length; j++) {
            let radioDiv = document.createElement('div');
            radioDiv.classList.add('radio')

            let radioInput = document.createElement('input')
            radioInput.id = 'radio-1';
            radioInput.name = ('question' + i)
            radioInput.type = 'radio'

            let label = document.createElement('label');
            label.classList.add('radio-label');
            label.textContent = answersOption[j];

            let divv = document.createElement('div');

            divv.appendChild(radioInput);
            divv.appendChild(label);

            radioDiv.appendChild(divv)
            radioItem.appendChild(radioDiv);
        }
    }

    let radio = document.querySelectorAll('.radio')

    for (let i of radio) {
        // console.log(i)
        i.addEventListener('click', () => {
            i.children[0].children[0].checked = 'true'
            //update attemtp with user's answer -> no score
            
        })
    }
}

function renderQuestions() {
    if (localStorage.getItem('attemptId') == null) {
        postData('/attempts')
            .then(data => {
                // console.log(data);
                idAttemp = data._id;
                //store the Attempt _id into localStorage
                localStorage.setItem('attemptId', idAttemp);
                renderData(data);

            }
            );
    } else {
        // console.log(localStorage.getItem('attemptId'));
        getData(`/attempts/${localStorage.getItem('attemptId')}`).then(data => {
            idAttemp = data._id;
            renderData(data);
        });
    }
}
async function postAnswers(url = '', answers = {}) {
    // remove localStorage
    localStorage.removeItem('attemptId');

    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(answers)
    });
    return response.json();
}
function getAnswersObject(){
    let radioDivs = document.querySelectorAll('.options');
    let answersOption = {
        answers: {

        }
    };

    for (let i = 0; i < radioDivs.length; i++) {
        let inputEachQuestion = radioDivs[i].querySelectorAll('.radio input');
        // console.log(radioDivs[i])
        for (let j = 0; j < inputEachQuestion.length; j++) {
            if (inputEachQuestion[j].checked == true) {
                // console.log(inputEachQuestion[j])
                answersOption.answers[radioDivs[i].id] = j;
            }
        }
    }
    
    return answersOption;
}

function calculateScore() {
    
    let answersOption = getAnswersObject();
    // console.log(answersOption);

    postAnswers(`/attempts/${idAttemp}/submit`, answersOption)
        .then(data => {
            // console.log(data)
            let optionsDiv = document.querySelectorAll('.options');
            // console.log(data.correctAnswers);
            for (let i in data.correctAnswers) {
                for (let j = 0; j < optionsDiv.length; j++) {
                    if (i == optionsDiv[j].id) {
                        let span = document.createElement('span');
                        span.classList.add('correctSpan')
                        span.textContent = 'Correct answer'
                        // console.log(optionsDiv[j].children[data.correctAnswers[i]])
                        optionsDiv[j].children[data.correctAnswers[i]].appendChild(span)
                        optionsDiv[j].children[data.correctAnswers[i]].setAttribute('hasSpanCorrectAnswer', 'true')
                        optionsDiv[j].children[data.correctAnswers[i]].style.backgroundColor = '#d4edda'
                    }
                }
            }

            for (let i = 0; i < optionsDiv.length; i++) {
                for (let j = 0; j < optionsDiv[i].children.length; j++) {
                    if (optionsDiv[i].children[j].children[0].children[0].checked == true
                        && optionsDiv[i].children[j].getAttribute('hasspancorrectanswer') != 'true') {
                        let span = document.createElement('span');
                        span.classList.add('correctSpan')
                        span.textContent = 'Your answer'
                        optionsDiv[i].children[j].style.backgroundColor = '#f8d7da'
                        optionsDiv[i].children[j].appendChild(span)
                    }
                }
            }

            document.querySelector('#score').textContent = `${data.score}/10`;
            document.querySelector('#percentage').textContent = `${data.score * 10}%`;
            document.querySelector('#suggest').textContent = data.scoreText;
        }
        );
}

